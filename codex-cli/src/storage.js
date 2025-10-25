import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { parseYaml, stringifyYaml } from "./lib/yaml.js";

const LEDGER_DIR = ".ledger";
const CONFIG_FILE = "ledger.yml";
const BANK_FILE = "bank-transactions.json";
const RULES_FILE = "rules.json";
const JOURNAL_FILE = "journal.json";
const AUDIT_FILE = "audit.log";

async function readFileSafe(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function readJsonFile(filePath, defaultValue) {
  const raw = await readFileSafe(filePath);
  if (raw === null) {
    return defaultValue;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Unable to parse JSON file at ${filePath}: ${error.message}`);
  }
}

async function writeJsonFile(filePath, data) {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, json, "utf8");
}

async function ensureLedgerDirectory(cwd) {
  const ledgerDir = path.join(cwd, LEDGER_DIR);
  await fs.mkdir(ledgerDir, { recursive: true });
  return ledgerDir;
}

export async function ledgerPath(cwd, fileName) {
  return path.join(cwd, LEDGER_DIR, fileName);
}

export async function ledgerExists(cwd) {
  try {
    const stats = await fs.stat(path.join(cwd, LEDGER_DIR, CONFIG_FILE));
    return stats.isFile();
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function readConfig(cwd) {
  const configPath = await ledgerPath(cwd, CONFIG_FILE);
  const raw = await readFileSafe(configPath);
  if (raw === null) {
    throw new Error("No ledger found. Run 'ledger init' first.");
  }
  try {
    const parsed = parseYaml(raw);
    return parsed;
  } catch (error) {
    throw new Error(`Unable to parse ${CONFIG_FILE}: ${error.message}`);
  }
}

export async function writeConfig(cwd, config) {
  const ledgerDir = await ensureLedgerDirectory(cwd);
  const configPath = path.join(ledgerDir, CONFIG_FILE);
  const serialized = stringifyYaml(config);
  await fs.writeFile(configPath, `${serialized}\n`, "utf8");
}

export async function appendAuditEntry(cwd, entry) {
  const ledgerDir = await ensureLedgerDirectory(cwd);
  const logPath = path.join(ledgerDir, AUDIT_FILE);
  const timestamp = new Date().toISOString();
  await fs.appendFile(logPath, `${timestamp} ${entry}\n`, "utf8");
}

export async function readBankTransactions(cwd) {
  const bankPath = await ledgerPath(cwd, BANK_FILE);
  return readJsonFile(bankPath, { version: 1, transactions: [] });
}

export async function writeBankTransactions(cwd, data) {
  const ledgerDir = await ensureLedgerDirectory(cwd);
  const bankPath = path.join(ledgerDir, BANK_FILE);
  await writeJsonFile(bankPath, data);
}

export async function readRules(cwd) {
  const rulesPath = await ledgerPath(cwd, RULES_FILE);
  return readJsonFile(rulesPath, { version: 1, rules: [] });
}

export async function writeRules(cwd, data) {
  const ledgerDir = await ensureLedgerDirectory(cwd);
  const rulesPath = path.join(ledgerDir, RULES_FILE);
  await writeJsonFile(rulesPath, data);
}

export async function readJournal(cwd) {
  const journalPath = await ledgerPath(cwd, JOURNAL_FILE);
  return readJsonFile(journalPath, { version: 1, entries: [] });
}

export async function writeJournal(cwd, data) {
  const ledgerDir = await ensureLedgerDirectory(cwd);
  const journalPath = path.join(ledgerDir, JOURNAL_FILE);
  await writeJsonFile(journalPath, data);
}

export function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}
