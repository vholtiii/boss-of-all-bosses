## Cinematic family-confirm transition

When the user clicks **BEGIN AS THE [FAMILY] FAMILY**, play a ~2.5s cinematic sequence before the map appears, instead of the instant cut today.

### Sequence (timeline, ~2500ms total)

```
0ms     Click "BEGIN" → success SFX, button disabled, overlay mounts
0–800   Background table image zooms IN fast (scale 1.05 → 1.45) + slight darken
        Music begins fading out (0 → silence over 1200ms)
        Family color glow rises around vignette edges
600–1700 Camera pulls BACK through smoke: smoke layer rushes toward camera
        (large radial smoke gradient + drifting puffs scale 0.6 → 3, opacity 0 → 0.95)
        Background image continues to drift and desaturate
1500–2100 Brief "title beat": family crest emoji + name fades up at center,
        then fades out as smoke fully covers screen (full black-with-smoke)
2100–2500 Smoke holds opaque. onSelectFamily() fires at ~2200ms so the map
        mounts under the smoke. Smoke + overlay fade out → map revealed.
        Game ambience track fades in (0 → target over 1200ms) starting at 1500ms.
```

### Files to change

**`src/hooks/useBgMusic.ts`**
- Return a `fadeOut(durationMs)` function from the hook so callers can trigger a one-shot fade without mutating `soundConfig` (which would persist as a user setting).

**`src/components/FamilySelectionScreen.tsx`**
- Add `isTransitioning` state and a `pendingStart` ref holding the family payload.
- Replace the BEGIN button `onClick` with a handler that:
  1. plays `success` SFX
  2. sets `isTransitioning = true`
  3. calls `bgMusic.fadeOut(1200)`
  4. attempts to play `/audio/game-ambience.mp3` (new file, see below) at low volume; silently ignores if missing
  5. after 2200ms, calls `onSelectFamily(...)`
- Disable the BEGIN button + suppress keyboard nav while transitioning.
- Render a new `<AnimatePresence>` overlay (z-50, fixed inset-0, pointer-events-none after start) containing three layered motion divs driven by framer-motion:
  - **Zoom layer**: clones the same `mafiaSitdownBg` image, animates `scale` 1.05 → 1.45 over 800ms ease-out, then drifts to 1.6 over remaining time.
  - **Smoke layer**: a radial-gradient div (warm grey → transparent) plus 3–4 absolutely positioned blurred ellipses. Animate `scale` 0.6 → 3, `opacity` 0 → 0.95 over 1100ms (delay 600ms), holds, then fades to 0 over 400ms at the end.
  - **Title beat**: centered family color-tinted text (`THE [FAMILY] FAMILY`) using `font-playfair`, fade/scale-up between 1500–2100ms.
- Use the family's accent color for the smoke tint and title glow so it feels family-specific.

**`public/audio/`**
- Reference a new `/audio/game-ambience.mp3` (low rumble / city undertone) — load with graceful failure. Note to user that this asset is optional; if absent the visual + music fade still play correctly.

### Notes

- All animation uses `framer-motion` (already in use in this file), no new deps.
- Respects `prefers-reduced-motion`: if matched, skip the smoke/zoom and just do a 600ms black fade + music fade, then start.
- Music fade uses the new `fadeOut` from `useBgMusic` so it doesn't write back to user sound settings.
- Z-index: overlay is `z-[60]` to sit above all selection UI (corner ornaments are z-0 / content z-10).
