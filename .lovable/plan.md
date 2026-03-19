

## Capo Negotiation System

### Overview
When a Capo is on an enemy-controlled hex during the Action phase, a new **Negotiate** button appears in the action context menu alongside Hit. Clicking it opens a negotiation dialog with three options: **Ceasefire Pact**, **Bribe for Territory**, and **Form Alliance**. Outcomes are dice-roll based, modified by Capo personality.

### 1. Add Capo Personality Types

**`DeployedUnit` interface** gets a new optional field:
```ts
personality?: 'diplomat' | 'enforcer' | 'schemer';
```

- **Diplomat**: +20% success on Ceasefire, +10% Alliance
- **Enforcer**: +15% success on Bribe for Territory (intimidation)
- **Schemer**: +15% Alliance, +10% on all (versatile)

Personality assigned randomly on Capo creation. Displayed on the Capo icon tooltip.

### 2. Negotiation Types

**Ceasefire Pact**
- Both families can't attack each other for N turns (3-5)
- Costs reputation (you look weak) but gives safety
- Success roll: base 50% + personality bonus + reputation modifier

**Bribe for Territory**
- Pay money to peacefully claim the hex
- Cost scales with enemy family strength and hex value
- Success roll: base 40% + money offered bonus + personality

**Form Alliance (Conditional Pact)**
- Propose conditions (e.g., "Don't expand into District X")
- Allied family won't attack, shares defense on border hexes
- Breaking conditions: alliance dissolves, massive reputation penalty, enemy becomes hostile
- Success roll: base 30% + relationship score + personality

### 3. Dice-Roll Outcome UI

A visual roll animation in a dialog:
- Show success chance percentage
- Animated "rolling" effect (number cycling)
- **Success**: green flash, apply effects
- **Failure**: red flash, consequences (enemy aggression increases, Capo may be expelled from hex)

### 4. Conditional Pact Data Model

```ts
interface AlliancePact {
  id: string;
  alliedFamily: string;
  conditions: AllianceCondition[];
  turnsRemaining: number;
  turnFormed: number;
  active: boolean;
}

interface AllianceCondition {
  type: 'no_expand_district' | 'no_attack_family' | 'share_income';
  target: string; // district name or family
  violated: boolean;
}
```

Store `alliances: AlliancePact[]` and `ceasefires: { family: string; turnsRemaining: number }[]` in game state.

### 5. Files to Change

| File | Change |
|------|--------|
| `src/hooks/useEnhancedMafiaGameState.ts` | Add `personality` to DeployedUnit, add alliance/ceasefire state, add `negotiate` action handler, add condition-checking on turn end |
| `src/components/EnhancedMafiaHexGrid.tsx` | Add "Negotiate" button to action menu when Capo is on enemy hex |
| `src/components/NegotiationDialog.tsx` | **New** — Dialog with 3 negotiation options, dice-roll animation, outcome display |
| `src/types/game-mechanics.ts` | Add `AlliancePact`, `AllianceCondition`, `CeasefirePact` types, personality type |
| `src/pages/UltimateMafiaGame.tsx` | Wire negotiation dialog state, show active alliances/ceasefires in HUD |

### 6. Implementation Order

1. Add types (personality, alliance, ceasefire) to game-mechanics.ts
2. Update DeployedUnit with personality; assign on Capo creation
3. Add alliance/ceasefire state + negotiate handler in game state hook
4. Build NegotiationDialog component with dice-roll UI
5. Add "Negotiate" button to action menu for Capos on enemy hexes
6. Add alliance condition checking at end of turn
7. Show active pacts in the HUD

