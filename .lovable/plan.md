

# Intel Alerts: Planned Hits & Assassination Warnings via Scout/Bribe

## Current State
- AI planned hits (`aiPlannedHits[]`) exist but the warning in `GameSidePanels` (line 297) shows **unconditionally** — no intel requirement
- Turn report intel is gated behind scouted hexes / active bribes, but lacks detail about source
- HQ panel has no threat intel section at all
- No notifications fire when intel is first discovered

## Changes

### 1. Add Intel Source Tracking to `AIPlannedHit`

**`src/types/game-mechanics.ts`**
- Extend `AIPlannedHit` interface with optional `detectedVia?: 'scout' | 'bribe_captain' | 'bribe_chief' | 'bribe_mayor'` and `detectedOnTurn?: number`

### 2. Tag Intel Source When Detecting Planned Hits

**`src/hooks/useEnhancedMafiaGameState.ts`**
- When AI plans a hit (~line 3254), check intel conditions (scouted hex or active bribe) right there
- If detected, set `detectedVia` on the hit object with the appropriate source
- Also check on each subsequent turn (in the planned hit processing loop) — if a previously undetected hit becomes visible due to new scouting/bribe, tag it then
- Fire a `pendingNotification` when a hit is first detected: flavor text varies by source:
  - Scout: "🔫 Street Intel: Your soldier in [district] overheard the [Family] planning a hit on your capo"
  - Captain bribe: "🔫 Police Tip: Captain says the [Family] have contracted a hit on one of your capos"  
  - Chief/Mayor: "🔫 High-Level Intel: Sources confirm the [Family] are moving on your capo"

### 3. Gate the Side Panel Warning Behind Intel

**`src/components/GameSidePanels.tsx`** (~line 297)
- Filter `aiPlannedHits` to only show hits where `detectedVia` is set
- Show the intel source per hit: "Source: Street scout" / "Source: Police captain" / etc.
- Show which family is planning the hit and turns remaining

### 4. Add Threat Intel Section to HQ Panel

**`src/components/HeadquartersInfoPanel.tsx`**
- Add new prop `aiPlannedHits?: AIPlannedHit[]` (filtered to detected ones only)
- Add a "⚠️ Active Threats" section (player HQ only) showing:
  - Each detected planned hit with: attacking family, target capo name, turns until execution, intel source with flavor text
  - Visual urgency (red for 1 turn remaining, yellow for 2+)

**`src/pages/UltimateMafiaGame.tsx`**
- Pass filtered `aiPlannedHits` (only detected ones) to `HeadquartersInfoPanel`

## Files Modified
- `src/types/game-mechanics.ts` — extend `AIPlannedHit` interface
- `src/hooks/useEnhancedMafiaGameState.ts` — intel detection logic + notifications
- `src/components/GameSidePanels.tsx` — gate warning behind intel, show source
- `src/components/HeadquartersInfoPanel.tsx` — add Active Threats section
- `src/pages/UltimateMafiaGame.tsx` — pass threat intel to HQ panel

