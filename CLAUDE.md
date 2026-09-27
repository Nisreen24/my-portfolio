# CLAUDE.md — Portfolio Website Rules

## Project
- Personal portfolio website. Goal: a distinctive, high-craft site that shows the owner's work and personality — not a template.
- Owner communicates in Arabic (Egyptian). Reply in Arabic; keep code, file names and commit messages in English.
- Site copy language: ask the owner once (Arabic / English / both). If bilingual, build RTL support properly (`dir="rtl"`, logical CSS properties, mirrored layouts).

## Always Do First
- **Invoke the `frontend-design` skill** (project skill in `.claude/skills/frontend-design/`) before writing any frontend code, every session, no exceptions.
- Check `brand_assets/` for logos, colors, fonts, photos, CV, project screenshots. Use real assets when present.
- Read `brand_assets/README.md` for the owner's name, role, links and voice.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below). Use the `mobbin` MCP tools (search_screens / search_flows / search_sections) for real-world portfolio references before designing.
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server in the background: `node serve.mjs` (serves the project root at `http://localhost:3000`).
- If port 3000 is already in use, the server is already running — do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed locally (`node_modules/puppeteer`). Chrome lives in the user's `~/.cache/puppeteer/`.
- Desktop: `node screenshot.mjs http://localhost:3000 [label]` → 1440×900, full page.
- Mobile: `node screenshot.mjs http://localhost:3000 [label] --mobile` → 390×844, full page.
- Custom: `--width=1024 --height=768`, `--no-full` for viewport-only.
- Screenshots save to `./temporary screenshots/screenshot-N[-label].png` (auto-incremented, never overwritten).
- After screenshotting, read the PNG with the Read tool and analyze it.
- Always check BOTH desktop and mobile before declaring a section done.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px".
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing, overflow/horizontal scroll on mobile.

## Output Defaults
- Single `index.html` at project root, all styles inline in a `<style>` block, unless user says otherwise.
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>` with a `tailwind.config` block for custom colors/fonts.
- Fonts via Google Fonts (`<link>`), preconnected. Arabic text needs an Arabic-capable font (e.g. IBM Plex Sans Arabic, Cairo, Tajawal, Noto Naskh Arabic).
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`.
- Mobile-first responsive. No horizontal scroll at 360px.
- Semantic HTML, proper `<meta>` (title, description, og:image), `lang` attribute, alt text on every image.
- Keep vanilla JS small and inline. No frameworks unless the owner asks.
- **Motion library: GSAP 3.13** (core + ScrollTrigger + SplitText) from cdnjs, pinned version. Load the project `gsap-*` skills (`.claude/skills/gsap-*`) before writing GSAP code. Wrap all motion in `gsap.matchMedia()` with a `prefers-reduced-motion` branch. CSS transitions only for hover/focus states.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color from `brand_assets/` or derive one and define it in `tailwind.config`.
- **Shadows:** Never flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never the same font for headings and body. Pair a display/serif with a clean sans. Tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Spring-style easing. Respect `prefers-reduced-motion`.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces have a layering system (base → elevated → floating), not all on the same z-plane.
- **Dark mode:** Support `prefers-color-scheme: dark` unless the design is single-theme by intent.

## Portfolio-Specific
- Sections (default order, adjust with owner): Hero → Selected Work → About → Skills/Services → Experience → Contact. No section without content behind it.
- Every project card: title, one-line outcome, role, tools, image, link. No lorem ipsum in the final version.
- Contact: real email/social links from `brand_assets/README.md`. Never invent links.
- Performance: no image over 400KB, lazy-load below-the-fold images, no unused libraries.

## Hard Rules
- Do not add sections, features, or content not in the reference.
- Do not "improve" a reference design — match it.
- Do not stop after one screenshot pass.
- Do not use `transition-all`.
- Do not use default Tailwind blue/indigo as primary color.
- Do not commit `temporary screenshots/` or `node_modules/`.
