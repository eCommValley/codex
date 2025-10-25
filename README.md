# Codex Ledger CLI

Codex Ledger refactors the original Codex developer agent into a finance-first command line assistant for bookkeepers, controllers and founders of small businesses. The CLI runs locally, keeps all bookkeeping data inside your working directory and automates the repetitive steps of double-entry accounting: importing bank statements, applying categorisation rules, preparing VAT returns and locking fiscal periods.

## Quick start

```bash
npm install -g @openai/codex-ledger
ledger init --company "Sample BV" --country NL --currency EUR
ledger import bank --file ./data/rabobank.csv
ledger rules add --account 4000 --counterparty NS --vat-rate LOW --memo "Rail travel"
ledger book --period Q1-2025
ledger report p&l --period Q1-2025
ledger vat prepare --period Q1-2025
ledger close --period Q1-2025
```

The CLI stores all configuration, imports and journals in a versionable `.ledger/` folder so you can commit the entire history to Git.

## Core capabilities

- **Guided ledger initialisation** – `ledger init` provisions a Dutch-friendly chart of accounts, VAT profiles and policies that you can tailor in `./.ledger/ledger.yml`.
- **Statement ingestion** – `ledger import bank` accepts CSV exports (Rabobank, ING, bunq, etc.) and fingerprints every row to prevent double uploads.
- **Rule-based booking** – `ledger rules add` lets you define deterministic categorisation logic (counterparty, description, amount ranges, direction) that is replayed by `ledger book`.
- **Double-entry engine** – Booking creates balanced journal entries with VAT breakdowns, using the bank account configured in `ledger.yml`.
- **Live status dashboards** – `ledger status` highlights pending transactions, rule coverage and recent journal entries.
- **Regulatory outputs** – `ledger report p&l` produces human-readable profit and loss statements, while `ledger vat prepare` summarises input/output tax per VAT rate.
- **Period governance** – `ledger close` locks fiscal windows and records an immutable audit entry; exports include JSON snapshots plus optional audit trails via `ledger export`.

## Data model overview

The configuration file `./.ledger/ledger.yml` uses clear keys:

```yaml
company:
  name: Sample BV
  country: NL
  currency: EUR
vat:
  profile_id: NL-2025
  rates:
    - id: HIGH
      label: High 21%
      percentage: 0.21
      on_sales_account: 1610
      on_purchases_account: 1600
accounts:
  bank_account_code: "1000"
chart_of_accounts:
  - code: "1000"
    name: Bank
    type: asset
    role: bank
  - code: "4000"
    name: Travel expenses
    type: expense
    vat_rate: LOW
```

Bank transactions, rules and journal entries are persisted as JSON files in the same directory:

- `bank-transactions.json` – raw imports with provenance and booking status.
- `rules.json` – deterministic categorisation rules with memo templates and VAT hints.
- `journal.json` – double-entry postings referencing the originating transaction and rule.
- `audit.log` – append-only trail of significant operations (initialisation, imports, bookings, closures, exports).

## Command reference

| Command | Purpose |
| --- | --- |
| `ledger init` | Create a ledger skeleton with chart of accounts, VAT rates, policies and starter rules. |
| `ledger status` | Summarise company metadata, totals, pending transactions and recent journal activity. |
| `ledger import bank --file` | Load CSV bank statements into the staging area, deduplicated by fingerprint. |
| `ledger rules add` / `ledger rules list` | Maintain categorisation logic for auto-booking. |
| `ledger book --period` | Apply rules to staged transactions and generate journal entries (dry-run supported). |
| `ledger report p&l --period` | Produce profit & loss statements with account-level breakdowns. |
| `ledger vat prepare --period` | Aggregate input and output VAT per rate, ready for submission. |
| `ledger close --period` | Lock a fiscal period (optional `--force`) and record an audit snapshot. |
| `ledger export --out` | Export configuration, bank data, journal and optional audit log as JSON. |

## Documentation

Comprehensive finance-oriented docs are available under [`docs/ledger/`](./docs/ledger/):

- [`overview.md`](./docs/ledger/overview.md) – product tour, architecture and key concepts.
- [`workflows.md`](./docs/ledger/workflows.md) – end-to-end walkthroughs for importing, booking and closing a quarter.
- [`configuration.md`](./docs/ledger/configuration.md) – advanced settings for charts of accounts, VAT extensions and policies.
- [`integrations.md`](./docs/ledger/integrations.md) – bank export formats, OCR tips and how to hook up external systems.
- [`security.md`](./docs/ledger/security.md) – data retention, encryption recommendations and audit practices.

## Contributing

Pull requests, test scenarios and localisation improvements are welcome. Please read [`docs/ledger/contributing.md`](./docs/ledger/contributing.md) for coding standards, release cadence and roadmap guidelines tailored to the accounting refactor.

## License

Codex Ledger CLI is released under the [Apache-2.0 License](./LICENSE).
