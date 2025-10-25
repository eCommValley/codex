# Configuration

All configuration lives in `./.ledger/ledger.yml`. The file uses straightforward YAML and can be edited with any text editor. After manual changes, rerun `ledger status` to confirm the CLI parses the file successfully.

## Company block

```yaml
company:
  name: Sample BV
  country: NL
  currency: EUR
```

- `name` – free-form label used in reports.
- `country` – ISO country code; influences default VAT rules.
- `currency` – ISO currency; reporting and number formatting use this code.

## VAT configuration

```yaml
vat:
  profile_id: NL-2025
  rates:
    - id: HIGH
      label: High 21%
      percentage: 0.21
      on_sales_account: 1610
      on_purchases_account: 1600
    - id: LOW
      label: Low 9%
      percentage: 0.09
      on_sales_account: 1610
      on_purchases_account: 1600
```

- `percentage` is expressed as a decimal (21% = 0.21).
- `on_sales_account` receives VAT payable (credit) lines.
- `on_purchases_account` receives VAT receivable (debit) lines.
- Add as many rates as needed (e.g. EU intra-community supplies, exempt categories).

## Chart of accounts

```yaml
chart_of_accounts:
  - code: "1000"
    name: Bank
    type: asset
    role: bank
  - code: "1400"
    name: Accounts Payable
    type: liability
  - code: "2000"
    name: Sales 21%
    type: income
    vat_rate: HIGH
  - code: "4000"
    name: Travel expenses
    type: expense
    vat_rate: LOW
```

- `code` is a string to preserve leading zeros.
- `type` influences reporting: `asset`, `liability`, `equity`, `income`, `expense`.
- `role: bank` designates the default cash account for booking.
- `vat_rate` (optional) documents the usual VAT treatment; bookings still rely on rule-specific settings.

## Policies & periods

```yaml
accounts:
  bank_account_code: "1000"
  retained_earnings_account: "3000"
policies:
  booking_requires_rule: true
  review_before_lock: true
periods:
  closed:
    - label: 2024
      start: 2024-01-01
      end: 2024-12-31
```

- `bank_account_code` must match an account in the chart of accounts.
- Closed periods are appended automatically by `ledger close`. Remove entries only if you need to reopen a period intentionally.

## Rules file

`./.ledger/rules.json` stores categorisation rules. Example:

```json
{
  "version": 1,
  "rules": [
    {
      "id": "rule_ns_travel",
      "label": "NS train travel",
      "conditions": {
        "counterparty_contains": "NS"
      },
      "postings": {
        "account": "4000",
        "vat_rate": "LOW",
        "memo": "Rail travel"
      }
    }
  ]
}
```

- `conditions.counterparty_contains` and `conditions.description_contains` perform case-insensitive substring matches.
- `conditions.amount_min` / `amount_max` use the signed transaction amount.
- `conditions.direction` accepts `"in"` (income) or `"out"` (expenses).

## Audit file

`./.ledger/audit.log` is append-only and should not be edited. Each line contains an ISO timestamp followed by a short message (initialisation, imports, bookings, closures, exports).

## Git hygiene

- Commit the entire `.ledger/` folder regularly to capture an immutable history.
- Treat `bank-transactions.json` as sensitive; avoid sharing outside trusted collaborators.
- Use encrypted storage (disk encryption, secure backups) for the repository if it contains personal data.
