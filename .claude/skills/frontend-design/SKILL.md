---
name: frontend-design
description: Design system and craft checklist for building distinctive, high-quality frontend pages (portfolio sites, landing pages). Load before writing any HTML/CSS/Tailwind code in this project.
---

# Frontend Design Skill

You are producing a page that should feel designed by a senior product designer, not generated. Work through these steps in order.

## 1. Direction (before code)
Write 3-5 lines stating: mood (two adjectives), palette (primary + neutral + one accent, hex), type pairing (display + body), layout idea (what makes it non-template: asymmetry, oversized type, editorial grid, sticky sections, etc.). Ask the owner only if `brand_assets/README.md` is empty on something essential.

## 2. Design tokens (define once in `tailwind.config` + CSS variables)
- Colors: `brand` (50-950 scale derived from the primary), `ink` (text), `surface` (base / elevated / floating), `accent`.
- Fonts: `display` and `body`. Arabic: pair an Arabic display font with an Arabic sans (e.g. "Noto Naskh Arabic" / "IBM Plex Sans Arabic"), and load Latin fallbacks.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128. Section padding 96-128 desktop, 64 mobile.
- Radii: 8 / 16 / 24 / full. Pick two and stick to them.
- Shadows: `0 1px 2px rgb(brand/6%), 0 8px 24px rgb(brand/10%), 0 24px 48px rgb(brand/8%)`.
- Motion: `cubic-bezier(.22,1,.36,1)`, 250-450ms. Only `transform` and `opacity`.

## 3. Typography rules
- Hero heading: clamp(2.75rem, 7vw, 6rem), weight 600-800, tracking -0.03em, line-height 1.0-1.1.
- Section heading: 2-3rem, tracking -0.02em.
- Body: 1rem-1.125rem, line-height 1.7, max-width 65ch.
- Eyebrow labels: 0.75rem uppercase, tracking 0.12em, muted color.
- Never more than 2 families, never more than 3 weights.

## 4. Layout patterns that avoid the "template" look
- Break the grid at least once (an image bleeding off-edge, a heading overlapping a card).
- Use a 12-col grid with intentional asymmetry (7/5, 8/4) rather than centered 3-col cards everywhere.
- Hero: big type + one strong visual + one CTA. No three-icon feature row under it.
- Work grid: mixed sizes (one large, two small) beats uniform cards.
- Generous whitespace between sections; tighter inside components.

## 5. Surfaces and depth
- Base background with 2-3 layered radial gradients + SVG noise overlay at 3-6% opacity.
- Elevated cards: 1px border in `brand/10%`, subtle tinted shadow, slight background lift.
- Floating elements (nav, modals, tooltips): stronger shadow + backdrop-blur.

## 6. Interaction checklist (every clickable element)
- `hover:` transform (translateY(-2px) or scale 1.02) + color shift.
- `focus-visible:` 2px ring in brand color with offset.
- `active:` scale 0.98.
- Links in body text: underline with offset, thickness 1.5px.
- Reveal-on-scroll with IntersectionObserver; disabled under `prefers-reduced-motion`.

## 7. Images
- Wrap in a container with `overflow-hidden rounded-*`.
- Overlay: `bg-gradient-to-t from-black/60 via-black/10 to-transparent`.
- Color treatment: brand-tinted layer with `mix-blend-multiply` at 20-40%.
- `loading="lazy"` below the fold, explicit width/height to avoid layout shift, real alt text.

## 8. Responsive and RTL
- Build mobile (360-390px) first, then 768, then 1280+.
- Use logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start`/`end`) so RTL just works.
- Test that nothing overflows horizontally at 360px.
- Tap targets >= 44px.

## 9. Quality gate before saying "done"
- Screenshot desktop + mobile, read both, list concrete mismatches, fix, re-screenshot. Minimum 2 rounds.
- No default Tailwind blue/indigo. No `transition-all`. No `shadow-md`. No lorem ipsum in final.
- Contrast >= 4.5:1 for body text, >= 3:1 for large headings.
- Title, meta description, og tags, favicon, `lang`/`dir` set.
