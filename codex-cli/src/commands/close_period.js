import { formatIsoDate, resolvePeriod } from "../lib/dates.js";
import { isPeriodClosed, recordClosedPeriod } from "../lib/ledger_utils.js";
import { appendAuditEntry, readBankTransactions, readConfig, writeConfig } from "../storage.js";

export const closeCommand = {
  path: ["close"],
  description: "Lock a fiscal period to prevent further bookings and record an audit snapshot.",
  usage: "codex close --period <id> [--force]",
  options: [
    ["--period <id>", "Fiscal period (e.g. Q1-2025)."],
    ["--force", "Close even if unbooked transactions remain."],
  ],
  examples: ["codex close --period Q1-2025"],
  async run({ cwd, options }) {
    if (!options.period) {
      throw new Error("--period is required to close a period.");
    }
    const window = resolvePeriod({ period: options.period });
    const [config, bankData] = await Promise.all([readConfig(cwd), readBankTransactions(cwd)]);
    if (isPeriodClosed(config, formatIsoDate(window.start))) {
      console.log("This period is already closed.");
      return;
    }
    const unbooked = bankData.transactions.filter((txn) => {
      if (txn.status?.booked) {
        return false;
      }
      const date = new Date(txn.booking_date);
      return date >= window.start && date <= window.end;
    });
    if (unbooked.length > 0 && !options.force) {
      throw new Error(
        `There are ${unbooked.length} unbooked transaction${unbooked.length === 1 ? "" : "s"} in this period. Book them or use --force.`,
      );
    }
    recordClosedPeriod(config, {
      label: options.period,
      start: formatIsoDate(window.start),
      end: formatIsoDate(window.end),
    });
    await writeConfig(cwd, config);
    await appendAuditEntry(
      cwd,
      `closed period ${options.period} covering ${formatIsoDate(window.start)} to ${formatIsoDate(window.end)}`,
    );
    console.log(`Closed period ${options.period}. Further bookings will be rejected for that range.`);
  },
};
