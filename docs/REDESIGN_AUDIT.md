# Moog redesign and verification notes

## Design direction
- Replaced the previous competing theme imports with one PrivateBin-inspired light design layer: white surfaces, neutral borders, readable typography, and restrained violet actions.
- Simplified the homepage hero, removed the decorative dark mockup panel, and kept the primary create/receive actions visible in the hero.
- Standardized the chain-link brand mark across the homepage, share viewer, report-abuse, trust pages, not-found, and share loading/error screens.
- Added responsive layouts for mobile controls, expiry choices, forms, viewer metadata, result links, and supporting sections.
- Updated report-abuse guidance and kept success/error messaging accessible to assistive technology.

## Existing behaviour preserved
The design refactor does not replace the server-backed share APIs. Text, code and image sharing; optional password protection; expiry; view-once reveal/consume; receive codes; and creator revocation continue to use the existing routes and database fields.

## Security-related update
- Abuse reports now accept only a valid share path on the configured Moog origin rather than a URL on an arbitrary host.
- Added regression tests for trusted share URLs, external hosts, malformed paths, unsafe protocols, and embedded credentials.
- The homepage no longer claims that Moog does not use third-party tracking. The page shell still loads the pre-existing advertising script configured in `app/layout.tsx`; that script was not removed as part of the UI redesign.

## Validation still required before merge/deployment
- GitHub Actions must pass tests, typecheck, lint, Prisma client generation, and the production build.
- Run browser-level desktop/mobile checks for create, receive, password unlock, view-once reveal, expiry, revoke, and report-abuse flows.
- Integration-test concurrency and interrupted-delivery behaviour for view-once shares, incorrect creator revoke tokens, and expiry cleanup.
- Confirm Railway proxy/IP handling and ensure the scheduled cleanup secret matches the API's cron secret.
- This branch is not deployed. Merge and production deployment require explicit owner approval.
