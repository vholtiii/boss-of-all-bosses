

# Fix: AI Phase Progression and Victory Capability

## Issues Found

### Critical Bugs

1. **AI income is hardcoded to 0 for phase calculation** (line 1107): `const income = isPlayer ? state.lastTurnIncome : 0;` -- AI can NEVER reach Phase 4 via the income path ($40k). Only hexes (35) or respect (80) work.

2. **AI never calls Commission Vote** -- There is zero code for AI to attempt a commission vote. The `processCommissionVote` function only handles the player's vote. AI has no path to a diplomatic victory.

3. **AI respect growth is too slow for Phase 4** -- Respect gains ~1-2/turn via `respectGain = floor(aiTerritoryCount / 4) + (aggression > 60 ? 1 : 0)` with a -0.5 decay. To reach 80 respect, AI needs 30+ hexes sustained over many turns. Combined with the Phase 4 minTurn of 30, this is achievable but tight.

4. **AI has no "built business" tracking** -- Phase 3 requires `minBuiltBusinesses: 1`, but AI never builds businesses. They only extort existing ones. `builtBusinessCount` checks `!t.business.isExtorted` which might pass for pre-placed businesses, but if all businesses on AI hexes are extorted, AI gets stuck at Phase 2.

5. **`updateGamePhase` only tracks the player** -- Called once at end-of-turn for the player only. AI phase is calculated per-turn in `processAITurn` via `calculatePhaseForFamily` (line 3630) and used locally, but never persisted. This works for gating AI actions but means there's no tracking of AI phase transitions for notifications or commission vote eligibility.

### Moderate Issues

6. **Phase 4 OR condition has no AI income tracking** -- AI income is computed during `processAITurn` but not stored anywhere accessible to `calculatePhaseForFamily`. Need to store `lastTurnIncome` per AI family.

7. **AI capo promotion requires `isCapoPromotionEligible`** -- If AI soldiers don't accumulate enough stats (victories, racketeering, loyalty), they can never promote, blocking Phase 3's `minCapos: 2` requirement.

---

## Plan

### 1. Fix AI income tracking for phase calculation
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- Store `lastTurnIncome` on each `AIOpponent` resource object during `processAITurn` income calculation
- Update `calculatePhaseForFamily` to read AI income from `opponent.resources` instead of hardcoding 0

### 2. Fix AI built business count
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- In `calculatePhaseForFamily`, for AI families count any hex with a completed business (construction done) as a "built business" -- AI doesn't build but controls pre-placed completed businesses, which should count

### 3. Add AI Commission Vote logic
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- In `processAITurn`, after all other actions, check if `aiPhase >= 4`
- If so, and AI has $15k+, and enough surviving rivals (2+), and no cooldown, attempt a commission vote
- AI votes are resolved against OTHER AI families + player: vote YES if relationship >= 60 + active pact
- For player's vote toward AI caller: use player's relationship with that family (from `familyRelationships`)
- On AI win: trigger game over with commission victory for AI family
- On AI fail: cooldown, relationship penalties
- Track per-AI cooldown on the opponent object

### 4. Track AI phase transitions
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- Add `aiPhaseCache: Record<string, GamePhase>` to state (persisted, no regression)
- Update in `processAITurn` -- if new phase > cached, push notification ("The {family} family has entered Phase X")
- This gives players strategic warning when AI approaches Phase 4

### 5. Ensure AI can reach Phase 3 milestones
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- Relax `builtBusinessCount` check for AI: count any completed business on AI territory (whether extorted or not) since AI doesn't have a build mechanic
- Verify AI capo promotion stats accumulate naturally -- the existing combat stat tracking should work, but add a fallback: if AI has 15+ hexes and $10k+ but no eligible soldiers, allow a "forced promotion" with reduced stats

### 6. Add AI commission vote cooldown tracking
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- Add `commissionCooldownUntil?: number` to AIOpponent or track in a separate map
- Store in `cloneStateForMutation`

---

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` -- AI income tracking, commission vote logic, phase tracking, business count fix
- `src/types/game-mechanics.ts` -- Add `lastTurnIncome` to AI resources interface if needed

## Expected Outcome
- AI progresses through all 4 phases naturally
- AI can call Commission Votes in Phase 4, creating genuine threat
- Player gets notified when AI enters new phases
- AI phase calculation uses real income data instead of 0

