

# Review & Fix Respect and Influence Systems

## Current Problems

1. **Influence never increases** — `resources.influence` starts at 10, is never incremented anywhere in the enhanced game state. It can only decrease (jail penalties). The bonus action threshold of 50 is unreachable.

2. **Respect gains are sparse** — only gained from combat victories (+10 territory capture, +3/+5 fights). No passive growth from territory holdings or business operations.

3. **Victory "Legacy" calculation is inconsistent** — player legacy uses `reputation.respect + reputation.reputation + reputation.fear + reputation.streetInfluence`, but rival legacy uses `opp.resources.influence * 3` (a completely different metric).

4. **No turn-over-turn feedback loop** — players don't see respect/influence growing from their strategic decisions (territory control, business empire), making the bonus action reward feel disconnected.

## Proposed Changes

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**1. Add per-turn influence growth based on territory control**
In the end-of-turn processing (around line 1292-1310), calculate influence gain:
- +1 influence per 3 controlled hexes (territory = influence)
- +1 influence per active alliance
- Cap at 100, with a small decay of -0.5 per turn to keep it dynamic

**2. Add per-turn respect growth based on economic power**
In the same end-of-turn block:
- +1 respect per 5 controlled hexes with businesses
- +1 respect per $5,000 of turn income (capped at +5)
- Keep existing combat bonuses as they are
- Small decay of -0.5 per turn

**3. Fix the Legacy victory calculation**
In `updateVictoryProgress` (line ~560), make rival legacy use a comparable formula instead of just `influence * 3`. Use `(soldiers * 2) + (influence * 2) + (money / 1000)` or similar composite score so it's a meaningful comparison.

**4. Sync influence resource with reputation.streetInfluence**
After computing the new influence value, sync `resources.influence` to `reputation.streetInfluence` so both always reflect the same thing — eliminating the confusing dual-tracking.

### Summary of Gameplay Impact
- **Influence becomes earnable** through territory control, making expansion strategically important beyond just income
- **Respect grows with economic success**, rewarding business-focused play
- **Bonus action (+1 at 50/50)** becomes a realistic mid-game milestone that rewards balanced play
- **Legacy victory** becomes a fair race against AI opponents using consistent metrics

### Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — turn processing, victory calculation, resource sync

