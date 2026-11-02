# Moog Design System

## Product idea
Moog lets someone send text, code, or an image with a defined lifetime. The interface should feel like a private note placed in a sealed envelope: considered, clear, and temporary.

## Visual direction
- Editorial quiet luxury: warm paper, ink, restrained moss, fine rules, generous negative space.
- Use the idea of an envelope, a note, a seal, and an expiry label as the product's visual language.
- The share preview should look like a real artifact from the product, not a decorative illustration.
- Keep the interface calm and useful. Avoid loud gradients, glowing cards, rainbow accents, and filler UI.

## Tokens
- Light canvas: `#F5F4EF`; raised surface: `#FFFEFA`; primary ink: `#191D19`.
- Muted text: `#737B73`; hairline: `#DEDFD6`; moss action: `#294B39`.
- Dark canvas: `#111410`; raised surface: `#191D18`; text: `#F2F2E9`; action: `#D4ED9B`.
- Radius: 12px controls, 18–22px large surfaces, pill-shaped primary actions.
- Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72 / 96px.
- Typography: Geist for interface text; Georgia/serif for editorial display headlines; Geist Mono for technical labels.

## Layout rules
- Keep the marketing hero in a two-column composition on desktop: promise and actions at left, a tangible live share preview at right.
- Keep the content creation surface visually dominant after the hero. Send/Receive is a single clear mode switch.
- Use a consistent max-width and align the header, hero, composer, sections, and footer to the same grid.
- Collapse to one column on mobile. Buttons and digit inputs must remain comfortable to tap.
- Use a fine architectural grid only as a quiet background texture. Never let it compete with text.

## Components
- Primary action: solid moss in light mode, soft sage in dark mode; pill shape, high contrast.
- Secondary action: transparent with a clear hairline border.
- Cards: paper/raised surfaces, subtle borders, no heavy shadow; use hover movement sparingly.
- Forms: neutral canvas, obvious focus ring, readable helper/error text, clear disabled states.
- Security and expiry labels should be factual. Do not imply end-to-end encryption or protection against copying.

## Copy rules
- Write in short, specific sentences.
- Describe what Moog does and what users control. Avoid claims such as “military-grade,” “unhackable,” or “completely secure.”
- State the server-storage and copy limitations where relevant.
- Keep labels action-oriented: “Create a share,” “Receive a share,” “Open share,” and “Choose expiry.”
- No filler taglines after every section. Every line should help someone understand, decide, or act.

## Accessibility and motion
- Preserve semantic HTML and existing interactions.
- Keep visible keyboard focus, readable contrast, and reduced-motion support.
- Ensure the six-digit receive flow works with keyboard navigation, paste, and mobile numeric keyboards.
