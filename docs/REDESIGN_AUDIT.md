# Moog redesign implementation notes

## Approved visual direction
- PrivateBin-inspired, light, minimal, text-first and privacy-focused.
- Violet accent, restrained surfaces, clear borders, readable typography and consistent keyboard focus.
- The create and receive actions are the hero's primary actions; the decorative code/photo illustration is removed so the content workflow remains the focal point.
- The refreshed design layer covers homepage composition, creator result state, receive flow, share viewer, password gate, view-once reveal/consumed states, legal pages, contact and abuse reporting.
- Moog's violet chain mark is aligned across the homepage, share/viewer/trust wordmarks and favicon.
- The page title and description describe temporary access-controlled sharing; they do not claim end-to-end encryption.

## Behaviour intentionally preserved
- Existing API-backed text, code and supported image share creation.
- Expiry selection, optional password, view-once flag, six-digit receive code, result/status UI, creator-token-based revoke flow and abuse reporting.
- Existing share APIs and database access-control checks are still authoritative.
- The redesign does not describe Moog as end-to-end encrypted or zero-knowledge.

## Interaction and accessibility details
- Responsive composition for mobile, tablet and desktop breakpoints.
- Visible keyboard focus and reduced-motion support.
- Existing submit, disabled, error and loading states remain in place.
- Automatic focus on the text composer is removed so mobile browsers do not open the keyboard unexpectedly.
- The abuse-report form retains a stable form reference for its asynchronous success reset.

## Verification still required before production
- Run tests, ESLint, TypeScript typecheck, Prisma generation and the production build in GitHub Actions.
- Perform a desktop/mobile browser pass through share creation, receive code, password unlock, view-once reveal/consumed, expiry, revoke and report-abuse success/error states.
- Verify view-once concurrent opens and interrupted delivery, incorrect creator revoke tokens, abuse-report rate limiting, client-IP proxy trust, and the GitHub cleanup secret configuration.
- Do not deploy this branch until automated checks pass and the owner explicitly approves deployment.
