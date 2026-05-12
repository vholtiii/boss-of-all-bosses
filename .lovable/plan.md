## Goal
Replace the current synthesized "extort_success" beep with the uploaded `Extortion_2.mp3` audio clip.

## Steps
1. Copy `user-uploads://Extortion_2.mp3` into `public/sounds/extortion-success.mp3` (matches the existing `/sounds/...` convention used by `hit_kill`, `assassin_kill`, etc.).
2. In `src/hooks/useSoundSystem.ts`, add `extort_success: '/sounds/extortion-success.mp3'` to the `SOUND_FILES` map. The existing logic will then play the file (using the combat volume slider, since `extort_success` is already categorized as `combat`) and skip the oscillator preset.
3. Leave `extort_fail` and all other sounds unchanged.

## Out of scope
- No volume re-categorization, no UI changes, no other sound replacements.
