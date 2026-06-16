# Slice 7 — Audio / Art / Animation polish pass

Tightens what already exists. No new SFX library, no rebranded art direction, no new motion framework. Three small, parallel edits that make the existing surfaces feel more crafted.

## A. Audio polish — `src/hooks/useSoundSystem.ts`

The synth presets are flat sine/square blips with linear-attack/exp-decay envelopes. Three targeted improvements:

1. **Reuse one AudioContext + master gain node** instead of creating gain/oscillator chains directly on `destination`. Add a `masterGainRef` so future ducking is one line.
2. **Resume context on first user gesture.** Browsers suspend `AudioContext` until interaction; right now the first few clicks can silently fail. Wire a one-shot `pointerdown`/`keydown` listener that calls `audioContext.resume()`.
3. **Better envelopes for the 12 synth presets.** Replace the single-osc presets with small, hand-tuned voices:
   - `click` → very short square + 8ms decay (current is fine, just shorten)
   - `success` → two-osc perfect-fifth chime (sine 880 + sine 1320), 220ms
   - `error` → detuned saw pair, 350ms with slight pitch drop
   - `notification` → triangle 660 → 880 glide, 180ms
   - `combat` / `hit_success` / `hit_fail` → low square + noise burst (use a short BufferSource of white noise) — gives actual impact
   - `money` → sine 1200 + sine 1800 stacked, 180ms
   - `danger` → saw with LFO-style pitch wobble via `setValueCurveAtTime`
   No new sound files. Keep the same trigger names so all 43 existing call sites are untouched.
4. **Soft clip the master gain** at 0.8 so layered triggers don't pop.

Out of scope: new mp3s, music layers, per-event mixing UI.

## B. Art polish — crests, unit icons, hex tile chrome

No new asset generation. Refinements to existing SVG/CSS:

1. **`src/components/FamilyCrest.tsx`** (if present, otherwise wherever crests render): add a subtle inner stroke + drop-shadow filter so crests read as embossed instead of flat. One `<filter>` def reused per crest.
2. **`src/components/SoldierIcon.tsx` / `CapoIcon.tsx`**: tighten the badge contrast — current badges are semi-transparent over the figure and get muddy on dark hexes. Switch to a solid pill with 1px family-color outline; hide badges entirely when the unit is the only one on its hex (memory rule already says so — verify it's still honoured).
3. **`src/components/EnhancedMafiaHexGrid.tsx`**: add a 1px inner highlight stroke on owned hexes (lighter family color at 30% alpha, inset 2px) so they feel beveled rather than flat-filled. Pure SVG, no new geometry.

Out of scope: regenerating crest art, new unit illustrations, new hex textures, district background art.

## C. Animation polish — modal/panel motion timing

Across the framer-motion call sites, durations and easings are inconsistent (some 0.2s linear, some 0.4s spring, some no exit). Standardize without changing what animates:

1. **Add `src/lib/motion-presets.ts`** exporting 4 reusable variants:
   - `fadeIn` (opacity 0→1, 180ms ease-out)
   - `popIn` (opacity + scale 0.96→1, 200ms ease-out)
   - `slideUp` (y+8→0 + opacity, 220ms ease-out)
   - `panelSlide` (x±16→0 + opacity, 240ms ease-out)
   Each includes matching `exit`.
2. **Apply the presets** in the 5 most-visible surfaces (no behavior changes, just swap inline `initial/animate/exit` objects):
   - `TurnSummaryModal.tsx` (popIn for the modal, fadeIn for tab content)
   - `notification-system.tsx` (slideUp for toasts — currently mixes spring + tween)
   - `SelectedUnitDock.tsx` (slideUp)
   - `GameSidePanels.tsx` (panelSlide on sidebar reveal)
   - `HeadquartersInfoPanel.tsx` (popIn)
3. **Standardize hex-flash timing** in `EnhancedMafiaHexGrid.tsx` combat overlays to 400ms ease-out (currently varies). Keeps the existing flash colors and shapes.

Out of scope: new animations on elements that don't currently animate, scroll-linked effects, page transitions, GSAP/Lottie.

## Files touched
- `src/hooks/useSoundSystem.ts`
- `src/components/SoldierIcon.tsx`
- `src/components/CapoIcon.tsx`
- `src/components/EnhancedMafiaHexGrid.tsx`
- `src/components/FamilyCrest.tsx` (if it exists; otherwise crest render site)
- `src/lib/motion-presets.ts` (new)
- `src/components/TurnSummaryModal.tsx`
- `src/components/ui/notification-system.tsx`
- `src/components/SelectedUnitDock.tsx`
- `src/components/GameSidePanels.tsx`
- `src/components/HeadquartersInfoPanel.tsx`

Say **implement** to ship it, or call out any of A/B/C you want dropped or expanded.