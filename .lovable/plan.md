

# Flip Soldier Proximity Rework — Capo-Only, 3-Hex Range

## Summary
Change the Flip Soldier mechanic so that **only capos** can initiate it, from **within 3 hexes** of the enemy HQ. The target pool becomes any enemy soldier **within 1-2 hexes of the acting capo** (not tied to HQ proximity). This makes capos the intelligence operatives and adds tactical positioning depth.

## Changes

### 1. UI Gate — `EnhancedMafiaHexGrid.tsx`
**Line ~488**: Change `canFlipSoldier` condition:
- Old: `isEnemyHQ && isAdjacentToHQ && currentGamePhase >= 3`
- New: Player has a **capo** within 3 hexes of the enemy HQ tile being clicked, and phase >= 3
- Update the context menu button label to reflect capo requirement (e.g., "🐀 Flip Soldier (Capo)")

### 2. Backend Logic — `useEnhancedMafiaGameState.ts`
**`processFlipSoldier` (~line 7418)**:
- Replace `hasAdjacentUnit` check: require a player **capo** within 3 hexes of target HQ (`hexDistance <= 3`)
- Identify which capo is acting (closest eligible capo to the HQ)
- Change target pool: instead of enemy soldiers within 1 hex of HQ, find enemy soldiers within **2 hexes of the acting capo**
- Keep all other logic (cost, chance modifiers, schemer bonus, etc.)

### 3. AI Flip Logic — `useEnhancedMafiaGameState.ts`
**AI flip section (~line 5413)**: Update AI flip attempts to also require a capo within 3 hexes of the target HQ and target soldiers near the capo, matching the new rules.

### 4. Disabled Reason Text
Update the disabled action reason when the option is unavailable:
- No capo within 3 hexes: "Need a Capo within 3 hexes of enemy HQ"
- Phase locked: stays as "🔒 Unlocks in Phase 3"

## No Other Files Changed
Types and constants remain the same. The target picker UI (from the rework plan) will use the new capo-based target pool when implemented.

