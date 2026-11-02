# Moog Design System

## Product idea
Moog gives a piece of content a short, deliberate life. Someone creates a share, chooses its lifetime and access controls, then sends it on. The visual language follows that sequence: compose, seal, release, expire.

## Art direction
- **Direction:** sentence-as-layout, adapted for a working product rather than a poster. The short promise leads; a believable share artifact sits beside it.
- **Visual character:** obsidian surfaces, sharp type, and one electric-lime action colour. The interface should feel precise and considered, with enough visual weight to make the product feel real.
- **Reference study:** use Linear's density and product-first hierarchy and Apple's discipline around product presentation as references, not as brand templates. Moog keeps its own lime accent and short-life sharing metaphor.
- Avoid decorative gradients, glow effects, glass panels, filler status strips, and invented social proof.

## Tokens
### Dark
- Canvas: `#090B09`
- Raised surface: `#111410`
- Secondary surface: `#191D17`
- Primary text: `#F2F4EC`
- Muted text: `#929A8B`
- Action lime: `#D5FF68`
- Action ink: `#17200D`

### Light
- Canvas: `#F3F5EF`
- Raised surface: `#FFFFFF`
- Secondary surface: `#E8ECE3`
- Primary text: `#171C15`
- Muted text: `#697364`
- Action lime: `#C5F45A`

- Use Geist for interface text. Keep display type sans-serif and tightly tracked; do not introduce a second typeface for decoration.
- Use a 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 96 spacing rhythm.
- Controls use 8–10px radii. Large product surfaces use 12–18px radii. Avoid rounding every element into a pill.

## Layout
- The hero has a left-aligned promise and actions with the share preview on the right.
- The composer is the primary task surface. Keep Send and Receive together in one mode switch, with enough contrast between the editing area and its controls.
- Use distinct section compositions: a varied feature row, a step sequence, paired use cases, a contained privacy panel, and a plain FAQ.
- Keep the main content aligned to one max-width grid. At tablet width, preserve the product preview where practical; on mobile, stack the hero and preview before the composer.
- Do not add decorative grids, invented metrics, customer logos, or testimonials.

## Components
- Primary actions use a flat lime fill with dark text. Secondary actions use a transparent surface and a visible border.
- Inputs use the canvas colour, clear focus rings, readable helper text, and explicit disabled/error states.
- Use the share preview as a product artifact, not as a claim that it is a live share.
- Security copy must be accurate: Moog stores content on its server to deliver a share, access is controlled, and the service is not end-to-end encrypted. Expiry limits access through Moog; it cannot erase copies someone has already made.
- Keep six-digit receive entry accessible by keyboard, paste, and mobile numeric input.

## Copy
- Prefer short, concrete sentences. Use the words users see in the interface: create, receive, open, expiry, password, and view once.
- Avoid inflated claims such as “unhackable,” “military-grade,” or “completely secure.”
- Do not use fake activity, fabricated usage numbers, or generic trust claims.
- Keep each section useful. Remove a label or sentence if it repeats what the heading already says.

## Accessibility and motion
- Preserve semantic HTML and existing interactions.
- Keep keyboard focus visible, maintain readable contrast, and support reduced motion.
- Avoid motion that merely decorates. Any hover or entrance effect should be brief and should never be required to understand the interface.


## Homepage reading order (November 2026)
1. **Header and hero:** state the short-life sharing promise, with a single believable share artifact as the visual anchor.
2. **Share composer:** place the working Text / Code / Photo creation controls directly after the hero. Keep Send/Receive in the same interaction area.
3. **About Moog:** explain the product and its use cases without implying end-to-end encryption or encouraging the sharing of highly sensitive credentials.
4. **How it works:** show the real four-step lifecycle from content to expiry.
5. **Security, FAQ, and contact:** answer practical trust questions with plain language and no invented social proof.
6. **Footer:** keep About, Privacy, Terms, Contact, and Report abuse links as the final navigation layer.

## Skill application
- **Design MD:** used a restrained product-led system inspired by Linear's hierarchy and Stripe's crisp control surfaces; retained Moog's moss/lime accent rather than copying either brand.
- **Taste Skill:** used the share lifecycle as the visual idea, a real interactive composer as the page's live element, clear section claims, responsive layouts, and reduced-motion/focus states.
- **Humanizer:** replaced inflated marketing language with specific descriptions and preserved the disclosure that Moog is access-controlled, not end-to-end encrypted.
