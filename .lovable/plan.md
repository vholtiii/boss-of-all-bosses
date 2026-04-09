

# Revised Plan — Boss Actions: Declare War, Go to the Mattresses, War Summit

## Actions 1 & 2: Unchanged

**Declare War** and **Go to the Mattresses** remain as previously approved.

## Action 3: "War Summit" (Renamed from War Council)

A Boss calls a War Summit to rally the family, project power, and prepare for conflict. It signals to rivals and law enforcement alike that the family means business.

### Why Call a War Summit?

Strategic situations where it shines:
- **Pre-war preparation**: Call it the turn before declaring war to maximize opening aggression
- **Deterrence**: The fear spike discourages rivals from attacking your territory
- **Heat tradeoff**: You gain combat power and intimidation, but draw police attention — forces a risk/reward decision

### Stats

| Property | Value |
|---|---|
| **Cost** | $5,000 + 1 action point |
| **Cooldown** | 5 turns |
| **Duration** | 2 turns |

### Effects While Active

| Effect | Value | Reasoning |
|---|---|---|
| Combat bonus | +15% hit chance for all deployed soldiers | Soldiers are rallied and coordinated |
| Fear boost | +10 fear immediately | The streets hear the family is mobilizing |
| Heat increase | +8 police heat | A summit of known criminals draws federal attention |
| Loyalty boost | +3 loyalty to all soldiers | Morale surge from Boss showing leadership |

### Strategic Tension

The heat increase is the key tradeoff. At high heat levels (70+), calling a War Summit could push you into capo arrest territory or toward RICO. Players must weigh "do I need the combat edge enough to risk the heat?"

## Changes

### `src/types/game-mechanics.ts`
- Rename constants: `WAR_SUMMIT_COST = 5000`, `WAR_SUMMIT_COOLDOWN = 5`, `WAR_SUMMIT_DURATION = 2`, `WAR_SUMMIT_COMBAT_BONUS = 15`, `WAR_SUMMIT_FEAR_BONUS = 10`, `WAR_SUMMIT_HEAT_COST = 8`, `WAR_SUMMIT_LOYALTY_BONUS = 3`
- Add `WarSummitState` interface: `{ active: boolean, turnsRemaining: number }`

### `src/hooks/useEnhancedMafiaGameState.ts`
- Add `warSummitState`, `warSummitCooldownUntil` to state
- Handler: deduct $5K + 1 action, set active for 2 turns, apply +10 fear, +8 heat, +3 loyalty to all soldiers immediately
- Combat calculation: add +15% hit bonus while active
- End-turn: decrement turns, expire after 0
- Add all 3 Boss actions (Declare War, Mattresses, War Summit) in this implementation pass

### `src/components/HeadquartersInfoPanel.tsx`
- 3 new Boss action buttons with cooldown timers
- Active state badges: "🛏️ At the Mattresses (X turns)", "⚔️ War Summit (X turns)"
- Tooltips explaining cost, cooldown, and effects

### `src/pages/UltimateMafiaGame.tsx`
- Wire all 3 action types through `handleAction`
- Pass state to HQ panel
- Warning banners for active states

### `GAME_MECHANICS.md`
- Document all 3 new Boss actions

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/components/HeadquartersInfoPanel.tsx`
- `src/pages/UltimateMafiaGame.tsx`
- `GAME_MECHANICS.md`

