

# Hitman Contract System — Final Plan

## Summary

Complete rework: hitmen become external contract killers. Player pays $15,000 to target any enemy soldier or capo (no scouting needed). The hit takes 3-5 turns, generates no heat, and grants no bonuses. If the hit **fails** (missed roll or expired after 5 turns), the player is refunded 50% and the target family is notified — if AI-controlled, that family enters an **alert state** boosting its tactical behavior.

## Payment Model

- **On hire**: full $15,000 deducted
- **Success**: no refund (money already spent)
- **Failure** (missed roll, expired, or target already dead): 50% refunded ($7,500)

## Duration & Success (checked at resolution)

| Target location at hire | Duration |
|---|---|
| Open field | 3 turns |
| Fortified / Safehouse | 4 turns |
| HQ | 5 turns |

| Target location at resolution | Success rate |
|---|---|
| Open field | 90% |
| Fortified | 65% |
| Safehouse | 55% |
| HQ | 40% |

Auto-fail if contract exceeds 5 turns total.

## Failed Hit → AI Alert State

When a hitman contract fails against an AI family:
- Notification to player: "The hit on [family] failed. They know someone is after them."
- Target AI family enters **alert mode** for 5 turns (new per-family state: `alertTurnsRemaining`)
- During alert mode, that AI family:
  - Recruits +1 extra soldier per turn (on top of normal cap)
  - Prioritizes fortifying hexes (marks 1-2 units as fortified per turn)
  - Gets +1 additional move per unit (increased patrol range)
  - Actively targets player hexes (same behavior as bounty priority)

## Target Selection UI

Player sees a list grouped by family showing only:
- Family name
- Unit type (Soldier / Capo)
- Unit label (e.g. "Soldier #3", "Capo — The Enforcer")
- **No hex location, no stats**

## State Changes

### `src/types/game-mechanics.ts`
- Replace `Hitman` interface with `HitmanContract { id, targetUnitId, targetFamily, turnsRemaining, hiredOnTurn, cost }`
- Remove `HITMAN_REQUIREMENTS`, `HITMAN_MAINTENANCE_MULTIPLIER`
- Add constants: `HITMAN_CONTRACT_COST = 15000`, success rates, duration values, `HITMAN_REFUND_RATE = 0.5`, `HITMAN_MAX_LIFETIME = 5`, `HITMAN_ALERT_DURATION = 5`

### `src/hooks/useEnhancedMafiaGameState.ts`
- Change `hitmen: Hitman[]` → `hitmanContracts: HitmanContract[]`
- Add `aiAlertState: Record<string, number>` to game state (family → turns remaining)
- **`hire_hitman` action**: deduct cost, determine duration from target's current location, create contract
- **Start-of-turn resolution**: decrement contract counters, on 0 check target location → roll success. On success: remove target. On failure: refund 50%, notify, set `aiAlertState[targetFamily] = HITMAN_ALERT_DURATION`
- **Auto-expire** contracts older than 5 turns with 50% refund + alert
- **AI turn (`processAITurn`)**: check `aiAlertState[fam]`, if active: +1 recruit cap, fortify 1-2 units, +1 move range, prioritize player hexes. Decrement alert each turn.
- Remove hitman promotion logic and combat bonus references

### `src/components/HitmanPanel.tsx`
- Complete rewrite: active contracts with countdowns, "Hire Hitman" button with blind target selection (family + type only)
- Remove promotion UI entirely

### `src/components/GameSidePanels.tsx`
- Update props for contract-based system

### `COMBAT_SYSTEM_GUIDE.md` & `SOLDIER_RECRUITMENT_GUIDE.md`
- Document new hitman contract system and AI alert mechanics

