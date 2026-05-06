## Goal

Polish the Family Selection screen for clarity and engagement. Implementing items **#2, #3, #4, #6, #7** from the prior suggestion set. Skipping #1 (setup-bar consolidation) and #5 (BEGIN button hero treatment) per user request.

File: `src/components/FamilySelectionScreen.tsx` (single file — no new assets, no data changes).

---

## #2 — Difficulty chips: lighter, clearer

- Each chip shows only the flavor name (**Made Man / Wiseguy / The Don**) on one line, with a small color dot (green/yellow/red) inline instead of emoji.
- Mechanical effect text (`+50% money, weaker AI`) moves into a Radix `Tooltip` on hover.
- Drop the cramped two-line layout — chips become single-line pill buttons of consistent height.

## #3 — Family cards: bigger, calmer, keyboard-friendly

- Card width 155 → 180 px; bump internal padding so trait bars breathe.
- Soften hover transform: `scale 1.07 → 1.03`, `rotateY 6° → 3°`, `rotateX -3° → -1.5°`. Less jitter; neighbors stop overlapping.
- Make each card focusable: `tabIndex={0}`, `role="button"`, `aria-pressed={isSelected}`. Selecting via Space/Enter when focused.
- Add **Arrow Left / Right** keyboard navigation across the row (cycles selection). Wire a `keydown` listener at screen level that updates `selectedFamily`.
- Move the motto reveal **inside** the card as a soft overlay (absolute inset-0, dark backdrop, fade in on hover) so it stops getting clipped by the `clip-path`.
- Add a small "★ Recommended for new players" tag on the Lucchese card (the only Easy-flavored family).

## #4 — Detail panel: smoother transitions + auto-scroll into view

- When a family is selected, smoothly `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on the detail panel ref so the BEGIN button is always visible without manual scrolling.
- Cap detail panel max-height (with internal `overflow-y-auto`) on short viewports so the BEGIN button stays anchored.
- Improve cross-family transition: the crest cross-fades and the colored accent line animates its width via Framer Motion when switching between families (currently the whole panel just re-mounts).

## #6 — Audio sting

- Wire `useSoundSystem.playSound` into the family-card click handler — short `'click'` cue on selection.
- Different cue (`'success'`) when the BEGIN button is pressed.

## #7 — Micro-polish

- Wrap setup controls + cards inside a single `max-w-6xl mx-auto` container so spacing scales evenly on ultra-wide viewports (the current 2897 px preview makes elements feel marooned).
- Reduce vignette outer alpha `0.95 → 0.85` so the background art reads through more.
- Add four small SVG art-deco corner ornaments (top-left/right, bottom-left/right of the viewport) for a "framed playbill" feel — pure decoration, `pointer-events-none`, low opacity.
- Particles untouched (already feels right at 50).

---

## Out of scope

- Setup-bar consolidation (#1) and BEGIN button hero treatment (#5) — skipped per request.
- Any gameplay/data/balance changes; family stats, starting resources, and difficulty mechanics unchanged.

## Files

- `src/components/FamilySelectionScreen.tsx` — all changes here.
