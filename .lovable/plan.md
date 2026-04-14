

# Fix Top 4 Gamebreaking Issues

## 1. Cap AI Minimum Income (line 4742)

**Problem**: `(2000 + turn * 500)` grows unbounded — AI earns $27k/turn by turn 50 even with zero territory.

**Fix**: Cap the turn-scaling component at turn 20, so max floor is `(2000 + 20 * 500) = $12,000` before difficulty/map modifiers:
```
const cappedTurn = Math.min(state.turn, 20);
const minIncome = Math.floor((2000 + cappedTurn * 500) * diffMods.aiIncomeMult * mapScale);
```

This caps AI minimum income at ~$12k (normal/medium), ~$7.2k (easy), ~$18k (hard) — still meaningful but not runaway.

## 2. Cap AI Recruit Soft Cap (line 4762)

**Problem**: `3 + floor(turn/2)` is unbounded — AI can field 28+ soldiers by turn 50.

**Fix**: Hard-cap the formula at 18 soldiers (before bonuses):
```
const baseCap = Math.min(Math.max(8, 3 + Math.floor(state.turn / 2)), 18);
const soldierCap = baseCap + alertBonus + diffMods.aiRecruitCapBonus + capScale + atWarBonus;
```

This keeps late-game AI armies manageable (18-24 depending on bonuses) instead of infinite growth.

## 3. Fix Forced Capo Promotion Dead Code (lines 5432-5462)

**Problem**: Missing closing brace — the fallback block at line 5444 is nested *inside* the `if (bestCandidate)` block, so `!bestCandidate` is always false there (dead code).

**Fix**: Add the missing closing brace after line 5441's `turnReport` push, so the fallback sits at the same level as `if (bestCandidate)`:
```
        if (bestCandidate) {
          // ... promote logic ...
          if (turnReport) {
            turnReport.aiActions.push(...);
          }
        }  // <-- this brace was missing
        // Fallback: forced promotion if AI has territory/money but no eligible soldiers
        if (!bestCandidate && ...) {
```

## 4. Add "Abandon Territory" Action

**Problem**: Players can't release empty hexes, trapping them in a $150/turn community upkeep death spiral.

**Implementation**:
- Add a new action type `'abandon_territory'` in the `performAction` switch in `useEnhancedMafiaGameState.ts`
- Logic: Release a player-controlled hex (set `controllingFamily = null`, clear business) if no units are on it and it's not the HQ. Costs 0 actions, available during Action phase. Limit: 2 hexes per turn to prevent exploits.
- Add an "Abandon Territory" button in the Strategic Actions section of `GameSidePanels.tsx` that shows a list of empty (no units, no business) player hexes with individual abandon buttons
- Track `abandonedThisTurn` counter in state to enforce the 2/turn limit

### Files Changed
1. **`src/hooks/useEnhancedMafiaGameState.ts`** — 4 edits:
   - Line 4742: Cap AI min income at turn 20
   - Line 4762: Hard-cap AI recruit at 18 base
   - Lines 5432-5462: Fix brace nesting for forced capo promotion
   - Add `case 'abandon_territory'` handler (~30 lines)
2. **`src/components/GameSidePanels.tsx`** — Add Abandon Territory UI in Strategic Actions section (after Purge Ranks)

