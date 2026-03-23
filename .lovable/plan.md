

# Tactical Actions Refinement (Unchanged from approved plan)

No changes needed — the plan is correct as approved. Change #1 (scout mode persistence) only affects `selectedMoveAction` state (the UI toggle), not `tacticalActionsRemaining` which is decremented on each use as before.

All 5 changes remain:
1. **Scout mode persistence** — UI stays in scout mode after use (budget still decremented normally)
2. **Fortify one-click** — consolidate to selectUnit path, simplify button
3. **Escort tooltip** — clarify as "Call soldier to capo"
4. **Safehouse one-click** — apply immediately on capo select
5. **Safehouse mode persistence** — same as scout

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/pages/UltimateMafiaGame.tsx`

