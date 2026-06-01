## Why the select screen and transition feel laggy

Several full-viewport, continuously-animating layers are stacked on top of each other in `FamilySelectionScreen.tsx`. Each one is cheap in isolation; together they thrash the compositor every frame, especially at large viewports (you're at 2842×1213). The biggest offenders, in order of cost:

1. **Cinematic transition smoke puffs** (lines 1051–1075) — four 600–1000px `div`s with `filter: blur(40px)` + `mixBlendMode: screen`, animated from `scale 0.4 → 3.4`. Blur + blend-mode + large scale on the compositor is the single most expensive combo the browser can be asked to do. This is the main reason the transition stutters.

2. **Ken-Burns background** (lines 353–363) — a full-screen `backgroundImage` div animated on `scale` + `x` + `y` for 40s on infinite loop. Animating transforms on a background-image layer that big keeps a giant texture live in memory and forces continuous compositor work behind everything else.

3. **AtmosphericParticles canvas** (`src/components/AtmosphericParticles.tsx`) — clears and redraws a ~3.4 MP canvas 30×/sec with 50 particles × 2 `arc()` calls each (the glow pass). Also listens to `mousemove` globally. Cheap on a laptop screen, noticeable on this viewport.

4. **Grunge noise overlay with `mixBlendMode: overlay`** (lines 406–412) — promotes everything underneath into its own compositor layer for the lifetime of the screen.

5. **Infinite `filter: drop-shadow` pulses** on the selected difficulty card (lines 553–560), the selected family crest (line 800), and the spotlight cone. `filter` animations repaint on every frame and can't be GPU-accelerated cheaply.

6. **3D hover on family cards** (line 733: `rotateY`, `rotateX`, `scale`) inside a `perspective: 1200` container with `transformStyle: preserve-3d`. Combined with the `layoutId` shared-element animation on `selectedAccent` (line 764), every selection change triggers a layout-tween across the row.

7. **Multiple `backdrop-blur` layers** (difficulty cards, family cards, detail panel, mute button, seed controls) — backdrop-blur is recomputed whenever anything behind it moves, which the Ken-Burns + particles + noise are doing constantly.

8. **`AnimatePresence mode="wait"`** wrapping the seed confirmation row remounts on every keystroke into the seed input.

## Proposed fix (perf-only, visual intent preserved)

Goal: keep the noir atmosphere but cut per-frame compositor work by ~70%.

### Transition overlay (biggest win)
- Drop `filter: blur(40px)` on the smoke puffs; bake the blur into the radial-gradient itself (`radial-gradient(circle, rgba(180,170,160,0.35) 0%, transparent 60%)`) so no runtime blur is needed.
- Reduce smoke puffs from 4 → 2, and cap their max scale at ~2.2 instead of 3.4.
- Keep `mixBlendMode: screen` only on the remaining puffs (not the vignette/haze layers).
- Add `will-change: transform, opacity` to the zoom-in layer so it gets its own GPU layer up front instead of being promoted mid-animation.

### Ken-Burns background
- Replace the JS-driven `motion.div` keyframes with a CSS `@keyframes` animation on a plain `div` (Framer's per-frame ticking isn't needed for a 40s loop, and CSS animations stay on the compositor thread).
- Add `will-change: transform` and `transform: translateZ(0)` so it gets a dedicated layer.
- Pause the animation while `isTransitioning` is true (the user can't see it anyway).

### Particles
- Lower `PARTICLE_COUNT` from 50 → 25.
- Skip the glow pass (`p.opacity > 0.25` block) — it doubles draw calls for ~30% of particles for minor visual gain.
- Throttle `mousemove` with `requestAnimationFrame` coalescing (or drop the parallax entirely — at this viewport the effect is barely visible).
- Pause the rAF loop when `document.hidden` and during the cinematic transition.

### Reduce always-on filter/blur animations
- Remove the infinite `drop-shadow` pulse on the selected difficulty card and selected family crest; replace with a static `box-shadow`/`filter` so the layer isn't repainting forever.
- Remove `backdrop-blur-sm` from the difficulty cards and family cards (keep it only on the detail panel where it actually reads). Use a slightly more opaque `bg-card/90` to compensate.
- Replace the `mix-blend-mode: overlay` grunge layer with a static `background-image` on the root container — same visual, no blend-mode layer promotion.

### Family card hover
- Drop the 3D `rotateY`/`rotateX` from `whileHover` (keep `scale` + `y`). Removes the `perspective`/`preserve-3d` 3D context for the whole row.
- Keep the `layoutId="selectedAccent"` shared-element animation — it's cheap on a single small bar.

### Minor
- Memoize the `FamilyCrest` component with `React.memo` (it's rendered 5× on the row plus once in the detail panel).
- Wrap the seed `AnimatePresence` so the confirmation row doesn't remount on every keystroke (key on `!!seedInput` instead of the seed value).

### Out of scope
- No gameplay/logic changes.
- No copy or layout restructuring.
- Color tokens, typography, and the overall noir aesthetic stay identical.

### Files touched
- `src/components/FamilySelectionScreen.tsx` (transition overlay, Ken-Burns, hover, blur cleanup, AnimatePresence key)
- `src/components/AtmosphericParticles.tsx` (count, glow pass, mousemove throttle, visibility pause)
- `src/index.css` (one `@keyframes ken-burns` block)

### Verification
- Use `browser--performance_profile` before/after on the select screen and during a transition; expect long-task count and scripting time to drop sharply.
- Manual: confirm the transition still reads as "pull-back through smoke" and the background still drifts.
