# Workflows

This guide illustrates a full bookkeeping cycle with Codex Ledger CLI. All commands run inside a project folder (e.g., a Git repository containing your accounting data).

## 1. Initialise the ledger

```bash
codex init --company "Sample BV" --country NL --currency EUR
```

- Creates `./.ledger/ledger.yml` with chart of accounts and VAT profiles.
- Seeds `rules.json` with a couple of starter rules (NS travel, Bol office supplies).
- Empties `bank-transactions.json` and `journal.json` while logging an audit entry.

## 2. Import bank statements

```bash
codex import bank --file ./exports/jan-2025.csv
```

- Accepts CSV exports with column names such as `date`, `description`, `counterparty`, `amount`, `currency`.
- Fingerprints each row so repeated imports of the same file do not duplicate transactions.
- Stores metadata (source file path, line number) in `bank-transactions.json` for tracing.

### Tips

- Keep original bank exports in a dedicated folder (e.g. `bank-statements/`) committed to Git LFS if necessary.
- Standardise CSV headers with your bank. Use spreadsheet tooling if the export names differ; Codex normalises common variants.

## 3. Add or refine booking rules

```bash
codex rules add --account 4000 --counterparty "NS" --vat-rate LOW --memo "Rail travel"
```

- Rules match on counterparty, description snippets, amount ranges and direction (incoming/outgoing).
- Postings declare the destination ledger account, optional VAT rate and memo template.
- `codex rules list` prints the current catalogue for review.

## 4. Book the period

```bash
codex book --period 2025-01
```

- Scans staged transactions whose booking dates fall inside the chosen window.
- Applies the first matching rule and generates a balanced journal entry with VAT breakdowns.
- Supports `--dry-run` to preview without writing to disk.
- Skips periods already locked via `codex close`.

After booking you can inspect `./.ledger/journal.json` or run `codex status` to confirm there are no pending transactions.

## 5. Review performance

```bash
codex report p&l --period 2025-01
codex vat prepare --period 2025-01
```

- `report p&l` aggregates income and expenses by account type, showing totals and net result.
- `vat prepare` separates output and input tax per rate, listing taxable bases to copy into statutory returns.

## 6. Close the quarter

```bash
codex close --period Q1-2025
```

- Ensures no unbooked transactions remain (unless `--force` is specified).
- Appends a closed period to `ledger.yml` so future booking attempts during that window are rejected.
- Writes an audit entry noting who closed the period and when.

## 7. Export archives (optional)

```bash
codex export --out ./exports/q1-2025.json --include-audit
```

- Produces a portable JSON bundle with configuration, bank data, journal entries and optional audit log.
- Useful for off-site backups, year-end handovers or migrations to other systems.

## Daily/weekly checklist

1. `codex status` – confirm pending transactions and rule coverage.
2. `codex import bank --file ...` – ingest new statements.
3. `codex rules add ...` – create rules when new vendors appear.
4. `codex book --period ...` – book the relevant period (use `--dry-run` first in busy weeks).
5. `codex report p&l` / `codex vat prepare` – generate management insights and compliance exports.
6. Commit `.ledger/` changes to Git for a tamper-evident history.
