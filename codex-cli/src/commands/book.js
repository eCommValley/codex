import { roundToCents } from "../lib/currency.js";
import { formatIsoDate, resolvePeriod } from "../lib/dates.js";
import {
  getBankAccount,
  requireAccount,
  requireVatRate,
  isPeriodClosed,
} from "../lib/ledger_utils.js";
import {
  appendAuditEntry,
  createId,
  readBankTransactions,
  readConfig,
  readJournal,
  readRules,
  writeBankTransactions,
  writeJournal,
} from "../storage.js";

function matchesCondition(value, needle) {
  if (!needle) {
    return true;
  }
  if (!value) {
    return false;
  }
  return value.toLowerCase().includes(String(needle).toLowerCase());
}

function ruleMatchesTransaction(rule, transaction) {
  const conditions = rule.conditions || {};
  if (
    conditions.counterparty_contains &&
    !matchesCondition(transaction.counterparty, conditions.counterparty_contains)
  ) {
    return false;
  }
  if (
    conditions.description_contains &&
    !matchesCondition(transaction.description, conditions.description_contains)
  ) {
    return false;
  }
  if (conditions.amount_min !== undefined && transaction.amount < conditions.amount_min) {
    return false;
  }
  if (conditions.amount_max !== undefined && transaction.amount > conditions.amount_max) {
    return false;
  }
  if (conditions.direction === "in" && transaction.amount <= 0) {
    return false;
  }
  if (conditions.direction === "out" && transaction.amount >= 0) {
    return false;
  }
  return true;
}

function splitVat(amount, vatRate) {
  if (!vatRate || vatRate.percentage === 0) {
    return { base: Math.abs(amount), vat: 0 };
  }
  const gross = Math.abs(amount);
  const base = roundToCents(gross / (1 + vatRate.percentage));
  const vat = roundToCents(gross - base);
  return { base, vat };
}

function buildJournalLines({
  transaction,
  rule,
  account,
  bankAccount,
  vatRate,
}) {
  const amount = transaction.amount;
  const memo = rule.postings?.memo || transaction.description;
  const { base, vat } = splitVat(amount, vatRate);
  const lines = [];
  if (amount < 0) {
    // Expense: credit bank, debit expense (+ VAT receivable)
    lines.push({ account: bankAccount.code, debit: 0, credit: Math.abs(amount) });
    lines.push({ account: account.code, debit: base, credit: 0, memo });
    if (vat > 0) {
      lines.push({
        account: vatRate.on_purchases_account,
        debit: vat,
        credit: 0,
        memo: "VAT receivable",
        vat_rate_id: vatRate.id,
        vat_basis: base,
        vat_type: "input",
      });
    }
  } else {
    // Income: debit bank, credit revenue (+ VAT payable)
    lines.push({ account: bankAccount.code, debit: Math.abs(amount), credit: 0 });
    lines.push({ account: account.code, debit: 0, credit: base, memo });
    if (vat > 0) {
      lines.push({
        account: vatRate.on_sales_account,
        debit: 0,
        credit: vat,
        memo: "VAT payable",
        vat_rate_id: vatRate.id,
        vat_basis: base,
        vat_type: "output",
      });
    }
  }
  return lines;
}

export const bookCommand = {
  path: ["book"],
  description: "Apply booking rules to imported transactions and create double-entry journal entries.",
  usage: "ledger book [--period <period>] [--from <date> --to <date>] [--dry-run]",
  options: [
    ["--period <id>", "Specify a fiscal period such as Q1-2025 or 2025-03."],
    ["--from <date>", "Lower bound (inclusive) when not using --period."],
    ["--to <date>", "Upper bound (inclusive) when not using --period."],
    ["--dry-run", "Show the plan without writing journal entries."],
  ],
  examples: [
    "ledger book --period Q1-2025",
  ],
  async run({ cwd, options }) {
    const config = await readConfig(cwd);
    const rules = await readRules(cwd);
    const ruleList = Array.isArray(rules.rules) ? rules.rules : [];
    const bankData = await readBankTransactions(cwd);
    const journal = await readJournal(cwd);
    if (!options.period && (!options.from || !options.to)) {
      throw new Error("Provide --period or both --from and --to to limit which transactions are booked.");
    }
    const window = resolvePeriod({ period: options.period, from: options.from, to: options.to });
    const bankAccount = getBankAccount(config);
    const actionable = bankData.transactions.filter((transaction) => {
      if (transaction.status?.booked) {
        return false;
      }
      const bookingDate = new Date(transaction.booking_date);
      if (!Number.isFinite(bookingDate.getTime())) {
        return false;
      }
      if (bookingDate < window.start || bookingDate > window.end) {
        return false;
      }
      if (isPeriodClosed(config, transaction.booking_date)) {
        return false;
      }
      return true;
    });
    const createdAt = new Date().toISOString();
    let bookedCount = 0;
    let unmatched = 0;
    for (const transaction of actionable) {
      const matchingRule = ruleList.find((rule) => ruleMatchesTransaction(rule, transaction));
      if (!matchingRule) {
        unmatched += 1;
        continue;
      }
      if (!matchingRule.postings || !matchingRule.postings.account) {
        throw new Error(`Rule ${matchingRule.id} is missing a postings.account value.`);
      }
      const account = requireAccount(config, matchingRule.postings.account);
      const vatRate =
        matchingRule.postings.vat_rate !== null && matchingRule.postings.vat_rate !== undefined
          ? requireVatRate(config, matchingRule.postings.vat_rate)
          : null;
      const lines = buildJournalLines({
        transaction,
        rule: matchingRule,
        account,
        bankAccount,
        vatRate,
      });
      const entry = {
        id: createId("entry"),
        transaction_id: transaction.id,
        date: transaction.booking_date,
        memo: matchingRule.postings.memo || transaction.description,
        rule_id: matchingRule.id,
        lines,
        created_at: createdAt,
      };
      if (!options.dryRun) {
        journal.entries.push(entry);
        transaction.status = { booked: true, entry_id: entry.id };
      }
      bookedCount += 1;
      console.log(
        `${options.dryRun ? "Would book" : "Booked"} ${formatIsoDate(new Date(transaction.booking_date))} ` +
          `${transaction.description} (${transaction.amount.toFixed(2)} ${transaction.currency}) via ${matchingRule.id}`,
      );
    }
    if (!options.dryRun) {
      await writeJournal(cwd, journal);
      await writeBankTransactions(cwd, bankData);
      await appendAuditEntry(
        cwd,
        `booked ${bookedCount} transaction${bookedCount === 1 ? "" : "s"} between ${formatIsoDate(
          window.start,
        )} and ${formatIsoDate(window.end)}`,
      );
    }
    if (bookedCount === 0) {
      console.log("No transactions were booked. Add rules or adjust the period.");
    } else {
      console.log(`${options.dryRun ? "Previewed" : "Committed"} ${bookedCount} journal entries.`);
    }
    if (unmatched > 0) {
      console.log(`${unmatched} transaction${unmatched === 1 ? "" : "s"} did not match a rule.`);
    }
  },
};
