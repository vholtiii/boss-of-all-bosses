# Fix overlapping music on the select screen

## Root cause

In `src/hooks/useBgMusic.ts`, the mount effect (lines 61–88) handles autoplay-blocked browsers by registering `click`/`keydown` listeners that call `audio.play()` later. The cleanup function pauses the audio but does **not** remove those listeners.

Under React StrictMode (dev) the effect runs twice on mount, and even in production any remount (HMR, parent re-render path) leaves orphan listeners behind. When the user later clicks, the orphaned listener resumes the paused/old audio at the same time a fresh `Audio` instance from the new mount is also playing → two looping tracks overlapping.

A secondary contributor: the `targetVolume` effect (lines 91–101) calls `audio.play()` whenever `soundConfig` changes and the audio is currently paused, which can race with the mount effect's `tryPlay` and double-start.

## Fix — `src/hooks/useBgMusic.ts` only

1. Track the unlock listeners in refs so cleanup can remove them: store `clickHandler` / `keyHandler` on a ref, and in the mount-effect cleanup call `document.removeEventListener` for both before pausing.
2. Guard the unlock handler with a `disposedRef` flag set to `true` in cleanup, so a stale handler that already fired-and-removed itself can't still call `.play()` on a torn-down audio.
3. Guard the `targetVolume` effect: skip the `.play()` branch if `disposedRef.current` is true or the audio is already attempting to play (track with a `playingRef` boolean set in the mount effect's `tryPlay`).
4. Make the mount effect depend on `src` (already does via the create effect) but keep it `[]` for autoplay logic — combine both effects into a single one keyed on `src` so one mount = one audio = one set of listeners. Cleanup tears down audio + listeners atomically.

No behavior change to `useSoundSystem`, `FamilySelectionScreen`, or `mafia-theme.mp3`. No new dependencies.

## Verification

- Hard-reload `/`, listen for a single theme track. Toggle the mute button off/on, confirm one track resumes (no overlap).
- Force autoplay-blocked path (DevTools → Application → block media autoplay, or just reload without prior interaction), click once, confirm one track.
- In dev StrictMode (default), confirm only one audible loop.
