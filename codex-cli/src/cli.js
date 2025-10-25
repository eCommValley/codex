import { commandRegistry } from "./commands/index.js";
import { parseArgv } from "./lib/arg_parser.js";
import { getPackageVersion } from "./lib/meta.js";
import { printCommandHelp, printGlobalHelp } from "./lib/help.js";

const commandsMap = new Map();
for (const command of commandRegistry) {
  const key = command.path.map((part) => part.toLowerCase()).join(" ");
  commandsMap.set(key, command);
}

function identifyCommand(argv) {
  const tokens = [];
  for (const token of argv) {
    if (token.startsWith("-")) {
      break;
    }
    tokens.push(token);
  }
  for (let length = tokens.length; length >= 1; length -= 1) {
    const key = tokens
      .slice(0, length)
      .map((part) => part.toLowerCase())
      .join(" ");
    const command = commandsMap.get(key);
    if (command) {
      return { command, rest: argv.slice(length) };
    }
  }
  return null;
}

export async function runCli(argv, { cwd = process.cwd() } = {}) {
  const version = await getPackageVersion();
  if (argv.length === 0) {
    printGlobalHelp({ version, commands: commandRegistry });
    return;
  }
  const first = argv[0];
  if (first === "--help" || first === "-h") {
    printGlobalHelp({ version, commands: commandRegistry });
    return;
  }
  if (first === "--version" || first === "-V") {
    console.log(`Codex Ledger CLI v${version}`);
    return;
  }
  const match = identifyCommand(argv);
  if (!match) {
    throw new Error(`Unknown command: ${argv.join(" ")}`);
  }
  const { command, rest } = match;
  const { positional, options } = parseArgv(rest);
  if (options.help || options.h) {
    printCommandHelp(command);
    return;
  }
  await command.run({
    cwd,
    options,
    positional,
    version,
  });
}
