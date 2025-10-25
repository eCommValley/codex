import { formatCurrency } from "../lib/currency.js";
import { formatIsoDate, resolvePeriod } from "../lib/dates.js";
import { findAccount } from "../lib/ledger_utils.js";
import { readConfig, readJournal } from "../storage.js";

function sumLine(account, line, totals) {
  const debit = Number(line.debit || 0);
  const credit = Number(line.credit || 0);
  if (account.type === "income") {
    const amount = credit - debit;
    totals.income.set(account.code, (totals.income.get(account.code) || 0) + amount);
  } else if (account.type === "expense") {
    const amount = debit - credit;
    totals.expense.set(account.code, (totals.expense.get(account.code) || 0) + amount);
  }
}

function printCategory(title, map, currency) {
  if (map.size === 0) {
    console.log(`${title}: none`);
    return 0;
  }
  console.log(title);
  let total = 0;
  for (const [code, amount] of map.entries()) {
    console.log(`  ${code.padEnd(6, " ")} ${formatCurrency(amount, currency)}`);
    total += amount;
  }
  console.log(`  Total ${title.toLowerCase()}: ${formatCurrency(total, currency)}`);
  console.log("");
  return total;
}

export const reportProfitAndLossCommand = {
  path: ["report", "p&l"],
  description: "Produce a profit and loss statement for a given period.",
  usage: "codex report p&l --period <id>",
  options: [["--period <id>", "Fiscal period, e.g. 2025 or Q1-2025."]],
  examples: ["codex report p&l --period Q1-2025"],
  async run({ cwd, options }) {
    if (!options.period && (!options.from || !options.to)) {
      throw new Error("Provide --period or --from/--to for the report window.");
    }
    const window = resolvePeriod({ period: options.period, from: options.from, to: options.to });
    const [config, journal] = await Promise.all([readConfig(cwd), readJournal(cwd)]);
    const totals = { income: new Map(), expense: new Map() };
    for (const entry of journal.entries) {
      const date = new Date(entry.date);
      if (date < window.start || date > window.end) {
        continue;
      }
      for (const line of entry.lines) {
        const account = findAccount(config, line.account);
        if (!account) {
          continue;
        }
        sumLine(account, line, totals);
      }
    }
    const currency = config.reporting?.currency || config.company?.currency || "EUR";
    console.log(`Profit & Loss statement for ${formatIsoDate(window.start)} to ${formatIsoDate(window.end)}`);
    console.log("");
    const totalIncome = printCategory("Income", totals.income, currency);
    const totalExpense = printCategory("Expenses", totals.expense, currency);
    const net = totalIncome - totalExpense;
    console.log(`Net result: ${formatCurrency(net, currency)}`);
  },
};
