## Goal
Replace the current soldier unit visual on the hex map with a new figure based on the uploaded reference image (1920s-style mafia soldier in long black coat, flat cap, holding a Tommy gun).

## Changes

### 1. Generate the new soldier asset
- Use the uploaded reference (`user-uploads://mafia_soldier_image.png`) as the model.
- Produce a clean, transparent-background PNG suited for use as a small map token (the icon renders at ~14px wide on the hex map, so the figure must read clearly at small sizes — strong silhouette, minimal fine detail).
- Style: match existing `capo-figure.png` treatment (full-body, front-facing, painterly noir illustration) so soldiers and capos feel like one art set, just with the soldier visibly less senior (cap + Tommy gun vs. capo's fedora/suit).
- Save as `src/assets/soldier-figure.png`, replacing the existing file.

### 2. No code changes required
- `src/components/SoldierIcon.tsx` already imports `@/assets/soldier-figure.png` and applies family color glow, selection ring, count badge, and marked-for-death badge. Swapping the asset file is enough.
- Sizing (`size = 14`, height `size * 1.5`) stays as-is so existing hex layouts, stacking, and badges are unaffected.
- No changes to `CapoIcon`, hex grid, or any game logic.

### 3. QA after generation
- Visually inspect the generated PNG at full size and at the actual rendered map size to confirm:
  - Transparent background
  - Readable silhouette at ~14px
  - Color-glow tinting still works (figure is dark enough for the family color halo to show)
- If the small-size silhouette is muddy, regenerate with stronger contrast / simplified outline.

## Out of scope
- Capo art, boss art, HQ art.
- Hex icon sizing or layout changes.
- Any new badges, animations, or unit variants (e.g., separate art for mercenary vs. local recruit, wounded soldier, rat).
