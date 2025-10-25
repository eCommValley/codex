import { readRules } from "../storage.js";

function describeConditions(conditions) {
  const parts = [];
  if (conditions.counterparty_contains) {
    parts.push(`counterparty contains "${conditions.counterparty_contains}"`);
  }
  if (conditions.description_contains) {
    parts.push(`description contains "${conditions.description_contains}"`);
  }
  if (conditions.amount_min !== undefined) {
    parts.push(`amount >= ${conditions.amount_min}`);
  }
  if (conditions.amount_max !== undefined) {
    parts.push(`amount <= ${conditions.amount_max}`);
  }
  if (conditions.direction) {
    parts.push(conditions.direction === "in" ? "incoming payments" : "outgoing payments");
  }
  return parts.join(", ");
}

export const rulesListCommand = {
  path: ["rules", "list"],
  description: "Show all configured booking rules and their triggers.",
  usage: "codex rules list",
  async run({ cwd }) {
    const rules = await readRules(cwd);
    const list = Array.isArray(rules.rules) ? rules.rules : [];
    if (list.length === 0) {
      console.log("No rules configured yet. Use 'codex rules add' to create one.");
      return;
    }
    console.log(`Configured rules (${list.length}):`);
    for (const rule of list) {
      const description = describeConditions(rule.conditions || {});
      console.log(`- ${rule.id} :: ${rule.label || "(no label)"}`);
      if (description) {
        console.log(`    when ${description}`);
      }
      if (rule.postings) {
        const vat = rule.postings.vat_rate ? ` (VAT ${rule.postings.vat_rate})` : "";
        console.log(`    -> account ${rule.postings.account}${vat}`);
      }
      if (rule.postings?.memo) {
        console.log(`    memo: ${rule.postings.memo}`);
      }
    }
  },
};
