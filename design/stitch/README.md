# Moog Stitch redesign

This folder documents the approved visual direction exported from Google Stitch.

- Design direction: Quiet Ephemerality
- Primary canvas: warm alabaster
- Primary text: obsidian
- Primary action: deep petrol navy
- Accent: restrained chartreuse
- Typography: Geist and JetBrains Mono
- Layout: editorial spacing, hairline borders, compact metadata, restrained depth

The exported screens were adapted to Moog's existing Next.js pages and working components rather than copied as standalone HTML.

Important implementation note: some generated Stitch mockups contain claims such as end-to-end encryption, zero-knowledge storage, zero retention, AES-256-GCM payload encryption, and canary verification. Those claims are not established by the current production implementation and were deliberately excluded. Existing accurate privacy disclosures remain in the product.

Current design coverage:
- Home and send/receive entry
- Create share and expiry/security controls
- Share success
- Recent shares and local-history states
- Text, code, and image viewers
- Password-protected viewer
- View-once confirmation and reveal flow
- Expired/revoked/invalid share state
- How it works
- Privacy, terms, about, contact, and report abuse
