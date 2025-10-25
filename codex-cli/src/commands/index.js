import { initCommand } from "./init.js";
import { importBankCommand } from "./import_bank.js";
import { rulesAddCommand } from "./rules_add.js";
import { rulesListCommand } from "./rules_list.js";
import { bookCommand } from "./book.js";
import { statusCommand } from "./status.js";
import { reportProfitAndLossCommand } from "./report_pnl.js";
import { vatPrepareCommand } from "./vat_prepare.js";
import { closeCommand } from "./close_period.js";
import { exportCommand } from "./export_data.js";

export const commandRegistry = [
  initCommand,
  importBankCommand,
  rulesAddCommand,
  rulesListCommand,
  bookCommand,
  statusCommand,
  reportProfitAndLossCommand,
  vatPrepareCommand,
  closeCommand,
  exportCommand,
];
