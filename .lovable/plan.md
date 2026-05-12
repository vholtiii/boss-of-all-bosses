## Goal
Play the uploaded `multiple_guns_gettin_4` sound effect whenever the player successfully fortifies a hex.

## Steps

1. **Add the audio file**
   - Copy `user-uploads://multiple_guns_gettin_4-1778619320426.wav` to `public/sounds/fortify.wav`.

2. **Register the sound** (`src/hooks/useSoundSystem.ts`)
   - Add `fortify: '/sounds/fortify.wav'` to the `SOUND_FILES` map.
   - Add `'fortify'` to the `FILE_ONLY_SOUNDS` set so no synth beep layers on top.
   - It will play through the existing Voice volume channel (consistent with other recorded clips like `arrest`, `hit_kill`).

3. **Trigger on player fortify** (`src/pages/UltimateMafiaGame.tsx`)
   - In the notification dispatcher (around line 128 where `case 'info'` plays `'notification'`), special-case notifications whose title includes `Hex Fortified` — call `playSound('fortify')` instead of `playSound('notification')`.
   - This fires only on the player-driven success path (the "🛡️ Hex Fortified" info toast emitted by `fortifyUnit` / the tactical-phase fortify branch). It will not fire on the "Max Fortifications" or "Phase Locked" warnings, and not on AI fortifications (which don't push player notifications).

## Notes
- No game-logic changes; UI/audio only.
- Uses existing Voice volume slider and master mute; respects user sound settings automatically.
