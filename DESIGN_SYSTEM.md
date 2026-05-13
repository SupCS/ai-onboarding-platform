# AI Digital Onboarding Design System

This document records the visual direction from `design-system.jsx` and how it should be applied to the existing product.

## Source Of Truth

The application code is the product truth. Design reference files are visual references only.

When a design reference conflicts with the current app, keep the current app behavior:
- Do not add extra buttons, actions, pages, states, permissions, or flows just because they appear in the design reference.
- Do not rename actions or change business logic to match the design reference.
- Do not replace existing user journeys unless the product code or a separate user request says to.
- Transfer visual style, spacing, layout patterns, typography, colors, and component states where they fit the existing UI.

## Brand Foundation

The UI should feel like an AI Digital corporate learning hub: clean, direct, high-contrast, and energetic, with Yves Klein Blue as the main brand anchor.

Primary palette:
- `--aid-blue`: `#0009DC`, primary action and strongest brand color.
- `--aid-ink`: `#0B0B0B`, main text.
- `--aid-slate`: `#33344A`, secondary text.
- `--aid-mute`: `#80808E`, captions, helper text, disabled-adjacent text.
- `--aid-blue-50`: `#F5F5FE`, light blue tint surfaces.
- `--aid-bg-3`: `#F2F1F3`, neutral surface.
- `--aid-lime`: `#AEF33E`, alternate CTA.

Status and accent colors:
- Success: `#229E5A`
- Warning: `#FF642D`
- Error: `#D62F2F`
- Internal/accent pink: `#F0348E`
- Info/cyan: `#42B1CF`

Use blue for primary actions. Use lime only for alternate CTA moments. Use status colors for status, feedback, quiz results, and badges, not as broad page backgrounds.

## Typography

Use Inter for UI, body text, controls, labels, and readable content.

Use Barlow Semi Condensed Black for display-scale headings, large numbers, hero/stat figures, and strong page-level identity moments.

Recommended text styles:
- Display: Barlow Semi Condensed, `80px` to `96px`, `900`, tight line-height around `0.9` to `0.95`.
- Section heading: Inter, `32px`, `700`.
- Card title: Inter, `18px`, `600` to `700`.
- Body: Inter, `15px`, `400`, line-height around `1.5`.
- Caption/meta: Inter, `12px`, muted color.
- Eyebrow/status label: Inter, `11px` to `12px`, `700`, uppercase, letter spacing around `0.08em` to `0.1em`.

Avoid changing real product copy just to match sample text from the design reference.

## Buttons

Buttons are pill-shaped with uppercase labels and confident spacing.

Default button style:
- Border radius: `999px`
- Medium padding: `14px 26px`
- Small padding: `10px 18px`
- Font size: `12px` to `13px`
- Font weight: `700`
- Letter spacing: about `0.06em`
- Text transform: uppercase

Variants:
- Primary: blue background, white text, no border.
- Secondary: transparent background, blue text, subtle blue border.
- Alternate CTA: lime background, slate text.
- Dark: ink background, white text.
- Disabled: neutral surface background, muted text, disabled cursor.

Preserve existing button labels, click handlers, visibility rules, and permissions.

## Chips And Badges

Chips are rounded pills used for content type, filters, compact metadata, and status.

Content chips:
- Padding: `6px 14px`
- Radius: `999px`
- Font size: `12px`
- Font weight: `600`
- Prefer blue-tinted or neutral backgrounds.

Status badges:
- Padding: `4px 12px`
- Radius: `999px`
- Font size: `11px`
- Font weight: `700`
- Uppercase with slight tracking.
- Use semantic colors for passed, warning, error, internal, info, quiz, and similar statuses.

## Forms And Quiz States

Quiz answer rows use large pill-radius selectable surfaces:
- Row padding: `14px 18px`
- Radius: `999px`
- Gap between radio indicator and label: about `14px`
- Border width: around `1.5px`

States:
- Idle: white background, subtle blue border.
- Selected: light blue background, blue border, blue selected dot.
- Correct: subtle green background, green border, green filled check indicator.
- Incorrect: subtle red background, red border, red filled cross indicator.

Free-text inputs should use a softer `12px` radius, readable body text, and clear counters or helper text when the product already has min/max constraints.

## Cards And Surfaces

Cards should be simple and calm, with light borders or restrained tinted backgrounds.

Card patterns:
- Default card: white background, `1px` light blue border, radius around `14px`, padding around `24px`.
- Tinted info/callout: light blue background, no heavy shadow.
- Brand/stat card: blue background, white text, lime or light accent label.

Avoid adding nested cards or decorative shells where the existing UI already has a clear layout.

## Layout Rhythm

Use generous page spacing for management and learning views, but keep operational screens scannable.

Reference rhythm:
- Page/document padding: around `48px 56px` on wide screens, responsive on smaller screens.
- Section spacing: about `40px 0`.
- Section dividers: subtle `1px` light blue borders.
- Grid gaps: `16px` to `32px`.

The layout can be adapted to the real app. If the design reference has a sample-only composition that does not match the current product flow, keep the product flow and borrow only the visual treatment.

## Implementation Notes

This project uses MUI as the primary UI system. Prefer MUI components and `sx` styling when applying this system.

Keep changes practical:
- Add shared constants or theme tokens only when they reduce repetition.
- Prefer local `sx` updates for isolated visual changes.
- Do not introduce TypeScript, Tailwind CSS, or new styling libraries.
- Keep accessibility states visible: focus, hover, disabled, selected, success, and error.
