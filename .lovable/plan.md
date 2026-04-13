

# Replace Menu Music With a Mafia-Themed Royalty-Free Track

## Summary

Replace the current `mafia-theme.mp3` with a more authentic, dark, cinematic mafia-style track. Since you've chosen to provide a royalty-free MP3, the code changes are minimal — just a file swap.

## What You Need To Do

Provide or upload a royalty-free MP3 file that has the mafia atmosphere you want (e.g., dark orchestral, Godfather-style, Italian mandolin, tense strings, or cinematic noir). Good free sources:

- **Pixabay Music** (pixabay.com/music) — search "mafia", "godfather", "italian crime"
- **Free Music Archive** (freemusicarchive.org) — search "noir", "crime jazz"
- **Mixkit** (mixkit.co/free-stock-music) — search "cinematic dark"

## Implementation

Once you upload the MP3 file:

1. **Replace** `public/audio/mafia-theme.mp3` with the new file (same filename so no code changes needed)
2. If the file has a different name, update the single reference in `src/components/FamilySelectionScreen.tsx` line 136

That's it — the existing `useBgMusic` hook handles looping, fade-in/out, and volume control automatically.

