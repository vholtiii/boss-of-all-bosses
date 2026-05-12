## Goal
Play the uploaded construction-site clip the moment a player begins building a business on a hex (i.e. when the "🚧 Construction Started" notification fires).

## Steps
1. Copy `user-uploads://Construction_site_wi_1-1778600716812.wav` → `public/sounds/construction-start.wav` (browsers handle `.wav` directly via `Audio`).
2. In `src/hooks/useSoundSystem.ts`:
   - Add `construction_start: '/sounds/construction-start.wav'` to `SOUND_FILES`.
   - Add `'construction_start'` to `FILE_ONLY_SOUNDS` (no synth fallback).
   - Routes through the existing **Voice** channel — fits the "ambient/diegetic clip" bucket alongside the gunshot/extortion/arrest lines.
3. In `src/pages/UltimateMafiaGame.tsx` `pendingNotifications` drain effect (~line 94, the `'success'` case): detect the construction-start title and play the new sound instead of the generic `success` beep.
   - Title check: `t.includes('Construction Started')` (matches the exact notification emitted at `useEnhancedMafiaGameState.ts:8347`).
   - Keep the existing `Contract Fulfilled` branch and the default `playSound('success')` fallback intact.

## Out of scope
- Construction completion notification (different title, stays on default `success` sound).
- AI building activity (no notifications emitted today).
- Volume/category UI changes.
