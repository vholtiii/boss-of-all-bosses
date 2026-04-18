

# Fix Capo Removal on Hit + Active Colombo Promotion Power

## Issue 1 — Capo Stays on Map After Successful Hit

### Root cause
In `processTerritoryHit` (`useEnhancedMafiaGameState.ts` ~line 8311), the kill set is filtered by `u.family === tile.controllingFamily`. When a Plan Hit / Hitman targets a capo on a neutral, player, or HQ hex, the capo isn't in the kill set and stays on the board. An early-return at ~line 8254 also aborts hits on player/HQ hexes.

### Fix
**A.** When `_executingPlan` is true and `state.plannedHit?.targetUnitId` exists, look up that unit by id and add it to `enemyUnits` regardless of `controllingFamily`.
**B.** Skip the `controllingFamily === playerFamily || isHeadquarters` short-circuit when `_executingPlan` is set.
**C.** On capo death in this path: delete `state.soldierStats[capoId]`, call `triggerColomboSuccession(...)` if applicable, call `syncLegacyUnits(state)` so legacy `state.units[fam].capos` updates.
**D.** Enforce wound-vs-kill: regular scouted `processTerritoryHit` against capos → wound (-10 loyalty, -1 move, 1 turn). Only Plan Hit + Hitman kill capos. Mirror the existing AI wound branch (~line 5266-5290).

---

## Issue 2 — Colombo Power = Active Promotion Button

Convert Persico Succession from a passive trigger into an **active, one-time-per-game promotion ability**: click button → select a soldier → soldier instantly becomes a capo (icon replaces soldier on map).

### Flow
1. Player opens Family Power panel (`GameSidePanels.tsx`) → sees **"👑 Persico Succession"** button (enabled if `!familyPowerUsedForever.colombo` and capo slot available).
2. Click → enters **"selectingPersicoTarget"** mode. UI shows: "Click any of your soldiers on the map to anoint them as Capo." Highlights all player soldiers with a gold pulse ring.
3. Click a soldier hex → confirmation: instantly converts that soldier into a capo:
   - Remove soldier from `state.deployedUnits` (and `state.units[colombo].soldiers`)
   - Add new capo unit at same hex with name like "Capo (Persico)", level 1, full health
   - Insert into `state.units.colombo.capos`
   - Delete `state.soldierStats[soldierId]`
   - Call `syncLegacyUnits(state)`
   - Set `familyPowerUsedForever.colombo = true`
   - Push notification: "👑 Persico Succession — {soldierName} promoted to Capo"
4. Map re-renders: SoldierIcon at that hex is replaced by CapoIcon (already automatic via deployedUnits).

### Cancel/escape
- Re-clicking the button or clicking outside the map exits selection mode (mirror existing unit-selection clear behavior).
- Disabled if no eligible soldiers, capo cap reached (4), or already used.

### Auto-succession on capo death
Keep the existing `triggerColomboSuccession` reactive trigger as a **secondary fallback** ONLY if `familyPowerUsedForever.colombo` is still false at the moment a Colombo capo dies — but since the new flow encourages active use, document it as "use it or lose it on next capo death."

Actually simpler: **remove auto-trigger entirely**. Power is purely active now. One use per game, player chooses timing.

---

## Files Touched

1. **`src/hooks/useEnhancedMafiaGameState.ts`**
   - Fix `processTerritoryHit`: include plan-hit target regardless of family, relax early-return for `_executingPlan`, capo wound-vs-kill split, cleanup + Colombo trigger + syncLegacyUnits on capo death
   - Add `executePersicoPromotion(soldierId)` action: removes soldier, spawns capo at same coords, marks power used
   - Add `persicoSelectionActive: boolean` flag to state
   - Remove auto `triggerColomboSuccession` on capo death (or gate it behind power-not-yet-used)

2. **`src/components/GameSidePanels.tsx`**
   - Colombo Family Power: active button "👑 Anoint a Capo" → toggles `persicoSelectionActive`, label changes to "Cancel Selection" while active
   - Disabled states with tooltips: already used / capo cap reached / no soldiers

3. **`src/pages/UltimateMafiaGame.tsx`** (or wherever soldier-click is wired)
   - When `persicoSelectionActive` is true, intercept soldier-hex clicks → call `executePersicoPromotion(unitId)` instead of normal selection
   - Pass `persicoSelectionActive` into `EnhancedMafiaHexGrid` so player soldiers get a gold pulse ring

4. **`src/components/EnhancedMafiaHexGrid.tsx`**
   - Render gold pulse ring on player SoldierIcon when `persicoSelectionActive` prop is true

5. **`src/components/GameGuide.tsx`**
   - Update Colombo entry: "Active ability — click to enter selection mode, choose any soldier to instantly promote to Capo. One use per game."

