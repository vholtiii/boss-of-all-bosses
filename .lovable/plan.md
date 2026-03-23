

# Fortify Refinements: Per-Unit Casualty Protection + Shield Icon

## What's Changing

### 1. Per-Unit Casualty Protection (Replace blanket reduction)

Currently, if ANY unit is fortified, the entire casualty count is reduced by 50%. This is a flat group bonus that protects even unfortified units.

**New behavior**: When selecting casualties from the shuffled pool, each fortified unit picked gets a 50% re-roll to survive. If they survive, the next unfortified unit in the pool takes the hit instead. If all remaining units are fortified, the re-roll still applies but there's no substitute.

**In `src/hooks/useEnhancedMafiaGameState.ts`** — Victory casualty block (lines ~4119-4128):
- Remove the blanket `attackersFortified` count reduction
- Keep `casualties = Math.floor(playerUnits.length * 0.2)`
- Change the removal loop: iterate through shuffled units, for each casualty slot, if the picked unit is fortified, roll 50% — on success skip them and try the next non-fortified unit
- Same approach for AI-initiated combat casualty sections

**Defeat block (lines ~4138-4153)**: Remove the fortified casualty reduction entirely (fortification doesn't help attackers who lost — they got overrun).

### 2. Shield Icon Enhancement

The shield icon already exists (line 720-731) showing a green circle with 🛡️. This is functional. Minor refinement:
- Add a count badge showing how many units are fortified (e.g., "🛡️2") when multiple units are fortified on the same hex
- Keep it hidden for enemy units (already correct — filters by `playerFamily`)

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — per-unit casualty re-roll logic, remove defeat fortify reduction
- `src/components/EnhancedMafiaHexGrid.tsx` — fortified count badge on shield icon

