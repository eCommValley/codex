# Contributing

Thank you for helping evolve Codex Ledger CLI into a production-ready bookkeeping assistant. This document highlights contribution expectations that differ from the original developer-focused Codex project.

## Development workflow

1. **Install dependencies** – the CLI uses Node.js ≥ 18. Tests run with the built-in `node --test` runner.
2. **Run tests** – `npm test` from the repository root executes the YAML round-trip tests and an end-to-end booking scenario.
3. **Format** – favour readable, functional JavaScript; no automated formatter is enforced yet, but keep indentation at two spaces.
4. **Documentation** – update the relevant files under `docs/ledger/` and the root `README.md` whenever commands or behaviours change.
5. **Audit the UX** – run through `codex status`, `codex book --dry-run` and reporting commands to ensure user messaging remains clear.

## Coding guidelines

- Prefer pure functions and deterministic outputs (crucial for accounting reproducibility).
- When touching VAT logic or booking mechanics, expand the integration test in `codex-cli/test/ledger_cli.test.js` with new assertions.
- Keep the YAML parser simple; if you need advanced constructs, consider a minimal dependency with a permissive licence.
- Treat rounding carefully. Use `roundToCents` for monetary calculations and add regression tests for edge cases.

## Issue reporting

- Include reproduction steps, sample CSV snippets and relevant ledger excerpts (`ledger.yml`, `rules.json`, truncated `journal.json`).
- Flag jurisdiction-specific requirements (VAT rates, reporting formats) so maintainers can assess portability.

## Roadmap ideas

- MT940 ingestion and automatic currency detection.
- Document OCR ingestion and receipt-to-rule suggestions.
- Encrypted ledger storage with secret rotation.
- Multi-user approvals for period closure.

We welcome pull requests that tackle any of these areas or improve documentation, test coverage and localisation.
