

# Phase Gating Review & Real-World Logic Fixes

## Current State

Here's what's gated today and what ISN'T:

| Mechanic | Currently Gated? | Phase |
|---|---|---|
| Move, Claim, Extort, Recruit soldiers | No gate (Phase 1) | ✅ Correct |
| Blind Hits (unscouted attacks) | No gate (Phase 1) | ✅ Correct |
| Scouting, Plan Hits, Fortify, Safehouses | Phase 2 | ✅ Correct |
| Capo Promotion | Phase 2 | ✅ Correct |
| Boss Diplomacy, Alliances, Ceasefires | Phase 3 | ✅ Correct |
| Captain+ Bribes | Phase 3 | ✅ Correct |
| Declare War | Phase 3 | ✅ Correct |
| Commission Vote | Phase 4 | ✅ Correct |
| **Hitman Contracts ($30K)** | **NO GATE** | ❌ Problem |
| **HQ Assault** | **NO GATE** | ❌ Problem |
| **Flip Soldier** | **NO GATE** | ❌ Problem |
| **Go to the Mattresses** | **NO GATE** | ❌ Problem |
| **War Summit** | **NO GATE** | ❌ Problem |
| **Patrol Officer bribe** | **NO GATE** | ❌ Problem |
| **Boss Sitdown** | **NO GATE** | ❌ Problem |

## Real-World Logic Problems

1. **Phase 1 is too permissive** -- a brand-new family shouldn't hire hitmen ($30K assassins), assault rival HQs, or flip enemy soldiers. You haven't earned street cred yet. In real mafia logic, you're just a street-level associate doing shakedowns and small jobs.

2. **Hitmen available from turn 1** -- absurd. You need to be an established operation before contract killers take you seriously.

3. **HQ Assault/Flip ungated** -- these are endgame power moves. A nobody family shouldn't attempt to destroy a rival's headquarters.

4. **Boss actions ungated** -- Go to Mattresses, War Summit, and Sitdown are boss-level strategic decisions that should require some territorial power base.

## Proposed Phase Redistribution

### Phase 1: Making Your Bones (Turns 1-8)
*You're a nobody. Do street work, prove yourself.*
- Move, Claim neutral territory, Extort (neutral only), Recruit soldiers (mercenaries only)
- Blind Hits (risky, unscouted attacks)
- **NEW restriction**: Extortion against enemy hexes locked (you're not strong enough to steal from other families yet)
- **NEW restriction**: Local recruitment locked (need 10+ hexes anyway, but make it explicit as Phase 2)

### Phase 2: Establishing Territory (Turn 9+, 8 hexes, 20 respect)
*You've proven yourself. Time to get organized.*
- Scouting, Plan Hits, Capo Promotion, Safehouses, Fortification (existing)
- **NEW**: Patrol Officer bribes (you now have enough presence for low-level corruption)
- **NEW**: Enemy hex extortion unlocked
- **NEW**: Local recruitment unlocked
- **NEW**: Boss Sitdown (recall soldiers)

### Phase 3: Controlling Territory (Turn 18+, 20 hexes, 2 capos, 1 business)
*You're a real power player. War and diplomacy become tools.*
- Boss Diplomacy, Alliances, Ceasefires, Captain+ Bribes, Declare War (existing)
- **NEW**: Hitman Contracts (you're established enough for contract killers)
- **NEW**: Go to Mattresses, War Summit (major boss strategic actions)
- **NEW**: Flip Soldier (espionage requires organization)

### Phase 4: Boss of All Bosses (Turn 30+)
- Commission Vote (existing)
- **NEW**: HQ Assault (the ultimate power move -- only available to a dominant family)

## Summary of Changes

| Mechanic | Old Gate | New Gate | Rationale |
|---|---|---|---|
| Enemy extortion | None | Phase 2 | Need muscle to steal from rivals |
| Patrol Officer bribe | None | Phase 2 | Basic corruption requires street presence |
| Boss Sitdown | None | Phase 2 | Boss recalls require organization |
| Hitman Contracts | None | Phase 3 | Contract killers need a real operation |
| Go to Mattresses | None | Phase 3 | Strategic defensive posture requires territory |
| War Summit | None | Phase 3 | Offensive rallying requires war-level power |
| Flip Soldier | None | Phase 3 | Espionage requires organization and reach |
| HQ Assault | None | Phase 4 | Destroying a family is the ultimate endgame move |

## Files Modified

- **`src/types/game-mechanics.ts`** -- Update `PHASE_CONFIGS` unlocks arrays
- **`src/hooks/useEnhancedMafiaGameState.ts`** -- Add phase gates for hitman, HQ assault, flip soldier, boss actions, enemy extortion, patrol bribe
- **`src/components/GameSidePanels.tsx`** -- Add lock icons/tooltips for newly gated actions
- **`src/components/EnhancedMafiaHexGrid.tsx`** -- Add phase gate checks for HQ assault/flip in action menu
- **`src/components/HitmanPanel.tsx`** -- Add phase gate check
- **`src/components/CorruptionPanel.tsx`** -- Gate patrol officer to Phase 2
- **`GAME_MECHANICS.md`** -- Update phase tables with new gating

