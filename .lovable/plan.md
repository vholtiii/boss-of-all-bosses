

# Game Loss: Boss Assassination by Rival Families

## Concept
When the player has **zero soldiers deployed**, is **in debt** (money < 0), and **revenue does not exceed costs**, all 4 rival families coordinate a hit on the Boss. This is an automatic, guaranteed kill — no dice roll. The player receives a dramatic notification before the Game Over screen.

## Trigger Conditions (checked at end of turn, after desertion/bankruptcy logic)
All three must be true simultaneously:
1. `deployedUnits` has **zero** player soldiers (capos don't count — no muscle left)
2. `resources.money < 0` (in debt)
3. Turn revenue ≤ turn costs (net income negative — no recovery path)

This fires **before** the $50K bankruptcy check, giving it narrative priority.

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts`
- After soldier desertion logic (~line 1943) and before the $50K bankruptcy check (~line 1945):
  - Count remaining player soldiers
  - If 0 soldiers AND money < 0 AND net income ≤ 0:
    - Add turn report event: `"☠️ With no soldiers left and the family drowning in debt, the Five Families called a sitdown. The vote was unanimous."`
    - Add pending notification: type `error`, title `"☠️ The Bosses Took You Out"`, message about all 4 families ordering the hit
    - Wipe territory, remove all units
    - Set `gameOver = { type: 'assassination', turn }`

### `src/pages/UltimateMafiaGame.tsx`
- Extend the game over screen check (~line 286) to include `type === 'assassination'`
- Show 🔫 emoji, title "THE COMMISSION HAS SPOKEN", description: "With no soldiers, no money, and no way out — the other families voted. The Boss sleeps with the fishes."
- Same post-game stats grid as RICO/bankruptcy

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — assassination trigger logic
- `src/pages/UltimateMafiaGame.tsx` — assassination game over screen

