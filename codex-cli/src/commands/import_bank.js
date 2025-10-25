import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { parseCsv } from "../lib/csv.js";
import { parseAmount } from "../lib/currency.js";
import { parseIsoDate } from "../lib/dates.js";
import {
  appendAuditEntry,
  createId,
  readBankTransactions,
  readConfig,
  writeBankTransactions,
} from "../storage.js";

function fingerprint(record) {
  const hash = crypto.createHash("sha256");
  hash.update(JSON.stringify(record));
  return hash.digest("hex");
}

function normaliseHeader(header) {
  return header.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function recordFromRow(headers, row, lineNumber, currency) {
  const record = {};
  headers.forEach((header, index) => {
    record[header] = row[index] ?? "";
  });
  const dateValue = record.date || record.booking_date || record.value_date;
  if (!dateValue) {
    throw new Error(`Row ${lineNumber} is missing a date column.`);
  }
  const parsedDate = parseIsoDate(dateValue);
  const description =
    record.description || record.details || record.remark || record.purpose || "";
  const counterparty = record.counterparty || record.name || record.debtor || "";
  const amountRaw = record.amount || record.value || record.debit || record.credit;
  if (!amountRaw) {
    throw new Error(`Row ${lineNumber} is missing an amount column.`);
  }
  const amount = parseAmount(amountRaw);
  const currencyValue = record.currency || currency;
  return {
    booking_date: parsedDate.toISOString().slice(0, 10),
    amount,
    currency: currencyValue,
    description,
    counterparty,
    reference: record.reference || record.id || record.iban || null,
    source_columns: record,
  };
}

export const importBankCommand = {
  path: ["import", "bank"],
  description: "Import bank statement data (CSV) into the ledger journal staging area.",
  usage: "ledger import bank --file <path> [--format csv]",
  options: [
    ["--file <path>", "CSV file exported from your bank."],
    ["--format <format>", "Currently only 'csv' is supported."],
  ],
  examples: [
    "ledger import bank --file ./data/rabobank.csv",
  ],
  async run({ cwd, options }) {
    const file = options.file;
    if (!file) {
      throw new Error("Provide --file with the path to a bank export.");
    }
    const format = (options.format || "csv").toLowerCase();
    if (format !== "csv") {
      throw new Error("Only CSV imports are supported in this release.");
    }
    const config = await readConfig(cwd);
    const absoluteFile = path.resolve(cwd, file);
    const fileContent = await fs.readFile(absoluteFile, "utf8");
    const rows = parseCsv(fileContent);
    if (rows.length < 2) {
      throw new Error("The CSV file does not contain any data rows.");
    }
    const headers = rows[0].map(normaliseHeader);
    const currency = config.company?.currency || config.reporting?.currency || "EUR";
    const records = rows
      .slice(1)
      .map((row, index) => recordFromRow(headers, row, index + 2, currency));
    const bankData = await readBankTransactions(cwd);
    const existingFingerprints = new Set(
      bankData.transactions.map((txn) => txn.source?.fingerprint).filter(Boolean),
    );
    let imported = 0;
    let skipped = 0;
    const createdAt = new Date().toISOString();
    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const entryFingerprint = fingerprint(record);
      if (existingFingerprints.has(entryFingerprint)) {
        skipped += 1;
        continue;
      }
      const transaction = {
        id: createId("txn"),
        booking_date: record.booking_date,
        amount: record.amount,
        currency: record.currency,
        description: record.description,
        counterparty: record.counterparty,
        reference: record.reference,
        source: {
          file: path.relative(cwd, absoluteFile),
          line: index + 2,
          fingerprint: entryFingerprint,
        },
        status: {
          booked: false,
          entry_id: null,
        },
        created_at: createdAt,
        meta: record.source_columns,
      };
      bankData.transactions.push(transaction);
      imported += 1;
    }
    await writeBankTransactions(cwd, bankData);
    await appendAuditEntry(
      cwd,
      `imported ${imported} bank transaction${imported === 1 ? "" : "s"} from ${path.relative(
        cwd,
        absoluteFile,
      )}`,
    );
    console.log(`Imported ${imported} transaction${imported === 1 ? "" : "s"}.`);
    if (skipped > 0) {
      console.log(`Skipped ${skipped} duplicate row${skipped === 1 ? "" : "s"}.`);
    }
    if (imported === 0) {
      console.log("No new transactions detected. Check whether this file was imported before.");
    }
  },
};
