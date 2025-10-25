# Integrations

Codex Ledger focuses on local workflows but can interoperate with external systems through disciplined file exchange and automation hooks.

## Bank exports

- **CSV** – primary import format. Supported columns include `date`, `booking_date`, `value_date`, `description`, `details`, `counterparty`, `name`, `amount`, `value`, `debit`, `credit`, `currency`, `reference`.
- **MT940** – not yet implemented. Convert MT940 to CSV via your bank portal or accounting middleware before importing.
- **Automation tip** – schedule bank downloads (many banks offer SFTP/automated exports) and drop them into a shared folder that Codex watches during daily routines.

## Documents & receipts

While the current release does not parse invoices directly, you can store PDFs/images alongside bank statements and cross-reference them when adding rules or validating bookings. Future versions aim to add OCR pipelines and rule enrichment.

## External accounting packages

You can export data via `codex export --out file.json` and transform the JSON into the format expected by other systems (Exact, Twinfield, Moneybird). Suggested approach:

1. Export a period JSON snapshot.
2. Use a small script (Python/Node) to map Codex entries to the target API payload.
3. Upload via the official API or import tooling of the destination package.

## Automation & CI

- Use `codex status --period` in CI pipelines to ensure no pending transactions before deploying financial reports.
- Combine with GitHub Actions or cron jobs to run nightly bookings (`codex book --period 2025-01 --dry-run`) and send Slack/email summaries.
- The JSON export is deterministic, making it easy to diff outputs over time.

## Extending the CLI

Codex Ledger is written in Node.js (ES modules). You can add integrations by:

1. Creating new command modules under `codex-cli/src/commands` (e.g. `import_exact.js`).
2. Registering the command in `codex-cli/src/commands/index.js`.
3. Using helpers from `src/storage.js` to read/write ledger data safely.
4. Adding tests under `codex-cli/test/` to validate new behaviour.

Remember to update the docs and README when adding new integrations.
