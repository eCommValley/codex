# Codex Ledger CLI

This directory contains the Node.js implementation of the Codex Ledger command line interface. The CLI repurposes the original Codex agent to automate accounting workflows for small businesses and bookkeepers.

## Installation

```bash
npm install -g @openai/codex-ledger
```

Codex Ledger requires Node.js 18 or newer. After installing globally you can run `codex` from any project directory.

## Folder layout

- `bin/codex.js` – entrypoint that invokes the CLI runtime.
- `src/cli.js` – argument parsing, command registration and global help output.
- `src/commands/` – individual command implementations (`init`, `import bank`, `rules add`, `book`, `report p&l`, etc.).
- `src/lib/` – shared helpers (YAML serialiser, CSV parser, date utilities, currency formatting, ledger lookups).
- `src/storage.js` – persistence helpers for configuration, bank transactions, rules, journal entries and audit logs.
- `test/` – Node test suite covering YAML round-trips and an end-to-end booking scenario.

## Key commands

| Command | Description |
| --- | --- |
| `codex init` | Initialise `.ledger/` with chart of accounts, VAT profiles and starter rules. |
| `codex import bank --file` | Import CSV bank statements into the staging area. |
| `codex rules add` | Define automated categorisation rules (conditions + postings). |
| `codex book --period` | Apply rules to staged transactions and create journal entries. |
| `codex report p&l --period` | Generate profit and loss statements. |
| `codex vat prepare --period` | Summarise input/output VAT per rate. |
| `codex close --period` | Lock a fiscal period and append to the audit trail. |
| `codex export --out` | Export ledger data and optional audit log as JSON. |
| `codex status` | Show company metadata, counts, pending transactions and recent journal entries. |

## Development

Install dependencies (if you plan to work on the CLI locally) and run tests with:

```bash
npm install
npm test
```

The integration test `test/ledger_cli.test.js` exercises the full flow: init → import → rule creation → booking → VAT/P&L reporting.

When adding new commands:

1. Create a module in `src/commands/`.
2. Register it inside `src/commands/index.js`.
3. Update `README.md` and relevant docs under `docs/ledger/`.
4. Extend the test suite where appropriate.

## Release notes

- v0.1.0 – first accounting-focused release (bank imports, rule engine, double-entry booking, VAT reporting, period closures, JSON exports).

Refer to the [repository README](../README.md) for a broader product overview and documentation links.
