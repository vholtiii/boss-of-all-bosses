# Difficulty + Map Size: Dossier Redesign

Scope: visual-only refresh of the difficulty selector and the SMALL/MEDIUM/LARGE row on the Family Selection screen. No gameplay, data, or callback changes. File: `src/components/FamilySelectionScreen.tsx` (lines ~443–628).

Palette stays as-is: charcoal `#1a1a1a` / `#262626` surfaces, amber `#fbbf24` (selected), rose `#ef4444` (hard accent), emerald (easy accent).

## 1. Difficulty cards — "Manila dossier folders"

Replace the current rounded-card look with a file-folder aesthetic. Each card becomes a piece of case-file paper clipped to a folder.

**Folder shape & paper**
- Card body: slightly off-square (`rounded-sm`), aged-paper tint via layered gradient (`linear-gradient(180deg, rgba(255,240,210,0.04), rgba(255,240,210,0.01))` over `hsl(var(--card))`), faint noise (`NOISE_BG`) at opacity 0.06 always-on, subtle vignette in corners.
- Top edge: protruding "folder tab" — a small 70px-wide notch absolutely positioned at `top:-10px left:18px`, same paper tint, holding a hand-typed code label (e.g. `FILE No. 001 — EASY`) in `font-mono uppercase text-[9px]`.
- Two faint horizontal rule lines (1px, `rgba(255,255,255,0.04)`) behind the stats list to evoke ruled paper.
- Slight per-card rotation: easy `-0.6deg`, normal `0`, hard `+0.6deg` to look like scattered files. Reset to 0 on hover/active for crispness.

**Stamps replace pill chips**
- Replace the rounded `EASY/STANDARD/HARD` chips with a diagonal rubber-stamp graphic in the top-right: bordered rectangle, 2px solid in the meta color, rotated `-8deg`, `font-stencil`/`font-mono` uppercase, with `mix-blend-mode: screen` and reduced opacity (0.85) so it reads as ink on paper. Add 1–2px stamp "smudge" via tiny `text-shadow` offset.
- Selected state: stamp swaps to a gold `APPROVED ✓` stamp (amber color) with a small drop-shadow.

**Header**
- Replace emoji icon block with a typewriter-style header row: `font-playfair` name on the left, small `CLASSIFIED` micro-label under it in `font-mono text-[9px] tracking-[0.3em] text-muted-foreground`.
- Keep the existing emoji but render it smaller (text-xl) inside a 28px circular "evidence sticker" with a dashed border in the meta color.

**Quote block**
- Style as a handwritten margin note: italic, slight `transform: rotate(-0.4deg)`, with a tiny paperclip glyph (`📎` or inline SVG) pinning it to the upper-left.

**Stats list**
- Render as a typed table: monospace labels (`font-mono text-[10px] uppercase tracking-wider`), values right-aligned in the existing tone colors but bolder weight (700). Add dotted leader lines (`border-b border-dotted border-border/30`) between label and value for that case-file feel.

**Selected state**
- Border thickens to 2px solid in meta color, paper brightens (gradient amplitude doubled), subtle outer glow at `0 0 24px meta.glow` retained, plus an inner highlight `inset 0 0 0 1px rgba(255,255,255,0.04)`.
- Tab label adds `★` prefix.

## 2. Map size selector — Mini hex-grid previews

Replace the three pill buttons with three taller cards (~120×96px) each containing a live SVG of a hex cluster sized to its option.

**Per option**
- SVG renders a tessellated honeycomb (pointy-top hexes, `r≈6` for small, `r≈5` for medium, `r≈4` for large) clipped to a circular mask to suggest a city map. Hex fill `hsl(var(--muted) / 0.35)`, stroke `hsl(var(--border))` at 0.5px.
- Sprinkle 4–6 hexes with subtle family-color tints (amber, emerald, rose, blue, purple) at 35% opacity to hint at territory control.
- Below the SVG: bold uppercase label (`SMALL` / `MEDIUM` / `LARGE`) and a one-line description (`~169 hexes`, etc.) in `text-[10px] text-muted-foreground`.

**Selected state**
- Amber border (2px), amber glow (`0 0 18px rgba(251,191,36,0.45)`), label turns amber, hex strokes brighten to amber at 0.6 opacity, and a tiny `✓` badge pins the top-right.

**Layout**
- Switch row to `flex gap-3 justify-center mt-4`, cards `w-[140px]`.

## Out of scope
- Family cards grid below (unchanged).
- Seed input row (unchanged).
- Any gameplay/state/callback wiring.

## Technical notes
- Pure JSX/Tailwind/inline-style edits inside `FamilySelectionScreen.tsx`.
- New helper component `MapSizeHexPreview` (small, in-file) renders the SVG honeycomb given a hex radius and count.
- Continue using existing `meta.color/glow/tint`, `NOISE_BG`, `cn`, and `motion.button` — no new deps.
- Respect `prefersReducedMotion`: skip the per-card rotation when true.
