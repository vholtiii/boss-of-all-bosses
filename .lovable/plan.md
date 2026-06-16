# Refine Map Size selector — Noir Tactical Dossier

Going with the **Noir Tactical Dossier** direction: squared cards with tactical crosshair corners, true hex-mask preview windows, condensed Oswald labels, and Courier meta — matches the dossier cards directly above (FILE №001/002/003).

## Scope — `src/components/FamilySelectionScreen.tsx` only

**`MapSizeHexPreview` (lines 244–300)**
- Drop the circular clip. Square preview window with tactical corner brackets (top-left + bottom-right L-marks) and a thin inner border. Inactive border `border-border/40`, active `border-primary/60`.
- Per-size hex density: small = 4 large hexes, medium = 7 (current radius=3 layout, kept), large = denser grid filling the frame.
- Inactive: muted slate fill, ~30% opacity, brightens on hover. Active: amber-tinted hexes with soft inset glow.
- Tiny mono "REF_SML_01 / REF_MED_04 / REF_LRG_07" tag in the bottom-left corner of the preview window for tactical-document feel.

**Card buttons (lines 711–758)**
- Square-cornered (`rounded-none`) to match dossier cards above. Width 176px, vertical stack: preview window → label → meta.
- Inactive: `bg-card/40 border border-border/50`. Hover: `border-border` + `-translate-y-0.5`.
- Active: `bg-card/70`, 2px amber border (`border-primary`), soft amber glow `shadow-[0_0_25px_hsl(var(--primary)/0.15)]`. Replace the floating ✓ pill with a small stamped **"APPROVED"** chip in amber (top-right, slight overlap) — same vocabulary as the FILE №002 STANDARD card.
- Labels: switch from font-mono to **Oswald** (already used by the THE FIVE FAMILIES title family), uppercase, tracking-[0.25em]. Active label `text-primary` with subtle glow; inactive `text-muted-foreground`.
- Meta: Courier Prime (load via Google Fonts in `index.html` or rely on existing mono stack) — `~331 HEXES · CLASSIC` uppercase, tighter tracking.

**Section heading (new, just above the row)**
- Tiny centered "— MAP SIZE —" in mono uppercase widest tracking, matching the existing "STEP 1 · CHOOSE YOUR GAME" treatment, so the row reads as a deliberate dossier section.

**Token discipline**
- Replace inline `rgb(251,191,36)` literals with `hsl(var(--primary))` references and Tailwind `primary` classes. No new hardcoded hex.
- Honor `prefersReducedMotion` already in scope: skip translate-y hover for those users.

## Out of scope
No changes to behavior, the family roster, difficulty cards, advanced/seed panel, title, or starting-balance test fixtures. Three sizes and `setMapSize` wiring untouched.

## Verification
- Visual: load `/`, confirm the three squared cards render with crosshair corners, hex window previews, APPROVED chip on active, and Oswald labels.
- Run `bunx vitest run src/components/__tests__/FamilySelectionScreen.starting-balance.test.tsx`.
