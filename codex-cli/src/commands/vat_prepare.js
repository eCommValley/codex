import { formatCurrency } from "../lib/currency.js";
import { formatIsoDate, resolvePeriod } from "../lib/dates.js";
import { findVatRate } from "../lib/ledger_utils.js";
import { readConfig, readJournal } from "../storage.js";

function ensurePeriod(options) {
  if (!options.period && (!options.from || !options.to)) {
    throw new Error("Provide --period or --from/--to for the VAT preparation window.");
  }
  return resolvePeriod({ period: options.period, from: options.from, to: options.to });
}

function summariseVat(entries, window) {
  const summary = new Map();
  for (const entry of entries) {
    const date = new Date(entry.date);
    if (date < window.start || date > window.end) {
      continue;
    }
    for (const line of entry.lines) {
      if (!line.vat_type || !line.vat_rate_id) {
        continue;
      }
      const rateId = line.vat_rate_id;
      const record = summary.get(rateId) || {
        inputVat: 0,
        outputVat: 0,
        inputBasis: 0,
        outputBasis: 0,
      };
      if (line.vat_type === "input") {
        record.inputVat += Number(line.debit || 0);
        record.inputBasis += Number(line.vat_basis || 0);
      } else if (line.vat_type === "output") {
        record.outputVat += Number(line.credit || 0);
        record.outputBasis += Number(line.vat_basis || 0);
      }
      summary.set(rateId, record);
    }
  }
  return summary;
}

export const vatPrepareCommand = {
  path: ["vat", "prepare"],
  description: "Generate a VAT summary (input/output tax) for submission.",
  usage: "ledger vat prepare --period <id>",
  options: [["--period <id>", "Fiscal period (e.g. 2025Q1 or 2025-03)."]],
  examples: ["ledger vat prepare --period 2025Q1"],
  async run({ cwd, options }) {
    const window = ensurePeriod(options);
    const [config, journal] = await Promise.all([readConfig(cwd), readJournal(cwd)]);
    const summary = summariseVat(journal.entries, window);
    const currency = config.reporting?.currency || config.company?.currency || "EUR";
    console.log(`VAT preparation for ${formatIsoDate(window.start)} to ${formatIsoDate(window.end)}`);
    console.log("");
    let totalInput = 0;
    let totalOutput = 0;
    for (const [rateId, record] of summary.entries()) {
      const rate = findVatRate(config, rateId);
      const label = rate ? rate.label : rateId;
      console.log(`${label} (${rateId})`);
      console.log(`  Taxable sales basis:  ${formatCurrency(record.outputBasis, currency)}`);
      console.log(`  VAT on sales:       ${formatCurrency(record.outputVat, currency)}`);
      console.log(`  Taxable purchases:  ${formatCurrency(record.inputBasis, currency)}`);
      console.log(`  VAT on purchases:   ${formatCurrency(record.inputVat, currency)}`);
      console.log("");
      totalInput += record.inputVat;
      totalOutput += record.outputVat;
    }
    const net = totalOutput - totalInput;
    console.log(`Total VAT on sales:      ${formatCurrency(totalOutput, currency)}`);
    console.log(`Total VAT on purchases:  ${formatCurrency(totalInput, currency)}`);
    console.log(`Net VAT due/(refund):    ${formatCurrency(net, currency)}`);
    if (summary.size === 0) {
      console.log("No VAT entries were recorded for this period. Ensure transactions have VAT-aware rules.");
    }
  },
};
