## Smoother family zoom-in transition

The stutter in the zoom comes from animating `filter: saturate/brightness` on a full-screen background image together with a 4-stop non-linear scale keyframe. `filter` repaints the entire image layer on every frame and can't be GPU-composited the way pure `transform`/`opacity` can — so even after the earlier perf pass, the image still hitches as it grows.

### Changes (visual intent preserved)

In `src/components/FamilySelectionScreen.tsx`, inside the `isTransitioning` overlay (the "Zoom-in layer" block, ~lines 999–1019):

1. **Pure transform tween instead of filter+scale keyframes.**
   Replace the 4-stop `scale: [1.05, 1.18, 1.42, 1.6]` + `filter: [...]` keyframe with a single tween:
   - `initial={{ scale: 1.05 }}`, `animate={{ scale: 1.55 }}`
   - `transition={{ duration: 3.0, ease: [0.22, 0.61, 0.36, 1] }}`
   - Static `filter: 'saturate(0.85) brightness(0.9)'` on the element (no animation).
   - Keep `willChange: 'transform'` and add `transformOrigin: '50% 55%'` so the camera pushes toward the sitdown table rather than the geometric center.

2. **Darkening via a cheap opacity overlay.**
   Add a new sibling `motion.div` that's solid black, animating `opacity: 0 → 0.55` over the same 3s with linear easing. This reproduces the "fading to dark" feel that the old `brightness()` keyframes provided, but composites on the GPU instead of repainting the image each frame.

3. **Simplify the family-tinted vignette.**
   The current `opacity: [0, 0.9, 0.6]` 3-stop creates a visible "pop" mid-transition. Replace with a single `0 → 0.8` ease-out tween over 2.4s; less work and reads as a smoother glow ramp.

4. **Stagger smoke puffs a touch later** so they bloom after the image is already moving (delays `0.95` and `1.15`). Removes the visible "everything starts at once" frame spike around the 800ms mark.

5. **Reduced-motion path** stays as-is (already a simple fade-to-black).

### Out of scope
- No changes to the select-screen idle state, particles, Ken-Burns, or gameplay.
- Total duration stays ~3s so audio/`setTimeout` alignment in `beginGame` is unchanged.

### Verification
- Trigger a few transitions across different families and confirm the camera push reads as one continuous glide.
- Use `browser--performance_profile` during the transition; expect the scripting/long-task spikes around the mid-zoom point to disappear since `filter` is no longer animated.

### Files touched
- `src/components/FamilySelectionScreen.tsx` (one block, ~25 lines)
