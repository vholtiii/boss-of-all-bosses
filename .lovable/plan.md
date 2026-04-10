

# Review & Fix AI Family Personality Trait Behavior

## Problems Found

After reviewing `processAITurn` (~lines 3637-4650), here are the issues where AI families do NOT properly follow their traits or phase gates:

### Phase-Gating Bugs
1. **Flip Soldier** (line 4472): Uses `state.turn > 8` instead of `aiPhase >= 3` — AI can flip soldiers before reaching Phase 3
2. **HQ Assault** (line 4524): Uses `state.turn > 12` instead of `aiPhase >= 4` — AI can assault HQs before Phase 4
3. **Enemy Extortion** (line 4242): No phase gate — should require `aiPhase >= 2` (Phase 1 only allows neutral extortion)
4. **AI Blind Hits in Phase 1**: AI can attack enemy hexes in Phase 1 movement/combat, but Phase 1 should only allow neutral claims and blind hits (no enemy extortion, no scouting)

### Personality Trait Gaps

**Diplomatic (Gambino)** — Currently: 40% chance to sit on own territory, otherwise expands neutrally. Only signals ceasefire at Phase 3.
- Missing: Should actively avoid initiating combat unless attacked. Should never Plan Hit or HQ Assault. Should attempt negotiations (ceasefire/alliance signals) more often and earlier (Phase 2 for ceasefire signals). Should recruit less aggressively. Should fortify strategically.

**Aggressive (Genovese)** — Currently: Targets enemy hexes, 80% combat willingness. Can Plan Hit and HQ Assault.
- Missing: Should recruit more soldiers (higher cap bonus). Should fortify less. Should have higher Plan Hit chance. Should attempt HQ Assaults more readily.

**Defensive (Bonanno)** — Currently: Only takes neutral hexes unless outnumbering by +2.
- Missing: Should fortify regularly (not just when alerted). Should never initiate Plan Hits. Should never attempt HQ Assaults. Should build safehouses earlier. Should recruit steadily but not aggressively.

**Opportunistic (Lucchese)** — Currently: Targets weakest enemy hex, 60% combat willingness when outnumbering.
- Missing: Should prefer extortion over direct combat. Should pick fights only when clearly advantageous (strength >= enemies + 1). Should have moderate Plan Hit chance but only against isolated targets. Should negotiate when it's beneficial (high cooperation tendency).

**Unpredictable (Colombo)** — Currently: Random target pool. But aggression is 95 and riskTolerance 90, making it effectively always aggressive.
- Missing: Should occasionally shift between all behaviors randomly each turn. Should sometimes fortify, sometimes attack, sometimes attempt diplomacy. True randomness, not just aggressive with random targeting.

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts`

**1. Fix Phase Gates** (~lines 4242, 4472, 4524):
- Enemy extortion: wrap in `if (aiPhase >= 2)`
- Flip Soldier: change `state.turn > 8` to `aiPhase >= 3`
- HQ Assault: change `state.turn > 12` to `aiPhase >= 4`

**2. Personality-Driven Recruitment** (~line 3727):
- Aggressive: +1 recruit bonus per batch
- Defensive/Diplomatic: -1 recruit bonus (min 1)
- Opportunistic: no change
- Unpredictable: random +-1

**3. Personality-Driven Fortification** (~line 3928):
- Currently only fortifies when alerted. Add non-alert fortification:
  - Defensive: 40% chance to fortify HQ-adjacent hexes each turn (not just alerted)
  - Diplomatic: 25% chance to fortify border hexes
  - Aggressive: 10% chance (rarely fortifies)
  - Opportunistic: 20% chance on high-value business hexes
  - Unpredictable: 30% random

**4. Personality-Driven Plan Hit** (~line 4412):
- Defensive: never initiates Plan Hits
- Diplomatic: never initiates Plan Hits
- Aggressive: 2x the base `AI_PLAN_HIT_CHANCE`
- Opportunistic: 1x base chance, but only if target is isolated (no adjacent friendly units)
- Unpredictable: 1.5x base chance

**5. Personality-Driven HQ Assault** (~line 4524):
- Defensive: never attempts
- Diplomatic: never attempts
- Aggressive: 15% chance (up from 10%)
- Opportunistic: 8% chance, only if 2+ flipped soldiers present
- Unpredictable: 12% chance

**6. Personality-Driven Diplomacy** (~line 4345):
- Currently only diplomatic families signal ceasefire at Phase 3
- Add: Defensive families also signal ceasefire interest at Phase 3 (cooperation/150 chance)
- Add: Diplomatic families signal alliance interest at Phase 3 if relationship > 30
- Opportunistic: signal ceasefire if losing territory (hex count declining)

**7. Unpredictable Behavior Rework** (~line 3905):
- Each turn, randomly assign a temporary behavior mode: 'aggressive' (30%), 'defensive' (20%), 'diplomatic' (20%), 'opportunistic' (30%)
- This makes Colombo truly unpredictable rather than just randomly-targeted aggressive

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`

