

## Integration Plan: GAME_MECHANICS.md into Commission Conquest

Based on your answers: keep current 5 families and positions, adopt the doc's bonuses, use the doc's business types, and implement all 4 new systems (hitman, 4-tier bribes, 3-step takeover, victory conditions).

---

### What Changes

**1. Family Bonuses Update** (FamilySelectionScreen.tsx, useEnhancedMafiaGameState.ts)
- Replace current family bonuses with the doc's values:
  - Gambino: +25% combat, +10% territory income, +15% intimidation
  - Genovese: +30% business income, +20% laundering, +25% business upgrade
  - Lucchese: +25% hit success, +15% heat reduction, +20% intel
  - Bonanno: +20% extortion, +25% intimidation, +15% fear generation
  - Colombo: +20% income, +15% recruitment discount, +10% reputation gain (using Corleone-style bonuses for Colombo)
- Store active bonuses in game state so they affect calculations

**2. Territory Business Types** (useEnhancedMafiaGameState.ts, EnhancedMafiaHexGrid.tsx)
- Replace business types with: `brothel`, `gambling_den`, `loan_sharking`, `store_front`
- Update business icons and income generation accordingly
- Add heat level 0-10 per territory, laundering capacity per business

**3. 3-Step Takeover Process** (useEnhancedMafiaGameState.ts, new TakeoverPanel component)
- **Step 1 - Deploy**: Already exists (deploy soldiers to territory)
- **Step 2 - Take Action**: Add `hitTerritory` and `extortTerritory` actions
  - Hit: 80% success if outnumbering, 20% if not. Casualties 20%/40%. Reward: territory + $5K + 10 respect
  - Extort (neutral only): 90% success. Casualties 10%/20%. Reward: territory + $3K + 5 respect
- **Step 3 - Optimize**: Deploy capo for 100% income, or keep soldiers for 30%
- Wire this into hex click context menu: when clicking a hex with your soldiers on an enemy/neutral tile, show Hit/Extort options

**4. Hitman System** (new types, new HitmanPanel component, useEnhancedMafiaGameState.ts)
- Add `Hitman` interface extending soldier with: hits count, extortions, intimidations, survived conflicts, isHitman flag, hitmanLevel
- Promotion requirements: strength 80+, reputation 50+, 3+ successful hits
- Max 3 hitmen per family, +30% hit success, +10% per hitman level (cap 95%), 50% more maintenance
- Add soldier tracking: record hits, extortions, intimidations per soldier
- New UI panel to view eligible soldiers and promote to hitman

**5. 4-Tier Bribe/Corruption System** (new CorruptionPanel component, useEnhancedMafiaGameState.ts)
- Replace the current flat `bribe_official` action with 4 tiers:
  - Patrol Officer: $500, 80% success, 3 turns, -30% street heat, -2 heat/turn
  - Police Captain: $2,000, 60% success, 5 turns, 20% economic pressure on rival illegal businesses
  - Police Chief: $8,000, 40% success, 7 turns, +50% intel on target rival (must pick rival)
  - Mayor: $25,000, 25% success, 10 turns, can shut down rival territory (must pick territory)
- Dynamic success rates: modified by reputation and current heat
- Track active bribes with remaining turns, auto-expire on end turn

**6. Victory Conditions** (useEnhancedMafiaGameState.ts, new VictoryPanel component)
- Replace current 60% territory check with:
  - Territory: control 6+ territories (distinct hexes with your units/control)
  - Economic: $8,000+ monthly income
  - Legacy: highest combined reputation scores
- Show progress toward each condition in the HUD
- Trigger victory screen when any condition is met

**7. Recruitment Cost Update** (useEnhancedMafiaGameState.ts)
- Soldier recruitment: $500 base (currently $8,000 -- way off from doc)
- Capo recruitment: $1,500 base
- Apply family discounts (e.g., Colombo gets -15% recruitment cost)

**8. Soldier Properties Enhancement** (types, useEnhancedMafiaGameState.ts)
- Add per-soldier tracking: loyalty (1-100), training (1-10), equipment (1-10), hits, extortions, intimidations, survived conflicts
- These feed into combat calculations and hitman promotion eligibility

---

### Technical Details

**New types** added to `src/types/`:
- `Hitman` interface, `BribeContract` interface (tier, target, turnsRemaining, effects), `VictoryProgress` interface

**New components**:
- `HitmanPanel.tsx` -- promotion UI, active hitmen display
- `CorruptionPanel.tsx` -- 4-tier bribe interface with target selection
- `VictoryTracker.tsx` -- HUD widget showing progress toward 3 victory conditions
- `TerritoryActionMenu.tsx` -- contextual Hit/Extort/Optimize menu on hex click

**Modified files**:
- `useEnhancedMafiaGameState.ts` -- bulk of logic changes (recruitment costs, combat formulas, bribe processing, victory checks, soldier stats tracking)
- `FamilySelectionScreen.tsx` -- updated bonuses and descriptions
- `EnhancedMafiaHexGrid.tsx` -- new business icons, territory action menu integration
- `UltimateMafiaGame.tsx` -- wire new panels into sidebar tabs
- `GameSidePanels.tsx` -- add Hitman and Corruption tabs

**Files: ~8 modified, ~4 new**

