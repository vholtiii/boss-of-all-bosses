

# Fix: Unit Loss Notifications + Capo Combat Protection

## Problems Found

### 1. No notification when AI kills player units
In the AI combat loop (line 2489-2495), when AI kills a player unit, the unit is silently spliced from `deployedUnits`. The notification at line 2532-2537 only says "attacked your units" — it does NOT report which specific units died or how many. If a capo or soldier is killed, the player gets no "Unit Lost" alert.

### 2. Capos die just as easily as soldiers
In both AI combat (line 2489-2495) and player combat casualties (line 4314-4365), capos are in the same casualty pool as soldiers with no protection. A 70% kill chance applies equally to capos and soldiers during AI attacks.

### 3. AI kills capos in regular combat — should require Plan Hit
Capos are elite units (expensive, limited to 3). They should only be killable via Plan Hit, not random combat rolls.

## Plan

### A. Capo Combat Immunity (both player and AI)

**Rule**: Capos cannot be killed in regular combat. They can only be eliminated by:
- A **Plan Hit** specifically targeting them
- A **Hitman contract** targeting them

In all combat casualty code, skip capos from the kill pool:

1. **AI combat loop** (line 2489-2495): Filter `enemyUnitsHere` to exclude capos before kill rolls
2. **Player hit victory casualties** (line 4314-4350): Filter shuffled pool to exclude capos
3. **Player hit defeat casualties** (line 4353-4365): Filter shuffled pool to exclude capos

When a capo would have been killed, instead apply a **wound penalty**: -1 move next turn, -10 loyalty. Push a notification: "Your capo narrowly escaped — wounded and shaken."

### B. Per-Unit Loss Notifications for AI Attacks

In the AI combat loop (line 2489-2495), after each player unit is killed, push a specific notification:

```
type: 'error'
title: '💀 Soldier Killed!'
message: 'Your soldier was killed by the {family} in {district}!'
```

For capos (now wounded instead of killed):
```
type: 'warning'  
title: '🩸 Capo Wounded!'
message: 'Your capo was wounded by the {family} in {district}. -1 move, -10 loyalty.'
```

### C. AI Plan Hit Capability

Since capos can now only die to Plan Hits, give AI the ability to plan hits against player capos:
- AI with `aggressive` or `opportunistic` personality has a 15% chance per turn to initiate a planned hit against a player capo
- Stored as `aiPlannedHits: { family: string, targetUnitId: string, turnsRemaining: number }[]`
- Executes after 2 turns with 40-60% success rate
- On success: capo is killed, player gets a dramatic notification
- On failure: player gets a warning notification that an assassination attempt was foiled

### D. New Constants — `src/types/game-mechanics.ts`
```
CAPO_WOUND_LOYALTY_PENALTY = 10
CAPO_WOUND_MOVE_PENALTY = 1
AI_PLAN_HIT_CHANCE = 0.15
AI_PLAN_HIT_SUCCESS_RATE = 0.5
AI_PLAN_HIT_DURATION = 2
```

## Files Modified
- `src/types/game-mechanics.ts` — new constants
- `src/hooks/useEnhancedMafiaGameState.ts` — capo immunity in all combat paths, per-unit loss notifications, AI planned hit system, wound mechanic
- `src/components/GameSidePanels.tsx` — show active AI assassination warnings (if intel detected)

