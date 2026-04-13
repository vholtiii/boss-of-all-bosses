

# Implement Family Power System — Logic, UI & AI

## Overview
Add a fully functional family power system with cooldown tracking, player activation buttons in the tactical phase, combat modifier integration, and AI usage. Five unique powers, each with distinct mechanics.

## New State Fields

**`src/types/game-mechanics.ts`** — Add interface and constants:
```typescript
interface FamilyPower {
  id: string;
  name: string;
  family: string;
  cost: number;           // tactical actions consumed
  cooldownTurns: number;
  oneTimeUse?: boolean;
  phase: 'tactical';
}
```
Define `FAMILY_POWERS` constant with all 5 powers.

**`src/hooks/useEnhancedMafiaGameState.ts`** — Add to `EnhancedMafiaGameState` interface:
- `familyPowerCooldowns: Record<string, number>` — family → cooldown turns remaining (used for both player and AI)
- `familyPowerUsedForever: Record<string, boolean>` — family → true if one-time power used (Colombo)
- `frontBossHexes: Array<{ q, r, s, turnsRemaining, ownerFamily }>` — Genovese-hidden hexes
- `luccheseBoostedDistrict: { district: string, turnsRemaining: number } | null` — Lucchese income boost
- `bonannoPurgeImmunity: Array<{ unitId: string, turnsRemaining: number }>` — flip immunity tracking

## Power Logic Implementation

All in `useEnhancedMafiaGameState.ts`:

### 1. Gambino — "Dellacroce Network" (2 tactical, 3-turn CD)
- Player selects a hex during tactical phase → scout that hex + all 6 neighbors via `getHexNeighbors()`
- Each hex gets a `ScoutedHex` entry with fresh intel
- Deduct 2 tactical actions

### 2. Genovese — "The Front Boss" (1 tactical, 2-turn CD)
- Player selects one of their own hexes → add to `frontBossHexes` with 3-turn timer
- **Scout blocking**: In `processScout()`, if target hex is in `frontBossHexes` for a different family, return early with "intel blocked" notification
- **Hit penalty**: In `processTerritoryHit()`, after building `chance`, check if target hex is in `frontBossHexes` → `chance -= 0.30`
- **Sabotage penalty**: In `processSabotageHex()`, add 30% failure chance (currently auto-succeeds — add roll)
- **Heat zeroing**: In income calculation, skip heat for businesses on front boss hexes
- **Visual**: Hex appears as "neutral" to enemies (handled in grid component — out of scope for this plan, can be added later)

### 3. Lucchese — "Garment District Shakedown" (1 tactical, 3-turn CD)
- Player activates → find the district where they have the most hexes
- +50% income from all hexes in that district for 3 turns (tracked via `luccheseBoostedDistrict`)
- Extract $1,000 per rival hex in that district (added to player money, deducted from rival AI)
- Applied during income calculation in `endTurn`

### 4. Bonanno — "Donnie Brasco Purge" (1 tactical, 4-turn CD)
- On activation: find all player soldiers with loyalty < 50 → remove them
- Surviving soldiers: +15 loyalty
- Surviving soldiers: add to `bonannoPurgeImmunity` with 2-turn timer (blocks flip attempts)
- Tick down immunity in `endTurn`

### 5. Colombo — "Persico Succession" (1 tactical, once per game)
- **Reactive trigger**: When a player capo is killed (via hitman contract or plan hit — the only ways capos die), check if Colombo power is available
- If available, find the best eligible soldier (highest loyalty) near the dead capo's position
- Auto-promote to capo (no cost, no action required)
- Mark `familyPowerUsedForever[colombo] = true`
- Notification: "Persico Succession triggered — soldier promoted to capo"

## Player Activation (UI)

**`src/components/GameSidePanels.tsx`** — Add a "Family Power" section inside the "Recruitment & Tactical" collapsible, visible only during tactical phase:

- Button shows power name, cost, and cooldown status
- Disabled when: on cooldown, insufficient tactical actions, or (Colombo) already used
- On click: dispatch `{ type: 'use_family_power' }` action
- Gambino/Genovese/Lucchese require a hex selection mode (similar to scout/fortify); Bonanno is instant; Colombo is passive/reactive

For hex-targeting powers (Gambino, Genovese), add a new `MoveAction` value `'family_power'` that enters a selection mode on the map.

## AI Usage

**In `processAITurn()`**, after existing tactical actions (fortify, scout), add family power decision block:

```
if (aiPhase >= 2 && aiTacticalRemaining >= powerCost && !onCooldown) {
  // Per-family AI logic:
  // Gambino: Use when 2+ unscouted enemy hexes near border (30% chance per turn)
  // Genovese: Use on highest-value hex with business (25% chance)
  // Lucchese: Use when they control 3+ hexes in a district (40% chance)
  // Bonanno: Use when 2+ soldiers have loyalty < 50 (50% chance)
  // Colombo: Reactive only — triggered in capo death handler
}
```

AI cooldowns tracked in the same `familyPowerCooldowns` record (keyed by family name).

## Cooldown Tick-Down

In `endTurn()`, after existing tick-downs:
- Decrement all `familyPowerCooldowns` entries
- Decrement `frontBossHexes` timers, remove expired
- Decrement `luccheseBoostedDistrict` timer if active
- Decrement `bonannoPurgeImmunity` timers, remove expired

## Integration Points (Combat Modifiers)

| Location | Modifier |
|---|---|
| `processScout()` | Block if target in `frontBossHexes` and scout family ≠ owner |
| `processTerritoryHit()` line ~7085 | `-0.30` chance if target in `frontBossHexes` |
| `processSabotageHex()` line ~6704 | Add 30% failure roll if target in `frontBossHexes` |
| `endTurn()` income loop | +50% for Lucchese boosted district hexes |
| Flip soldier logic | Block if target in `bonannoPurgeImmunity` |
| Hitman/Plan Hit capo death | Trigger Colombo succession check |

## Files Changed

1. **`src/types/game-mechanics.ts`** — Add `FamilyPower` interface, `FAMILY_POWERS` constant, new `MoveAction` value
2. **`src/hooks/useEnhancedMafiaGameState.ts`** — New state fields, `useFamilyPower()` handler, combat modifier hooks, AI power usage, cooldown ticking, Colombo reactive trigger
3. **`src/components/GameSidePanels.tsx`** — Family Power button in tactical section with cost/cooldown display

