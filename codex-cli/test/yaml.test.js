import { test } from "node:test";
import assert from "node:assert";
import { parseYaml, stringifyYaml } from "../src/lib/yaml.js";

test("stringify and parse round-trip", () => {
  const value = {
    company: {
      name: "Test BV",
      currency: "EUR",
    },
    chart_of_accounts: [
      { code: "1000", name: "Bank", type: "asset" },
      { code: "2000", name: "Sales", type: "income" },
    ],
  };
  const yaml = stringifyYaml(value);
  const parsed = parseYaml(yaml);
  assert.deepStrictEqual(parsed, value);
});

test("parse simple yaml", () => {
  const text = `company:\n  name: Example BV\n  currency: EUR\nchart_of_accounts:\n  -\n    code: "1000"\n    name: Bank\n    type: asset\n`;
  const parsed = parseYaml(text);
  assert.strictEqual(parsed.company.name, "Example BV");
  assert.strictEqual(parsed.company.currency, "EUR");
  assert.strictEqual(parsed.chart_of_accounts[0].code, "1000");
});
