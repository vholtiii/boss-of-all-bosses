

# Balance & Bug Fix Plan — Simulation Findings

## Critical Issues Found (6-turn simulation)

### Issue 1: Player Bankruptcy by Turn 5
Player loses $18,516/turn (costs $18,750, revenue $234). Six starting soldiers have enormous maintenance while generating almost no income. The game is unplayable without immediately extorting on turn 1.

**Fix**: Reduce base soldier maintenance cost. Currently soldiers cost ~$3,125 each per turn — this needs to be closer to $500-800/turn so a passive player can survive 10+ turns. Check the maintenance calculation in `useEnhancedMafiaGameState.ts`.

### Issue 2: AI Soldier Count Shows 0 in Sidebar
Right panel shows "Soldiers: 0" for all AI families despite them clearly having units (they fight, claim territory, earn income). This is a display bug in the rival family info section.

**Fix**: In `GameSidePanels.tsx` or `UltimateMafiaGame.tsx`, the soldier count being passed to the rival family display is likely reading from the wrong field or not counting deployed units.

### Issue 3: No Bankruptcy Consequences
Player money goes to -$32K with no penalty beyond loyalty drain. There should be consequences — soldier desertion, inability to act, or a game-over warning.

**Fix**: Add a bankruptcy check at end-of-turn: if money < 0, random soldiers desert (1 per $10K in debt), and player gets a warning notification. If money < -$50K, game over.

### Issue 4: AI Territory Expansion Too Slow
AI reaches only 5-7% territory by turn 6. At this rate, the 60-hex (18%) territory victory would take 30+ turns. AI needs to claim more aggressively in early turns.

**Fix**: Increase AI action budget or make AI prioritize claiming adjacent neutral hexes more aggressively in early game (turns 1-8). Currently AI may be spending actions suboptimally.

### Issue 5: Starting Income Too Low
$234/turn from HQ alone is negligible. Player needs immediate territory/business income to survive.

**Fix**: Either give player 2-3 starting territories with businesses, or significantly reduce maintenance so the player has time to expand.

## Proposed Priority Order
1. Fix maintenance costs (game-breaking)
2. Fix AI soldier display bug (misleading)
3. Add bankruptcy mechanic (game integrity)
4. Boost AI expansion rate (game pacing)

## Files to Modify
- `src/hooks/useEnhancedMafiaGameState.ts` — maintenance calculation, bankruptcy logic, AI expansion rate
- `src/components/GameSidePanels.tsx` — AI soldier count display
- `src/pages/UltimateMafiaGame.tsx` — rival family data wiring

