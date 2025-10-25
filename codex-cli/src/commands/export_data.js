import fs from "node:fs/promises";
import path from "node:path";
import { ledgerPath, readBankTransactions, readConfig, readJournal, readRules } from "../storage.js";

async function readAuditLog(cwd) {
  try {
    const logPath = await ledgerPath(cwd, "audit.log");
    const data = await fs.readFile(logPath, "utf8");
    return data.split(/\r?\n/).filter((line) => line.trim().length > 0);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export const exportCommand = {
  path: ["export"],
  description: "Export ledger data (config, journal, bank imports, rules) as JSON for backup or review.",
  usage: "ledger export --out <file> [--include-audit]",
  options: [
    ["--out <file>", "Destination file path (defaults to ./ledger-export.json)."],
    ["--include-audit", "Include the audit log in the export."],
  ],
  examples: ["ledger export --out ./exports/q1.json --include-audit"],
  async run({ cwd, options }) {
    const outFile = options.out ? path.resolve(cwd, options.out) : path.join(cwd, "ledger-export.json");
    const [config, bank, journal, rules] = await Promise.all([
      readConfig(cwd),
      readBankTransactions(cwd),
      readJournal(cwd),
      readRules(cwd),
    ]);
    const payload = {
      exported_at: new Date().toISOString(),
      config,
      bank,
      journal,
      rules,
    };
    if (options.includeAudit) {
      payload.audit = await readAuditLog(cwd);
    }
    await fs.mkdir(path.dirname(outFile), { recursive: true });
    await fs.writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    console.log(`Exported ledger to ${path.relative(cwd, outFile)}`);
  },
};
