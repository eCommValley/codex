import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runCli } from "../src/cli.js";
import { readJournal, readBankTransactions } from "../src/storage.js";

async function createTempDir() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "codex-ledger-"));
  return base;
}

test("end-to-end booking flow", async () => {
  const cwd = await createTempDir();
  await runCli(["init", "--company", "Test BV"], { cwd });
  const bankCsv = path.join(cwd, "bank.csv");
  const csvContent = [
    "date,description,counterparty,amount,currency",
    "2025-01-05,Coffee meeting,Coffee Bar,-24.20,EUR",
    "2025-01-08,Webinar ticket,Event Corp,-121.00,EUR",
  ].join("\n");
  await fs.writeFile(bankCsv, `${csvContent}\n`, "utf8");
  await runCli(["import", "bank", "--file", bankCsv], { cwd });
  await runCli([
    "rules",
    "add",
    "--account",
    "4000",
    "--counterparty",
    "Coffee",
    "--vat-rate",
    "LOW",
    "--memo",
    "Coffee expense",
  ], { cwd });
  await runCli([
    "rules",
    "add",
    "--account",
    "4100",
    "--description",
    "Webinar",
    "--vat-rate",
    "HIGH",
    "--memo",
    "Training",
  ], { cwd });
  await runCli(["book", "--period", "2025-01"], { cwd });
  const journal = await readJournal(cwd);
  assert.ok(journal.entries.length >= 2, "expected journal entries to be created");
  const bank = await readBankTransactions(cwd);
  assert.equal(bank.transactions.filter((txn) => txn.status?.booked).length, 2);
  await runCli(["vat", "prepare", "--period", "2025-01"], { cwd });
  await runCli(["report", "p&l", "--period", "2025-01"], { cwd });
});
