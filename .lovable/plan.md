

# Capo Movement Nerf — Range & Moves

Tighten capo mobility to slow down early-game land grabs. Phase 1 capos become short-range scouts; Phase 2+ they unlock the full (reduced) fly range.

## Changes

### 1. Capo Fly Range
- **Phase 1**: 2 hexes per move (was 5)
- **Phase 2+**: 4 hexes per move (was 5)

### 2. Capo Moves Per Turn
- **All phases**: 2 moves/turn (was 3)

This applies to both player and AI capos for symmetry.

## Files Touched

1. **`src/types/game-mechanics.ts`** (or wherever capo constants live)
   - Add/replace constants: `CAPO_FLY_RANGE_P1 = 2`, `CAPO_FLY_RANGE_P2_PLUS = 4`, `CAPO_MOVES_PER_TURN = 2`.

2. **`src/hooks/useEnhancedMafiaGameState.ts`**
   - Capo move-budget initialization at turn start: set to 2 instead of 3.
   - Movement validation / pathing: when computing reachable hexes for a capo, use `currentPhase === 1 ? 2 : 4` as the per-move range.
   - AI capo movement loop: same phase-gated range and 2-move cap.

3. **`src/components/EnhancedMafiaHexGrid.tsx`**
   - Highlight computation for selected capo respects the new phase-gated range (2 in P1, 4 in P2+).
   - Tooltip / hover label on capo shows correct remaining moves out of 2.

4. **UI copy**
   - Any place that says "Capo: 3 moves" or "fly up to 5" — update to "2 moves" and "fly up to 2 (Phase 1) / 4 (Phase 2+)". Likely in `CapoPromotionPanel.tsx`, `GameGuide.tsx`, hex info panel, and tooltips.

5. **Memory updates**
   - `mem://gameplay/capo-abilities` — new range/moves with phase split.
   - `mem://gameplay/unit-movement-rules` — capo line updated.

## What Doesn't Change

- Capo combat immunity, wound mechanic, ZoC bypass, auto-claim behavior (still 1 contested claim per fly), scout range (2 hexes), safehouse establishment, deployment range from HQ, soldier movement.

