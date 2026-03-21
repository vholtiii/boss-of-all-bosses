

# Add Negative Sound Effects for Unit Loss Events

## Problem
When a soldier or capo is killed in combat, arrested, or eliminated by an internal family hit, the player receives visual notifications but no audio feedback. Negative events should play a distinct warning/danger sound so the player immediately knows something bad happened.

## Solution
Add `playSound` calls in the existing pending notifications drain effect. Since all these bad events already use `type: 'error'` or `type: 'warning'` notification types, we can play appropriate sounds based on the notification type when draining the queue.

## Change

### `src/pages/UltimateMafiaGame.tsx` — Lines 69-81 (notification drain effect)
Add sound effects when processing pending notifications:
- `'error'` type notifications (arrests, internal hits, deaths, raids) → play `'danger'` sound
- `'warning'` type notifications (enemy attacks, police warnings) → play `'error'` sound
- `'success'` / `'info'` → play `'success'` / `'notification'` respectively

This covers all the events the user asked about:
- **Killed by a hit** → `pendingNotifications` with `type: 'warning'` (enemy attack) → plays `'error'` sound
- **Arrested** → `pendingNotifications` with `type: 'error'` (soldier/capo arrested) → plays `'danger'` sound
- **Internal family hit** → `pendingNotifications` with `type: 'error'` (internal hit) → plays `'danger'` sound

Single edit in one file. No new sound presets needed — `'danger'` and `'error'` already exist in the sound system.

