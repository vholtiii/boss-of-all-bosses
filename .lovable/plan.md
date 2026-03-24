

# Fix: AI Plan Hit Must Respect Pacts + Notification on Cancellation

## Changes

### `src/hooks/useEnhancedMafiaGameState.ts`

**1. Block AI Plan Hit initiation (~line 3338)**
Before the personality check, add ceasefire/alliance lookup. If active pact exists with that family, `continue` — skip planning.

**2. Cancel existing hits when pact is formed**
In `processNegotiation`, when ceasefire or alliance succeeds, filter `aiPlannedHits` to remove hits from that family. Push notification:
- `"🕊️ Hit Called Off"` / `"The [Family] called off a planned hit — ceasefire agreement honored."`
- Or for alliance: `"...alliance pact honored."`

**3. Block execution of stale hits (~line 3531, safety net)**
Inside the execution loop, before executing, check if the hit family has an active ceasefire or alliance. If so, skip execution, remove the hit, and push notification:
- `"🕊️ Hit Called Off"` / `"The [Family] stood down from a planned hit — [ceasefire/alliance] in effect."`

**4. Target gone notification (~line 3557)**
Currently when `targetUnit` is not found, the hit is silently dropped. Add a notification:
- `"🔫 Hit Abandoned"` / `"The [Family] abandoned a planned hit — the target could not be found."`

### Notification summary

| Scenario | Title | Message |
|----------|-------|---------|
| Pact formed, pending hit cancelled | 🕊️ Hit Called Off | The [Family] called off a planned hit — [ceasefire/alliance] honored. |
| Execution blocked by active pact | 🕊️ Hit Called Off | The [Family] stood down from a planned hit — [ceasefire/alliance] in effect. |
| Target unit gone before execution | 🔫 Hit Abandoned | The [Family] abandoned a planned hit — the target could not be found. |

All notifications are `type: 'info'` (not errors — these are good news for the player).

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — 4 surgical additions

