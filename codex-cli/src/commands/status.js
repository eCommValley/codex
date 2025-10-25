import { formatIsoDate } from "../lib/dates.js";
import { readBankTransactions, readConfig, readJournal, readRules } from "../storage.js";

export const statusCommand = {
  path: ["status"],
  description: "Show a high-level overview of imported data, rules and journal entries.",
  usage: "ledger status",
  async run({ cwd }) {
    const [config, bankData, journal, rules] = await Promise.all([
      readConfig(cwd),
      readBankTransactions(cwd),
      readJournal(cwd),
      readRules(cwd),
    ]);
    const totalTransactions = bankData.transactions.length;
    const booked = bankData.transactions.filter((txn) => txn.status?.booked).length;
    const pending = totalTransactions - booked;
    console.log(`Company: ${config.company?.name || "Unknown"}`);
    console.log(`Currency: ${config.company?.currency || config.reporting?.currency || "EUR"}`);
    console.log("");
    console.log(`Imported transactions: ${totalTransactions}`);
    console.log(`Booked journal entries: ${journal.entries.length}`);
    console.log(`Pending transactions: ${pending}`);
    const ruleCount = Array.isArray(rules.rules) ? rules.rules.length : 0;
    console.log(`Rules configured: ${ruleCount}`);
    console.log("");
    const recent = [...journal.entries]
      .slice(-5)
      .reverse()
      .map((entry) => `${formatIsoDate(new Date(entry.date))} ${entry.memo || "(no memo)"}`);
    if (recent.length > 0) {
      console.log("Recent journal activity:");
      for (const line of recent) {
        console.log(`  - ${line}`);
      }
    } else {
      console.log("No journal entries yet. Run 'ledger book' to create entries.");
    }
  },
};
