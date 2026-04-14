

# Eliminate Rats & Suspicious Soldiers — Plan

## Overview
A multi-layered counter-intelligence system where the Boss can identify and eliminate informants, rats, and disloyal soldiers through investigation and direct action.

## Detection: Three Discovery Paths

### Path 1: Intel via Bribed Officials
- **Captain bribe**: Each turn, 25% chance to flag one player rat (if any exist) as "Suspected Informant"
- **Chief bribe**: 40% chance per turn, flags up to 2
- **Mayor bribe**: Auto-reveals all current player rats immediately each turn

### Path 2: Suspicion Markers
- Any soldier with loyalty below 40 for 2+ consecutive turns gets a visible ⚠️ "Suspicious" marker
- Suspicious soldiers may or may not actually be rats — creates uncertainty
- Marker clears if loyalty rises above 50

### Path 3: Self-Scouting
- During Tactical phase, player can scout their **own** soldier's hex (currently scouting only works on enemy hexes)
- Scouting own hex reveals whether the soldier on it is a confirmed informant (green checkmark = clean, red skull = rat)
- Costs 1 tactical action as usual

## Elimination Action (Boss HQ Panel)

### Where
New "🔫 Purge Ranks" button in the HQ panel, visible during the **Action phase**. Opens a panel listing all soldiers with Suspicious or Confirmed Rat status.

### How It Works
| Property | Value |
|----------|-------|
| Cost | 1 Action token, no money cost |
| Target | Any soldier flagged as Suspicious or Confirmed Rat |
| Phase | Action phase only |
| Limit | 1 elimination per turn |

### Outcomes

**Eliminating a Confirmed Rat:**
- Soldier permanently removed from board
- +5 Fear
- +3 Heat
- All other soldiers below loyalty 50 get +10 loyalty (intimidation effect)
- Prosecution risk recalculated immediately (one fewer informant)
- Event log: "The family dealt with a rat in the ranks."

**Eliminating a Suspicious (but innocent) soldier:**
- Soldier permanently removed
- +3 Fear, +2 Heat
- All other soldiers get **-5 loyalty** (unjust killing damages morale)
- -3 Respect (word gets out it was a wrongful hit)
- Event log: "A loyal soldier was wrongfully eliminated. The family questions your judgment."

This risk/reward creates a meaningful decision: wait for confirmation via bribes/scouting, or act fast and risk morale damage.

## UI Changes

### HQ Panel (`HeadquartersInfoPanel.tsx`)
- New "🔫 Purge Ranks" section showing flagged soldiers with their status (Suspicious ⚠️ / Confirmed Rat 🐀)
- Each entry shows: soldier name, loyalty, turns suspicious, status
- "Eliminate" button per soldier, disabled if no actions remaining

### Map Indicators (`EnhancedMafiaHexGrid.tsx`)
- ⚠️ icon on hexes with Suspicious soldiers
- 🐀 icon on hexes with Confirmed Rats (only after discovery)

### Turn Summary
- Report rat eliminations, wrongful kills, and discovery events

## State Changes

### New Fields
- `soldierStats[id].suspiciousTurns: number` — consecutive turns below loyalty 40
- `soldierStats[id].confirmedRat: boolean` — set true when discovered via bribe/scout
- `soldierStats[id].suspicious: boolean` — set true when suspiciousTurns >= 2

### Turn Processing (in `useEnhancedMafiaGameState.ts`)
1. **Suspicion tracking**: For each player soldier, if loyalty < 40 increment `suspiciousTurns`, else if loyalty > 50 reset it. Mark `suspicious = true` at 2+ turns.
2. **Bribe discovery**: If Captain/Chief/Mayor bribe active, roll to reveal actual rats from `copFlippedSoldiers` and set `confirmedRat = true`.
3. **Self-scout discovery**: When player scouts own hex, check if soldier is in `copFlippedSoldiers` and flag accordingly.

### New Action: `eliminateSoldier(soldierId: string)`
- Validates: action phase, actions remaining > 0, soldier is suspicious or confirmed rat
- Removes soldier from `deployedUnits`
- Cleans up `copFlippedSoldiers` if was a rat
- Applies fear/heat/loyalty consequences based on whether actually a rat
- Decrements `actionsRemaining`

## Files Changed
1. `src/hooks/useEnhancedMafiaGameState.ts` — suspicion tracking, bribe discovery, self-scout, eliminateSoldier action
2. `src/components/HeadquartersInfoPanel.tsx` — Purge Ranks UI section
3. `src/components/EnhancedMafiaHexGrid.tsx` — suspicion/rat icons on map
4. `src/components/TurnSummaryModal.tsx` — report eliminations

