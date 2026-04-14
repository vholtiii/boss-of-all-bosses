

# Add Sound Cue to Escort-Triggered Elimination

## Problem
When a Capo escorts a marked soldier and carries out the hit, no sound plays. The existing combat sound system triggers on `lastCombatResult` changes, but the escort handler never sets that field.

## Fix

**File: `src/hooks/useEnhancedMafiaGameState.ts` (~line 1887-1899)**

In the return block of the marked-soldier escort handler, add `lastCombatResult` to the returned state:

```ts
lastCombatResult: { success: true, type: 'hit' as const, timestamp: Date.now() },
```

This will cause the existing `useEffect` in `UltimateMafiaGame.tsx` (line ~116) to detect the combat result and play `hit_success` + `success` sound sequence automatically — no additional wiring needed.

One line added to one file.

