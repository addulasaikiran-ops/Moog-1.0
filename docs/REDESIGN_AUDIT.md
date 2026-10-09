# Moog redesign implementation notes

## Included in this branch
- Light, minimal, privacy-focused visual layer with violet accents across the home page, share viewer, password/reveal screens, and trust/legal pages.
- Clear create/receive calls to action in the homepage hero.
- Creator-only share revocation using a random creator token, stored as a hash and held in client memory only; revoked state is enforced by the share page, status, password unlock, image, reveal, and consume routes.
- Email validation extracted into a small shared helper, with regression tests for ordinary addresses and whitespace/missing-part failures.
- Reuses the existing creator-revocation database migration; no new migration is required.

## Existing behaviour preserved
The redesign keeps the current API-backed share creation, text/code/image modes, expiry selection, optional password, view-once, receive code, and report-abuse flows.

## Verification required before production
- Run the full test, lint, typecheck, Prisma generation, and production build checks on this branch.
- Add integration tests for password unlock, expiry, view-once concurrent opens/interrupted delivery, revoke attempts with incorrect creator tokens, and abuse-report rate limiting.
- Verify proxy-derived client IP handling in the deployed Railway environment.
- Confirm scheduled cleanup's GitHub Actions secret matches the Railway cron secret.
- Do not deploy this branch until checks pass and the owner explicitly approves.
