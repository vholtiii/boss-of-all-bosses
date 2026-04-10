

# Add Mafia Background Music to Family Selection Screen

## Approach
Use a royalty-free mafia/noir-themed MP3 file as a static asset that plays as ambient background music on the title/family selection screen. The music will loop, fade in on load, and respect the existing sound settings (mute/volume).

## Steps

1. **Source a royalty-free track** — Find a short (30-60s) looping noir/mafia-style instrumental track (e.g., from Pixabay, which offers free-to-use music with no attribution required). Download and place it at `public/audio/mafia-theme.mp3`.

2. **Create a `useBgMusic` hook** — A small hook that:
   - Creates an `<audio>` element with `loop` enabled
   - Fades in volume over ~2 seconds on mount
   - Reads the sound config from `useSoundSystem` to respect enabled/volume state (uses `uiVolume`)
   - Fades out and pauses on unmount (when game starts)
   - Handles browser autoplay restrictions (plays on first user click if blocked)

3. **Wire it into `FamilySelectionScreen`** — Call the hook at the top of the component. No UI changes needed; music plays automatically in the background.

4. **Add a small mute toggle** — A speaker icon in the corner of the family selection screen so users can quickly mute/unmute without needing the full settings dialog.

## Technical Details

- **File**: `public/audio/mafia-theme.mp3` (~500KB-1MB target)
- **New hook**: `src/hooks/useBgMusic.ts`
- **Modified**: `src/components/FamilySelectionScreen.tsx` (add hook call + mute button)
- Music stops when `onSelectFamily` is called (component unmounts)
- Volume tied to existing `soundConfig.uiVolume` and `soundConfig.enabled`

