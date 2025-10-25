import { wrapLines } from "./text.js";

export function printGlobalHelp({ version, commands }) {
  const lines = [];
  lines.push("Codex Ledger CLI");
  lines.push(`Version: ${version}`);
  lines.push("");
  lines.push("Usage:");
  lines.push("  ledger <command> [options]");
  lines.push("");
  lines.push("Commands:");
  for (const command of commands) {
    const label = `  ${command.path.join(" ")}`;
    const description = wrapLines(command.description, 60).map((line, index) => {
      if (index === 0) {
        return `${label.padEnd(26, " ")}${line}`;
      }
      return `${"".padEnd(26, " ")}${line}`;
    });
    lines.push(...description);
  }
  lines.push("");
  lines.push("Run 'ledger <command> --help' for details about a specific command.");
  console.log(lines.join("\n"));
}

export function printCommandHelp(command) {
  const lines = [];
    lines.push(`ledger ${command.path.join(" ")}`);
  lines.push("");
  lines.push(...wrapLines(command.description, 78));
  lines.push("");
  lines.push("Usage:");
  lines.push(`  ${command.usage}`);
  if (command.options && command.options.length > 0) {
    lines.push("");
    lines.push("Options:");
    for (const option of command.options) {
      const [flag, description] = option;
      const wrapped = wrapLines(description, 58).map((line, index) => {
        if (index === 0) {
          return `  ${flag.padEnd(24, " ")}${line}`;
        }
        return `  ${"".padEnd(24, " ")}${line}`;
      });
      lines.push(...wrapped);
    }
  }
  if (command.examples && command.examples.length > 0) {
    lines.push("");
    lines.push("Examples:");
    for (const example of command.examples) {
      lines.push(`  ${example}`);
    }
  }
  console.log(lines.join("\n"));
}
