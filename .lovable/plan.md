# Premium Per-Family Unit Art

Replace the current single Soldier and Capo PNGs with **10 family-tuned premium images** (5 families × 2 ranks) and tighten the in-map presentation. Capo stays close to current silhouette but reads cleaner and a touch more authoritative.

## Art direction

Shared base (consistency across all 10):
- Noir 1940s mafia figures, full body, front-facing, slight contrapposto
- Fedora, suit, long shadow; transparent background; soft rim light
- Painted/illustrated style (not photoreal, not cartoon) — matches existing board-game noir aesthetic
- Square 1024×1536 tall portrait, transparent PNG

Per-family flavor (subtle — color/accent only, silhouette stays family-readable at hex scale):
- **Gambino** (cyan #42D3F2) — charcoal suit, cyan pocket square / tie
- **Genovese** (green #2AA63E) — olive suit, green tie
- **Lucchese** (royal blue #4169E1) — navy pinstripe, blue tie
- **Bonanno** (crimson #DC143C) — black suit, red tie / boutonnière
- **Colombo** (purple #8A2BE2) — dark purple suit, violet tie

Rank differentiation (Capo = "current+", per user pick):
- **Soldier**: shorter jacket, hands at sides or one in pocket, plain fedora, no accessory
- **Capo**: longer overcoat over suit, fedora with subtle band detail, cigar in hand, a small gold lapel pin; ~10% broader stance. Same color palette as the family's soldier so they read as same family at a glance.

## Files

New assets (generated via premium model, transparent PNG):
- `src/assets/units/soldier-gambino.png` … `soldier-colombo.png` (5)
- `src/assets/units/capo-gambino.png` … `capo-colombo.png` (5)

Code changes (presentation only, no game-logic touched):
- `src/components/SoldierIcon.tsx` — import a `family → image` map; pick image by `family` prop. Keep existing glow/badge/selection logic untouched.
- `src/components/CapoIcon.tsx` — same pattern. Bump `size` from 32 → 34 and the gold ring stroke from 2 → 2.25 for the subtle "Capo reads slightly more important" tweak. Keep current star/level badge.
- Delete old `src/assets/soldier-figure.png` and `src/assets/capo-figure.png` once both icons are switched over.

No changes to:
- Hex placement, stacking, badges (count, wounded, marked-for-death)
- Selection rings, pulse animation, drop-shadow tinting by family color
- Any game state, AI, or balance code

## Quality bar

After generation, spot-check all 10 images at the in-map render size (~20–34px tall) to confirm:
- Family color is recognizable without the colored glow halo
- Capo vs Soldier silhouette difference is readable at small size
- No background fringe / halo artifacts on transparent PNG

If any family's image fails the check, regenerate just that one before swapping the import.

## Out of scope

- Family crest shields, animated auras, pedestals (rejected option)
- HQ icon, hitman icon, scout/intel overlays
- Any gameplay or rule changes
