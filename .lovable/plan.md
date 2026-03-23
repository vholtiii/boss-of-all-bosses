

# Fix: Capo Auto-Claim/Extort Notifications on Deploy

## Problem
When a capo is deployed from HQ (including turn 1), the `deployUnit` function auto-claims neutral territory and should auto-extort illegal businesses, but it:
1. **Never adds a notification** — the `pendingNotifications` array is not updated
2. **Never auto-extorts** — unlike `moveUnit`, it doesn't check for illegal businesses or award money/respect

The `moveUnit` function (lines 1047-1102) correctly handles both auto-claim notifications and auto-extortion with bonuses, but `deployUnit` (lines 1413-1421) only silently changes the hex owner.

## Fix — `src/hooks/useEnhancedMafiaGameState.ts`

In the `deployUnit` function (around lines 1413-1430), replicate the auto-claim/extort logic from `moveUnit`:

1. When a capo deploys to a neutral hex with an illegal business: auto-extort it, award money + respect, push a success notification
2. When a capo deploys to a neutral hex without an illegal business (or with a legal one): auto-claim it, push an info notification
3. Include the notification in the returned `pendingNotifications` array so the useEffect in `UltimateMafiaGame.tsx` picks it up and displays the toast

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — add notification + extortion logic to `deployUnit` (single block, ~15 lines)

