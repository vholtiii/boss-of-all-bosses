

# Generate Richer Mafia-Style Background Music with ffmpeg

## Problem
The current `mafia-theme.mp3` is a basic ambient drone that's barely audible and doesn't feel like mafia music. The user wants something with more character -- dark, moody, mafia-noir vibes.

## Solution
Use ffmpeg to synthesize a richer 30-second looping track that layers multiple elements:
- **Deep bass line** with a walking pattern (classic noir jazz feel)
- **Minor-key melody tones** using sine/triangle waves at jazz intervals
- **Subtle rhythm** via filtered noise pulses (brushed snare feel)
- **Dark pad/atmosphere** underneath everything
- **Tremolo and filtering** for moodiness

The result gets mixed down and normalized to a proper volume level, replacing the existing `public/audio/mafia-theme.mp3`.

## Steps

1. **Generate the track** using a multi-layer ffmpeg command that creates and mixes:
   - Walking bass (E2-A2-D3 pattern via sine waves with tremolo)
   - Minor-key melody notes (sparse, jazzy intervals)
   - Filtered pink noise for rhythm texture
   - Low drone pad for atmosphere
   - Normalize to -14 LUFS for consistent loudness

2. **Replace** `public/audio/mafia-theme.mp3` with the new file

3. **No code changes needed** -- the existing `useBgMusic` hook and `FamilySelectionScreen` already handle playback, looping, fading, and mute toggle

## File Modified
- `public/audio/mafia-theme.mp3` (replaced with richer track)

