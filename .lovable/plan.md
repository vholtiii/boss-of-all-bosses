

# Longer Combat Notifications + Turn Summary Combat Log

## Problem
1. **Notifications disappear too fast** — combat/death notifications use default durations (error: 6s, warning: 5s) which is too short for critical events like soldier deaths and failed hits
2. **Turn summary missing combat events** — AI combat kills and player hit outcomes are not logged in `turnReport.events` or `turnReport.resourceDeltas.soldiers`, so they don't appear in the end-of-turn summary modal

## Changes

### 1. Increase notification durations for combat events — `src/components/ui/notification-system.tsx`

Add a new `notifyCombat` helper in `useMafiaNotifications` with longer duration (10s for errors, 8s for warnings). Alternatively, increase default durations:
- `error` duration: 6000 → **10000ms**
- `warning` duration: 5000 → **8000ms**
- `success` duration: 4000 → **6000ms**
- `info` duration: 4000 → **5000ms**

This is the simplest approach — all combat notifications already use `error`/`warning` types.

### 2. Log combat events in turn report — `src/hooks/useEnhancedMafiaGameState.ts`

**AI combat loop** (~lines 2521-2533): When a player soldier is killed by AI, add:
```
turnReport.events.push(`💀 A soldier was killed by the ${fam} family in ${tile.district}`);
turnReport.resourceDeltas.soldiers--;
```

Same for capo wounds (~lines 2504-2516):
```
turnReport.events.push(`🩸 A capo was wounded by the ${fam} family in ${tile.district}`);
```

**Player hit victory casualties** (~lines 4413-4456): Add turn report logging for each soldier killed and capo wounded during player-initiated hits.

**Player hit defeat** (~lines 4458-4505): Add turn report logging for casualties and the failed hit event.

Since player hits happen during the action phase (not inside `endTurn`), we need to store these events so they appear in the *next* turn summary. Add a `combatLog: string[]` array to the game state that accumulates mid-turn combat events, then flush them into `turnReport.events` at the start of `endTurn`.

### 3. Add combatLog state field — `src/hooks/useEnhancedMafiaGameState.ts`

- Add `combatLog: string[]` to initial state
- In `processHitAction` and extort/claim combat: push events to `state.combatLog`
- In `endTurn`, flush `state.combatLog` into `turnReport.events` and reset it

## Files Modified
- `src/components/ui/notification-system.tsx` — increase durations
- `src/hooks/useEnhancedMafiaGameState.ts` — add combatLog, log AI kills + player hit outcomes to turnReport

