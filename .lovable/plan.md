

# Safehouse Refinements (Final)

## Changes

### 1. Destroy on Capture + Bounty + Intel
When a safehouse hex is captured, the safehouse is destroyed and the captor gains:
- **$9,000 bounty** (`SAFEHOUSE_CAPTURE_BOUNTY`)
- **1-turn full intel** on the former owner's family — all their hexes become scouted (fresh) for 1 turn, then revert to fog of war. Implemented by bulk-adding `ScoutedHex` entries for all hexes owned by that family with `turnsRemaining: 1`.

### 2. Defense Bonus (+10%)
Units on a safehouse hex get +10% defense in combat (`SAFEHOUSE_DEFENSE_BONUS`).

### 3. Capo Deployment from Safehouse
Capos can deploy from safehouses matching HQ deploy range (5 hexes).

### 4. Cost + Scaling
- `SAFEHOUSE_COST = 2500` deducted on creation
- 2nd safehouse allowed at 15+ hexes (`SAFEHOUSE_TERRITORY_THRESHOLD = 15`)
- Migrate `safehouse` to `safehouses: Safehouse[]` (max 2)

### 5. AI Safehouse Behavior
- AI with 8+ territories and $5,000+ places safehouses on strategic border hexes
- AI prioritizes capturing enemy safehouse hexes for bounty + intel

## New Constants — `src/types/game-mechanics.ts`
```
SAFEHOUSE_COST = 2500
SAFEHOUSE_DEFENSE_BONUS = 10
SAFEHOUSE_CAPTURE_BOUNTY = 9000
SAFEHOUSE_CAPTURE_INTEL_DURATION = 1
SAFEHOUSE_TERRITORY_THRESHOLD = 15
MAX_SAFEHOUSES = 2
```

## Files Modified
- `src/types/game-mechanics.ts` — new constants
- `src/hooks/useEnhancedMafiaGameState.ts` — array state, capture destruction + bounty + intel reveal, defense bonus, capo deploy, cost, scaling, AI safehouse logic
- `src/components/EnhancedMafiaHexGrid.tsx` — render multiple safehouse icons, deploy highlights
- `src/components/GameSidePanels.tsx` — show cost, count, threshold info
- `src/pages/UltimateMafiaGame.tsx` — pass updated safehouse array props

