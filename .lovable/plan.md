## Goal
On a failed extortion, play the uploaded `We_don_t_need_your_protection.mp3` clip in addition to the existing synthesized `extort_fail` beep.

## Steps
1. Copy `user-uploads://We_don_t_need_your_protection.mp3` into `public/sounds/extortion-fail-voice.mp3`.
2. In `src/hooks/useSoundSystem.ts`, change the file-vs-oscillator branch so a sound type can have BOTH a file and an oscillator preset (currently the file path causes an early `return`, skipping the synth). Approach: when a `SOUND_FILES[type]` exists, play the file, then fall through (instead of returning) so the oscillator preset still plays if one is defined for that type.
   - Alternative considered: hardcode a second `Audio` call only for `extort_fail`. Rejected — generalizing keeps future "voice + sfx" pairings trivial.
3. Add `extort_fail: '/sounds/extortion-fail-voice.mp3'` to the `SOUND_FILES` map. The existing `extort_fail` oscillator preset stays untouched, so both sounds play together at the combat volume.

## Out of scope
- No changes to `extort_success`, no volume re-categorization, no UI changes.
