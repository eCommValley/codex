import { requireAccount, requireVatRate } from "../lib/ledger_utils.js";
import { appendAuditEntry, createId, readConfig, readRules, writeRules } from "../storage.js";

function buildConditions(options) {
  const conditions = {};
  if (options.counterparty) {
    conditions.counterparty_contains = options.counterparty;
  }
  if (options.description) {
    conditions.description_contains = options.description;
  }
  if (options.amountMin) {
    const minValue = Number(options.amountMin);
    if (Number.isNaN(minValue)) {
      throw new Error("--amount-min must be numeric.");
    }
    conditions.amount_min = minValue;
  }
  if (options.amountMax) {
    const maxValue = Number(options.amountMax);
    if (Number.isNaN(maxValue)) {
      throw new Error("--amount-max must be numeric.");
    }
    conditions.amount_max = maxValue;
  }
  if (options.direction) {
    const direction = options.direction.toLowerCase();
    if (!["in", "out"].includes(direction)) {
      throw new Error("--direction must be 'in' or 'out'.");
    }
    conditions.direction = direction;
  }
  if (Object.keys(conditions).length === 0) {
    throw new Error("Provide at least one condition (counterparty, description, amount range or direction).");
  }
  return conditions;
}

export const rulesAddCommand = {
  path: ["rules", "add"],
  description: "Create an automated booking rule for imported transactions.",
  usage: "ledger rules add --account <code> [--counterparty <text>] [--description <text>] [--vat-rate <id>] [--memo <text>]",
  options: [
    ["--account <code>", "Ledger account to debit/credit when the rule matches."],
    ["--vat-rate <id>", "VAT rate identifier defined in ledger.yml."],
    ["--counterparty <text>", "Match transactions containing this counterparty name."],
    ["--description <text>", "Match transactions containing this description snippet."],
    ["--amount-min <value>", "Only match when the amount is at least this value."],
    ["--amount-max <value>", "Only match when the amount is at most this value."],
    ["--direction <in|out>", "Restrict to incoming (positive) or outgoing (negative) cash flows."],
    ["--memo <text>", "Memo to attach to journal entries created by this rule."],
    ["--name <text>", "Friendly label for the rule."],
  ],
  examples: [
    "ledger rules add --account 4000 --counterparty NS --vat-rate LOW --memo 'Train travel'",
  ],
  async run({ cwd, options }) {
    if (!options.account) {
      throw new Error("--account is required.");
    }
    const config = await readConfig(cwd);
    const account = requireAccount(config, options.account);
    let vatRate = null;
    if (options.vatRate) {
      vatRate = requireVatRate(config, options.vatRate).id;
    }
    const rules = await readRules(cwd);
    const conditions = buildConditions(options);
    const rule = {
      id: createId("rule"),
      label: options.name || `Rule for ${account.code}`,
      created_at: new Date().toISOString(),
      conditions,
      postings: {
        account: account.code,
        vat_rate: vatRate,
        memo: options.memo || null,
      },
    };
    rules.rules.push(rule);
    await writeRules(cwd, rules);
    await appendAuditEntry(cwd, `added rule ${rule.id} targeting account ${account.code}`);
    console.log(`Rule ${rule.id} saved. It will apply to future 'ledger book' runs.`);
  },
};
