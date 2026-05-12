## Goal
Play the uploaded `putting_out_a_hit.mp3` clip when the player commits to a target in either:
- **Plan Hit** — clicking the target unit/hex (action `plan_hit` with a `targetUnitId`).
- **Purge Ranks** — clicking "Mark for Death" on a suspicious/rat soldier (action `eliminate_soldier`).

## Steps
1. Copy `user-uploads://putting_out_a_hit.mp3` → `public/sounds/putting-out-a-hit.mp3`.
2. In `src/hooks/useSoundSystem.ts`:
   - Add `put_out_hit: '/sounds/putting-out-a-hit.mp3'` to `SOUND_FILES`.
   - Add `'put_out_hit'` to `FILE_ONLY_SOUNDS`. Routes through the **Voice** channel.
3. In `src/pages/UltimateMafiaGame.tsx` `handleAction` (around lines 225–252), play the sound right before dispatching:
   - In the `action.type === 'plan_hit'` branch (line 245), call `playSound('put_out_hit')` before `performAction(action)`. (This fires only when an actual target is selected, not when entering plan-hit mode.)
   - In the generic `performAction(action)` fallback at the bottom, intercept `action.type === 'eliminate_soldier'` first and call `playSound('put_out_hit')` before forwarding. Cleanest: add `if (action.type === 'eliminate_soldier') { playSound('put_out_hit'); }` immediately before the final `performAction(action)` so we don't disturb existing branches.
   - Add `playSound` to the `useCallback` deps (already in scope as it's used elsewhere — verify the existing `handleAction` deps array; if absent, append it).

## Out of scope
- Donnie Brasco mass-purge family power (different action, different vibe).
- AI-side plan hits / AI purges.
- Any UI changes; this is purely an audio cue.
