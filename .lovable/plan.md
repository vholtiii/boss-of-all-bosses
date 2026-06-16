## Goal
Make `mafia-theme.mp3` reliably play on the family selection screen. The hook is already imported and called, but two bugs in `useBgMusic` can leave it silent.

## Changes

### `src/hooks/useBgMusic.ts`
1. **Always attempt playback on mount, even when muted.**
   - In the mount effect (currently `[]` deps), call `audio.play()` and register the click/keydown autoplay-unlock fallback regardless of `targetVolume`. Keep volume at 0 if muted; let the existing `[targetVolume]` effect fade it up later when the user unmutes.
   - Fixes the case where a user who launched with sound muted never gets music even after unmuting on the select screen.
2. **Add an explicit `musicVolume` channel (optional, small).**
   - Read `soundConfig.musicVolume` if present, else fall back to `sfxVolume * 0.7`. Pure additive — no breaking change.
   - Keeps behavior identical for current users while letting music exist independent of SFX going forward (no UI work in this slice).

### `src/components/FamilySelectionScreen.tsx`
No code changes needed — the hook is already wired at line 331 with the correct src and `soundConfig`. Verify after the hook fix by:
- Loading the select screen with sound enabled → music fades in (immediate or after first click if browser blocks autoplay).
- Toggling the mute button off then on → music resumes.

## Out of scope
- New music-volume slider in `SoundSettingsDialog` (can follow once channel exists).
- Touching in-game music or `useSoundSystem` SFX synth voices.
- Changing the ambience crossfade in `beginGame`.

## Technical notes
- `useBgMusic.ts` mount effect: move `tryPlay()` out of any volume gate; the existing `fadeTo(targetVolume, ...)` handles the 0-volume case (audio plays muted, autoplay unlock still wires up).
- `SoundConfig` type stays backward compatible — `musicVolume?: number` is optional and persists via the existing `updateSoundConfig` path without migration work.
