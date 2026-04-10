

# Add Supply Deal Negotiation

## Overview
Add a "Supply Deal" Boss-level negotiation that lets families buy supply access from whoever controls a supply node. Cost is $7,500 paid directly to the owning family. Fear modifies success chance. Tension reduction is only -5, and tension goes back up +5 when the deal expires (necessity, not diplomacy). AI families also initiate supply deals with the player.

## Mechanics
- **Scope**: Boss (family level)
- **Cost**: $7,500 — transferred to the target family's treasury
- **Base success**: 45% + fear/5 bonus + reputation bonuses
- **Duration**: 5-7 turns (random)
- **Tension on formation**: -5 (update `TENSION_REDUCE_SUPPLY_DEAL` from 15 to 5)
- **Tension on expiry**: +5 automatic (business relationship ending creates friction)
- **Effect**: Your family gains access to supply node types the deal partner has connected — prevents business decay
- **50% refund on failure** (standard)

## Changes

### 1. `src/types/game-mechanics.ts`
- Add `'supply_deal'` to `NegotiationType` union
- Add `SupplyDealPact` interface: `{ id, targetFamily, turnsRemaining, turnFormed, active }`
- Add supply deal config to `NEGOTIATION_TYPES` array (scope: `'family'`, baseCost: 7500, baseSuccess: 45, icon: '🚚', label: 'Supply Deal')
- Change `TENSION_REDUCE_SUPPLY_DEAL` from 15 to 5
- Add `TENSION_SUPPLY_DEAL_EXPIRY = 5` constant

### 2. `src/hooks/useEnhancedMafiaGameState.ts`
- Add `supplyDealPacts: SupplyDealPact[]` to game state interface and `deepCloneState`
- Initialize in `createInitialState` and defensive guards
- **`processNegotiation`**: Add `'supply_deal'` case — creates 5-7 turn pact, $7,500 goes to target family's money (AI opponent gets the cash), tension -5
- **Fear modifier**: In success chance calc, add `Math.floor(state.reputation.fear / 5)` bonus when negotiationType is `'supply_deal'`
- **Supply connectivity** (~line 2577): When checking if a family has a supply node connected, also check if any active `supplyDealPact` target family has that node connected — if so, treat it as connected for the pact holder
- Also update the BFS-based check in `GameSidePanels` supply panel (or pass deal data through)
- **Pact expiry** (~line 7517): Add tick-down for `supplyDealPacts`, on expiry add +5 tension with that family and notify player
- **AI initiates supply deals**: In `processAITurn` diplomacy section (~line 4383), add logic for AI families to propose supply deals to the player when:
  - AI family has disconnected supply nodes
  - Player controls or is connected to supply nodes the AI needs
  - Chance: ~20% per turn when conditions met
  - Notification: "🚚 [Family] proposes a Supply Deal — they want access to your supply lines for $7,500"
  - AI also accepts/auto-creates supply deals when they need supplies (money deducted from AI, added to player)

### 3. `src/components/NegotiationDialog.tsx`
- Show fear bonus in success chance display for supply deals (add `Math.floor(playerReputation / 5)` equivalent for fear — need to pass fear as a prop or add to existing `playerReputation`)
- Add `playerFear` prop to show the fear modifier visually

### 4. `src/components/GameSidePanels.tsx`
- In the Supply Lines dropdown, add an info section showing active supply deals:
  - "📜 Active Supply Deals" sub-section below the supply node list
  - Each deal shows: family name, turns remaining, which supply types are covered
  - Badge: "📜 Deal" on supply nodes that are connected via a deal rather than direct territory

### 5. `src/pages/UltimateMafiaGame.tsx`
- Add supply deal pacts to the pacts bar (🚚 icon + family name + turns remaining)
- Include in the "no active pacts" empty-state check

## Notifications
- **On deal formation (player)**: "🚚 Supply Deal Struck! Access to [Family]'s supply lines for [N] turns. $7,500 paid."
- **On deal formation (AI with player)**: "🚚 [Family] struck a Supply Deal — they're paying $7,500 for access to your supply lines for [N] turns."
- **On deal expiry**: "🚚 Supply Deal with [Family] has expired. Tension +5."
- **AI proposal**: "🚚 [Family] wants to negotiate a Supply Deal for access to your supplies."

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/NegotiationDialog.tsx`
- `src/components/GameSidePanels.tsx`
- `src/pages/UltimateMafiaGame.tsx`

