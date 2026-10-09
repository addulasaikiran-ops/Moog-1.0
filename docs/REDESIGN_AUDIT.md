# Moog redesign implementation notes

## Included in this branch
- Light, minimal, privacy-focused visual layer with violet accents across the home page, share viewer, password/reveal screens, and trust/legal pages.
- Hero actions for creating a private share or switching to the receive flow.
- Email validation extracted into a small shared helper, with regression tests for ordinary addresses and whitespace/missing-part failures.
- No database migrations, secrets, production settings, or deployment configuration changed.

## Existing behaviour preserved
The redesign is presentation-first. Existing share creation, text/code/image modes, expiry selection, optional password, view-once setting, receive code flow, and report-abuse submission continue to use their existing API routes.

## Known blocker: creator revocation
The repository contains a revocation migration, but the current Prisma `Share` model does not declare the revoke fields, and the current UI/API source review did not identify a complete creator authorization-token + revoke endpoint flow. A visual revoke button alone would be misleading and unsafe, so this branch intentionally does not claim revocation is implemented. Add and test the backend capability (creator-only secret, hashed storage, revoked status enforced by every read/unlock/image/consume endpoint) before exposing revoke controls.

## Security/testing follow-up before production
- Run the full test, lint, typecheck, and production build checks on this branch.
- Add integration tests for password unlock, expiry, view-once concurrent opens/interrupted delivery, and abuse report rate limiting.
- Verify proxy-derived client IP handling in the deployed Railway environment.
- Confirm scheduled cleanup's GitHub Actions secret matches the Railway cron secret.
- Do not deploy this branch until checks pass and the owner explicitly approves.
