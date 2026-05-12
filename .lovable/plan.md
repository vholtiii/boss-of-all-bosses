## Goal
Play the uploaded `Construction_completed.mp3` clip when a player's business finishes construction (the "🏢 Business Complete!" notification at `useEnhancedMafiaGameState.ts:5093`).

## Steps
1. Copy `user-uploads://Construction_completed.mp3` → `public/sounds/construction-complete.mp3`.
2. In `src/hooks/useSoundSystem.ts`:
   - Add `construction_complete: '/sounds/construction-complete.mp3'` to `SOUND_FILES`.
   - Add `'construction_complete'` to `FILE_ONLY_SOUNDS`. Plays through the **Voice** channel like the other diegetic clips.
3. In `src/pages/UltimateMafiaGame.tsx` `pendingNotifications` `'success'` branch, add another title check before the default:
   - `else if (n.title.includes('Business Complete'))` → `playSound('construction_complete')`.
   - Keep existing `Contract Fulfilled` and `Construction Started` branches.

## Out of scope
- AI-side completion (no notification today).
- No other notification flows touched.
