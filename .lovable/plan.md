

# Bump Colombo Starting Influence to 12.5

Colombo's starting influence goes from 10 → **12.5**, slotting it just above Lucchese (12) in the ladder.

## Heads-up on the half-point

All other starting resources are integers, and the HUD/Phase-1 dampener math has only been exercised against whole numbers. 12.5 will display as "12.5%" in the influence badge (or round depending on the formatter). If you'd rather keep integers, 12 or 13 would be safer — but per your request, 12.5 it is.

## New influence ladder

| Family   | Influence |
|----------|-----------|
| Gambino  | 20        |
| Genovese | 15        |
| **Colombo**  | **12.5** |
| Lucchese | 12        |
| Bonanno  | 8         |

Note: this flips Colombo above Lucchese, breaking the previous `lucchese > colombo` ordering. The ladder test in `FamilySelectionScreen.starting-balance.test.tsx` asserts `lucchese > colombo`, so it will be updated to `colombo > lucchese`.

## Files Touched

- `src/components/FamilySelectionScreen.tsx` — Colombo `influence: 10` → `influence: 12.5`.
- `src/components/__tests__/FamilySelectionScreen.starting-balance.test.tsx` — update Colombo `EXPECTED.colombo.influence` to `12.5`; flip ladder assertion to `gambino > genovese > colombo > lucchese > bonanno`.
- `mem://gameplay/starting-balance.md` — record Colombo 12.5 and the new ladder ordering.

## Verification

- Pick Colombo → HUD shows **12.5** influence at Turn 1.
- All other families' influence unchanged.
- Run vitest → starting-balance test passes with updated snapshot and ladder.
- AI starting influence (8–15 random) unchanged; AI test still passes.

## What Doesn't Change

- Money, soldiers, politicalPower, respect for any family. Other families' influence. AI initialization. Phase 1 ×0.5 passive dampener.

