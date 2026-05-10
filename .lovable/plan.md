## Goal

Replace the generic synthesized combat sound played when a Hit or Planned Hit succeeds with the uploaded AK-47 gunshot burst MP3.

## Scope

The gunshot replaces only the **success** sound for hit-type combat results (regular Hit Territory and Plan Hit). Failed hits, extortion, sabotage, and other events keep their current sounds.

## Steps

1. **Add the audio asset**
   - Copy the uploaded file to `public/sounds/gunshot-hit.mp3` so it's served as a static asset.

2. **Extend `useSoundSystem` to support file-based sounds** (`src/hooks/useSoundSystem.ts`)
   - Add a small `playSoundFile(url, category)` helper that uses an `HTMLAudioElement`, respects the master `enabled` flag, and scales volume by the appropriate category (combat for the gunshot).
   - Register a new sound key `hit_kill` mapped to the `combat` category and wired to `gunshot-hit.mp3`. `playSound('hit_kill')` should route to the file player when the key has a file mapping, otherwise fall back to the existing oscillator path. This keeps the public API (`playSound`) unchanged for callers.
   - Preload the audio once (lazy on first use) to avoid playback latency.

3. **Swap the success sound for hits** (`src/pages/UltimateMafiaGame.tsx`, ~line 122)
   - Replace `playSoundSequence(['hit_success', 'success'])` with `playSound('hit_kill')` for successful hits.
   - Leave the failure branch (`hit_fail` + `error`) untouched.
   - Since planned hits resolve through `processTerritoryHit` and set `lastCombatResult` with `type: 'hit'`, this single change covers both regular hits and planned hits automatically.

## Out of Scope

- Sounds for sabotage, extortion, AI-on-player planned hits announced via notifications, or generic success/danger toasts.
- Volume/mixing UI changes — the existing Combat slider already controls this category.
- Any gameplay/balance changes.

## Technical notes

- Static MP3 in `public/` is referenced as `/sounds/gunshot-hit.mp3` from the audio element.
- `HTMLAudioElement.volume` is set from `soundConfigRef.current.combatVolume` at play time; `currentTime = 0` then `play()` so rapid retriggers restart cleanly.
- The clip is short (~2s), so no truncation logic is needed.
