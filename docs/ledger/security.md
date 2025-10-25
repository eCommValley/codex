# Security & privacy

Codex Ledger emphasises privacy by design: no data is transmitted to cloud services. Still, financial records are sensitive, so follow these guidelines.

## Data residency

- Keep the repository on encrypted storage (FileVault, BitLocker, LUKS) when dealing with personal identifiable information (PII).
- Use private Git hosting or encrypted backups; avoid pushing the ledger to public repositories.

## Access control

- Share the repository only with trusted collaborators. Git history contains the full bank/journal trail.
- Rotate access promptly when team members leave. Because the data is local, revocation is as simple as removing repository access.

## Audit trail

- `audit.log` records every structural change (init, imports, bookings, period closures, exports). Treat it as immutable.
- Pair audit entries with Git commits for full traceability of who changed what and when.

## Secrets

- The CLI itself does not store API keys or passwords.
- If you automate downloads from banks or third parties, keep credentials outside the repository (e.g. `.env` files listed in `.gitignore`, password managers, secret stores).

## GDPR / AVG considerations

- Bank statements and invoices contain PII. Document retention policies that align with local regulations (e.g. seven-year storage in NL).
- Use `codex export --out` to produce encrypted off-site backups if required.
- When sharing extracts (reports, JSON exports), redact or aggregate sensitive data where possible.

## Incident response

- In case of data loss, restore from Git or JSON exports.
- For suspected compromise, rotate all external credentials (banking portals, automation keys), audit commit history and re-import data from authoritative sources.

## Future roadmap

Planned hardening steps include encrypted-at-rest storage for the `.ledger/` folder, checksum signing for exports and optional multi-user approvals for period closures. Contributions in these areas are welcome.
