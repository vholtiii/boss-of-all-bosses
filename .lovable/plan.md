

# Fix 11 Game Bugs (Excluding Capo Auto-Claim)

## Bugs to Fix

### CRITICAL

**1. Dirty Money Accumulates Forever / Clean Money Goes Negative**
- `processEconomy()` line 2611: `dirtyMoney` only ever increases
- Fix: Track dirty money as a **ratio** of total illegal income earned vs laundered, not an ever-growing accumulator. Each turn, set `dirtyMoney = illegalIncome` (current turn's dirty income only). `cleanMoney = money - dirtyMoney` stays correct.
- Remove line 4381 in launder action: `resources.money += amountToLaunder` — this double-counts income since `processEconomy` already added illegal income to money.

**2. Legacy `performBusinessAction` System Conflicts with Hex Businesses**
- The entire `performBusinessAction` function (lines 4261-4538) operates on `state.businesses[]` which is disconnected from hex-based businesses.
- Fix: Gut the business-building/upgrade/extort/collect/launder cases from `performBusinessAction`. Keep only lawyer and legacy bribe actions (hire_lawyer, fire_lawyer). The hex-based `build_business` in `performAction` is the real system.
- Remove lines 4514-4534: the finance recalculation that overwrites `processEconomy` results.

**3. Legacy Bribe System Conflicts with `activeBribes`**
- `performBusinessAction.bribe_official` (lines 4446-4481) uses `policeHeat.bribedOfficials` while the corruption panel uses `activeBribes`.
- Fix: Remove `bribe_official` and `stop_bribe` cases from `performBusinessAction`. Remove the `policeHeat.bribedOfficials` permission checks for illegal businesses (lines 4281-4297) — these should check `activeBribes` instead, or be removed since hex-based build already handles this.

### HIGH

**5. HQ Stacking Limit Not Enforced on Recruitment/Sitdown**
- Mercenary hire (line 3791) and local recruit (line 3836) deploy directly to HQ with no stacking check. Sitdown (line 4229) teleports unlimited units to HQ.
- Fix: HQ is special — allow higher stacking (e.g., unlimited at HQ since it's the base). Document this as intentional, OR add a generous cap (e.g., 6 units at HQ). Given game design docs say "Each soldier at HQ: +5% HQ assault defense", unlimited HQ stacking seems intentional. **No code change — just document it.**

**6. AI Soldier Recruitment Cap Formula Backwards**
- Line 2682: `Math.min(8 + ..., 3 + turn/2 + ...)` — the `Math.min` means cap never exceeds 8.
- Fix: Change to `Math.max` so early game is capped low (3 + turn/2) and late game can go higher (8+).

**7. Defeat Casualties Message Wrong When No Killable Units**
- Line 5320: `Math.max(1, ...)` reports 1 casualty even when 0 killable soldiers exist.
- Fix: `const defeatCasualties = Math.min(Math.max(1, Math.floor(defeatKillable.length * 0.4)), defeatKillable.length);`

**8. Extortion Grants Stats to ALL Units on Hex**
- Lines 5442-5458: `allPlayerUnits.forEach(...)` gives rewards to every unit.
- Fix: Only grant stat rewards to the **first soldier** (or first capo if no soldiers). Pick one acting unit.

### MEDIUM

**9. Finance Overwrite After Business Actions** — Fixed by removing legacy recalc in fix #2.

**10. Alliance Conditions Never Enforced**
- Lines 5624-5633: Placeholder comments, no actual checks.
- Fix: Track territory changes during action phase. In `processPacts`, check if player took territory from ally (`no_attack_family`) or expanded into restricted district (`no_expand_district`). If violated, break alliance + reputation penalty.

**11. Sabotage Sets `tile.business = null` Instead of `undefined`**
- Line 4705: `tile.business = null as any`
- Fix: `tile.business = undefined`

**12. Community Hex Move Cost — AI Only** — This is arguably intentional (AI penalty for crossing player territory). Skip fix, document as feature.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — all fixes

