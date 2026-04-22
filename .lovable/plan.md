

# Apply Phase 1 Respect Reduction Across All Families

The previous edit only updated the default in the hook, but `FamilySelectionScreen.tsx` defines per-family `startingResources.respect` values that override it. That's why Colombo still shows 25%.

## Per-family starting respect changes

Subtract 10 from each family's starting respect to mirror the 25→15 intent across the board:

| Family   | Current | New |
|----------|---------|-----|
| Gambino  | 20*     | 10  |
| Genovese | 30*     | 20  |
| Lucchese | 15      | 5 (or keep at 15 — see note) |
| Bonanno  | 35      | 25  |
| Colombo  | 25      | 15  |

\* I'll confirm Gambino/Genovese values when editing (lines above 80). The pattern is "−10 across the board" so the relative family identity (Bonanno proud/high, Lucchese humble/low) is preserved.

**Note on Lucchese**: 15 → 5 may feel too low. Recommend floor at 10 for Lucchese so no family starts under 10.

## Files Touched

- `src/components/FamilySelectionScreen.tsx` — update `respect:` in all 5 `startingResources` blocks (lines ~56, 76, 96, 116, 136 — exact lines confirmed at edit time).
- `mem://gameplay/starting-balance` — record the new per-family starting respect values.

## Verification

- Pick Colombo → HUD shows **15%** respect at turn 1 (was 25%).
- Pick Bonanno → **25%** (was 35%).
- Pick Lucchese → **10%** (was 15%).
- All families: Phase 1 passive respect gain still halved (already shipped).

## What Doesn't Change

- AI starting respect, family bonuses/powers, money/soldiers/influence/politicalPower starts, Phase 1 passive ×0.5 multiplier, combat respect spikes.

