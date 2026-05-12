## Goal
Play the uploaded `Police_arrest.mp3` clip whenever one of the player's soldiers or capos is arrested (heat-tier or prosecution arrest).

## Steps
1. Copy `user-uploads://Police_arrest.mp3` → `public/sounds/police-arrest.mp3`.
2. In `src/hooks/useSoundSystem.ts`:
   - Add `arrest: 'alert'` to `SOUND_CATEGORIES`.
   - Add `arrest: '/sounds/police-arrest.mp3'` to `SOUND_FILES`.
   - Add `'arrest'` to `FILE_ONLY_SOUNDS` so only the voice clip plays (no synth fallback).
3. In `src/pages/UltimateMafiaGame.tsx` (the `pendingNotifications` drain effect, ~line 102), detect arrest notifications by title and play the new sound instead of the generic `danger` beep:
   - In the `'error'` case, if `n.title` includes `"Arrested"` (covers "🚔 Soldier Arrested" and the capo-arrest title produced in `useEnhancedMafiaGameState.ts`), call `playSound('arrest')`; otherwise keep the current `playSound('danger')`.
   - This covers both Tier 2 soldier arrests and Tier 3 capo arrests, which are the only paths that emit those titled error notifications for player units.

## Out of scope
- AI/rival arrests (no notifications for those today).
- Prosecution-indictment flow visuals or release notifications (different titles, kept on existing sounds).
- Volume/category re-tuning.
