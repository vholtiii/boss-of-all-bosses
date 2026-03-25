

# Two Mechanics Updates: Wounded Capo Recovery & Built vs Extorted Businesses

## A. Wounded Capo — Multi-Turn Recovery (2 turns)

### Current State
Wounded capos lose -10 loyalty and -1 move for exactly 1 turn, then auto-reset. No persistent wound state.

### Changes

**New field on deployed units:** `woundedTurnsRemaining: number` (0 = healthy, 2 = just wounded). Decrements by 1 each turn.

**While wounded:**
- -1 max moves (2 instead of 3)
- **Cannot auto-claim or auto-extort on movement** — capo moves like a soldier (manual actions only)
- Cannot use Negotiate, Escort, or Safehouse abilities
- -5% combat effectiveness
- Visual 🩸 badge on unit

**Healing:** Automatic after 2 turns. Notification: "💚 Capo Recovered"

### Technical Changes

**`src/types/game-mechanics.ts`** — Add `CAPO_WOUND_DURATION = 2`

**`src/hooks/useEnhancedMafiaGameState.ts`**
- Set `unit.woundedTurnsRemaining = 2` when capo is wounded (replace current 1-turn maxMoves hack)
- In `advanceToNextTurn`: decrement wound counter, restore when 0, push recovery notification
- In capo movement logic: skip auto-claim/auto-extort if `woundedTurnsRemaining > 0`
- Block negotiate/escort/safehouse if wounded
- Remove current 1-turn maxMoves reset

**`src/components/EnhancedMafiaHexGrid.tsx`** — 🩸 badge on wounded capos

**`src/pages/UltimateMafiaGame.tsx`** — Tooltip shows wound status + turns remaining, ability buttons disabled with reason

---

## B. Built vs Extorted Business Benefits

### Changes — Player-built businesses get 3 bonuses:

1. **No unit required for full income** — 100% collection regardless of unit presence (extorted keep 100%/30%/10% capo/soldier/empty rates)
2. **50% less heat** — built businesses generate half the base heat
3. **Passive loyalty & respect** — every 3 built businesses: +1 respect/turn, +1 loyalty to all soldiers/turn

### Technical Changes

**`src/types/game-mechanics.ts`** — Add `BUILT_BUSINESS_HEAT_REDUCTION = 0.5`, `BUILT_BUSINESS_RESPECT_THRESHOLD = 3`, `BUILT_BUSINESS_RESPECT_BONUS = 1`, `BUILT_BUSINESS_LOYALTY_BONUS = 1`

**`src/hooks/useEnhancedMafiaGameState.ts`**
- Income: skip capo/soldier/empty modifier for player-built businesses (100% always)
- Heat: apply 50% reduction for built businesses
- Turn end: count built businesses, add respect/loyalty per threshold

**`src/components/HeadquartersInfoPanel.tsx`** — "🏗️ Player-Built" badge, "100% (player-built)" collection rate

**`src/pages/UltimateMafiaGame.tsx`** — Pass `isPlayerBuilt` flag to HQ panel

---

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/components/HeadquartersInfoPanel.tsx`
- `src/pages/UltimateMafiaGame.tsx`

