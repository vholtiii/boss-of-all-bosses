## Goal

Fix the visual glitch where promoting a soldier to capo can leave **no unit icon** on the hex after the promotion ceremony resolves — the soldier disappears (it became a capo) but the capo icon never appears.

---

## Root cause

The promotion engine logic (`useEnhancedMafiaGameState.ts` line ~3477, end-of-turn promotion-ceremony resolution) is correct: it converts the soldier in place to `type: 'capo'` while preserving `id`, `q/r/s`, and family. `deployedUnits` is updated and `syncLegacyUnits` runs at the end of `endTurn`. So the data is fine.

The bug is in the **renderer** in `src/components/EnhancedMafiaHexGrid.tsx` around line **1409**:

```tsx
{showSoldiers && unitsHere.length > 0 && (
  !tile.isHeadquarters
  || expandedHQKey === key
  || gameState?.turnPhase === 'move'
  || gameState?.turnPhase === 'action'
) && (() => { /* render CapoIcon / SoldierIcon */ })()}
```

Units on **HQ hexes** are intentionally hidden during `deploy` and `tactical` phases (the design relies on the side "HQ deployment" menu instead — which only opens when the HQ is clicked / `expandedHQKey` is set).

Promotion timing makes this surface as a "vanishing unit":

1. During turn N the player promotes a soldier sitting at HQ. The 🎖️ ceremony badge shows.
2. Player ends turn → ceremony resolves → soldier becomes capo at the same HQ hex.
3. Turn N+1 starts in `deploy` phase. The HQ-suppression kicks in: the capo icon is *not* drawn on the HQ hex, and because the player has not yet clicked HQ to expand, the deployment menu is also not visible. Result: the unit appears to have vanished entirely.

It only manifests when the promotion happens at HQ, which is the most common case (players promote at HQ for safety), so the report is "sometimes". Promotions on a non-HQ hex render correctly.

A secondary, smaller issue: even when this happens, no `🎖️ Soldier Promoted to Capo!` notification draws attention to where to look — it pops as a generic toast and is easy to miss.

---

## Fix

### 1. Always render units on the player's own HQ hex

In `EnhancedMafiaHexGrid.tsx` line ~1409, change the gating so that:

- For the **player's HQ**, units are always rendered on the hex (small icons, same as any other hex), regardless of phase.
- For **rival HQs**, keep current behavior (still gated; otherwise we'd reveal capo personalities behind fog of war on rival HQs without intel).

Concretely:

```tsx
const showOnHex =
  !tile.isHeadquarters
  || tile.isHeadquarters === playerFamily      // ← new: always show on own HQ
  || expandedHQKey === key
  || gameState?.turnPhase === 'move'
  || gameState?.turnPhase === 'action';

{showSoldiers && unitsHere.length > 0 && showOnHex && (() => { ... })()}
```

This makes the just-promoted capo visible immediately on turn N+1 without requiring the player to click HQ. The HQ deployment menu (which still opens on HQ click) keeps working unchanged — it's a separate UI surface for the "deploy from reserves" flow.

### 2. Verify the engine path

Read-only confirmation step (no code change expected): walk through the promotion-resolution block at `useEnhancedMafiaGameState.ts` ~3477 and confirm:

- The promoted unit keeps its `id`, `q/r/s`, `family`.
- `pendingPromotion` is cleared.
- `maxMoves` and `movesRemaining` are reset to `CAPO_MOVES_PER_TURN` (2).
- `syncLegacyUnits(newState)` runs later in `endTurn` (line ~4909).

If anything is off (e.g. `escortingSoldierIds` not cleared on a soldier-being-escorted promotion, or duplicate-id collisions), patch in the same loop. Current read says it's clean.

### 3. Test

Add `src/components/__tests__/HexGrid.promotion-render.test.tsx` (or extend an existing test) that:

- Builds an initial state, places a player soldier at the HQ hex, marks it with `pendingPromotion: true`.
- Renders `EnhancedMafiaHexGrid` with `turnPhase='deploy'`.
- Mutates the unit to `type: 'capo'` (simulating post-promotion state) and re-renders.
- Asserts a `<CapoIcon>` (or its identifying element / `data-testid`) is present at the HQ hex without needing `expandedHQKey` to be set.

Existing tests (`bunx vitest run`) must continue to pass.

---

## Out of scope

- Reworking the HQ deployment menu UX.
- Changing fog-of-war rules for rival HQ units.
- Auto-pulsing/highlighting the freshly-promoted capo (could be a follow-up UX polish — separate ticket).

## Files

- `src/components/EnhancedMafiaHexGrid.tsx` — render-condition tweak (~line 1409).
- `src/components/__tests__/HexGrid.promotion-render.test.tsx` — new test (or addition to an existing render test if there is one).
- *(Confirm only, no expected change)* `src/hooks/useEnhancedMafiaGameState.ts` — promotion resolution at line ~3477.

## Risks

- Showing units on the player's HQ hex slightly increases visual density at the HQ (typically the busiest hex). Mitigation: the icons use the same offset stacking the renderer already does for any non-HQ hex, so it should remain readable. If clutter becomes an issue, follow-up could add a "+N" badge instead of stacking individual icons past 2.
