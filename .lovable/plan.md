

# Player-Built Business Defense: Capo Requirement + Defense Bonus + Capo Threat Alerts

## Overview

Player-built businesses become significantly harder for rivals to seize, with clear visual and notification feedback when threatened.

### Mechanics

1. **Only a Capo can seize** a player-built business hex — regular soldiers occupy but can't flip ownership
2. **+20% defense bonus** on player-built business hexes (stacks with fortify/safehouse)
3. **Capo threat indicator & notification** — when a rival Capo occupies or attacks a player-built business hex, the player gets a prominent alert and the hex shows a special threat marker

### Capo Threat Alert (new addition)

- **Notification**: "🚨 Capo Threat! The {family} Capo is attacking your built business in {district}! Only Capos can seize built businesses." — high-priority alert (error-level, 10s duration)
- **Map indicator**: Player-built business hexes with an enemy Capo present get a pulsing red 👔 badge overlay, distinct from the ⚠️ seizure penalty badge
- When a regular soldier occupies (but can't seize), a softer notification: "🛡️ Your built business in {district} repelled a takeover — only a Capo can seize it."

## Technical Changes

### `src/types/game-mechanics.ts`
- Add `BUILT_BUSINESS_DEFENSE_BONUS = 20`

### `src/hooks/useEnhancedMafiaGameState.ts`
- **No-combat capture path**: Block territory flip on player-built business hexes unless unit is a Capo. Push "repelled" notification for soldiers, "Capo Threat" notification for Capos.
- **Combat capture path**: After combat, only flip ownership if surviving AI units include a Capo. Same notification logic.
- **Combat defense calcs**: Add `BUILT_BUSINESS_DEFENSE_BONUS / 100` to defender survival on player-built business hexes.

### `src/components/EnhancedMafiaHexGrid.tsx`
- Add pulsing red 👔 badge on player-built hexes where an enemy Capo is present (check units on hex for rival Capo type)
- Update legend: "🏗️ Player-Built: +20% defense, Capo required to seize"

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/EnhancedMafiaHexGrid.tsx`

