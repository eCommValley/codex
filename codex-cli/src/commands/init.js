import {
  appendAuditEntry,
  ledgerExists,
  writeBankTransactions,
  writeConfig,
  writeJournal,
  writeRules,
} from "../storage.js";

function defaultChartOfAccounts(currency) {
  return [
    { code: "1000", name: "Bank", type: "asset", role: "bank" },
    { code: "1100", name: "Cash", type: "asset" },
    { code: "1300", name: "Accounts Receivable", type: "asset" },
    { code: "1400", name: "Accounts Payable", type: "liability" },
    { code: "1600", name: "VAT Receivable", type: "asset" },
    { code: "1610", name: "VAT Payable", type: "liability" },
    { code: "2000", name: "Sales 21%", type: "income", vat_rate: "HIGH" },
    { code: "2010", name: "Sales 9%", type: "income", vat_rate: "LOW" },
    { code: "3000", name: "Other Income", type: "income" },
    { code: "4000", name: "Travel Expenses", type: "expense", vat_rate: "LOW" },
    { code: "4100", name: "Office Supplies", type: "expense", vat_rate: "HIGH" },
    { code: "4200", name: "Cost of Goods Sold", type: "expense" },
    { code: "4700", name: "Miscellaneous Expenses", type: "expense" },
  ].map((account) => ({ ...account, currency }));
}

function defaultVatProfile() {
  return {
    profile_id: "NL-2025",
    rates: [
      {
        id: "HIGH",
        label: "High 21%",
        percentage: 0.21,
        on_sales_account: "1610",
        on_purchases_account: "1600",
      },
      {
        id: "LOW",
        label: "Low 9%",
        percentage: 0.09,
        on_sales_account: "1610",
        on_purchases_account: "1600",
      },
      {
        id: "ZERO",
        label: "Zero 0%",
        percentage: 0,
        on_sales_account: "1610",
        on_purchases_account: "1600",
      },
    ],
  };
}

function createConfig(options) {
  const companyName = options.company || "Example BV";
  const country = options.country || "NL";
  const currency = options.currency || "EUR";
  const vatProfileId = options.vatProfile || "NL-2025";

  return {
    company: {
      name: companyName,
      country,
      currency,
    },
    vat: {
      ...defaultVatProfile(),
      profile_id: vatProfileId,
    },
    accounts: {
      bank_account_code: "1000",
      retained_earnings_account: "3000",
    },
    chart_of_accounts: defaultChartOfAccounts(currency),
    policies: {
      booking_requires_rule: true,
      review_before_lock: true,
    },
    periods: {
      closed: [],
    },
    reporting: {
      currency,
      locale: "en-US",
    },
  };
}

function defaultRules() {
  return {
    version: 1,
    rules: [
      {
        id: "rule_ns_travel",
        label: "NS train travel",
        conditions: {
          counterparty_contains: "NS",
        },
        postings: {
          account: "4000",
          vat_rate: "LOW",
          memo: "Rail travel",
        },
      },
      {
        id: "rule_bol_supplies",
        label: "Office supplies",
        conditions: {
          counterparty_contains: "BOL",
        },
        postings: {
          account: "4100",
          vat_rate: "HIGH",
          memo: "Office purchase",
        },
      },
    ],
  };
}

export const initCommand = {
  path: ["init"],
  description: "Initialise a Codex Ledger workspace with company, VAT and chart of accounts settings.",
  usage: "codex init [--company <name>] [--country <code>] [--currency <code>] [--vat-profile <id>] [--force]",
  options: [
    ["--company <name>", "Company name to use in the ledger."],
    ["--country <code>", "Two-letter country code; defaults to NL."],
    ["--currency <code>", "Three-letter currency code used for reporting."],
    ["--vat-profile <id>", "Identifier for the VAT profile to activate."],
    ["--force", "Overwrite existing configuration if a ledger already exists."],
  ],
  examples: [
    "codex init --company 'Sample BV' --country NL --currency EUR",
  ],
  async run({ cwd, options }) {
    const exists = await ledgerExists(cwd);
    if (exists && !options.force) {
      throw new Error("A ledger already exists in this directory. Pass --force to recreate it.");
    }
    const config = createConfig(options);
    await writeConfig(cwd, config);
    await writeBankTransactions(cwd, { version: 1, transactions: [] });
    await writeJournal(cwd, { version: 1, entries: [] });
    await writeRules(cwd, defaultRules());
    await appendAuditEntry(cwd, `initialised ledger for ${config.company.name}`);
    console.log(`Ledger ready for ${config.company.name}.`);
    console.log("Edit ./.ledger/ledger.yml to tailor accounts, VAT rates and policies.");
  },
};
