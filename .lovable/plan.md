# Subtle Idle Animations for Units

Add gentle, board-game-piece-style breathing motion to Soldier and Capo portraits so they read as "alive" without distracting from gameplay.

## Animation design

**Soldier — "breathing"**
- Vertical bob: `y` translate ±0.6px, 3.2s loop, `easeInOut`
- Subtle scale: 1.00 → 1.015 → 1.00 synced to bob
- Idle only — animation pauses while `selected` (the gold pulse ring already provides motion) and while the parent `motion.g` is in its hover/tap states (those scale transforms take priority via framer-motion).

**Capo — "presence"**
- Same bob but slightly slower (3.8s) and slightly larger (±0.8px, scale to 1.02) so a Capo reads as the heavier, more deliberate piece.
- Cigar-smoke nod: every loop adds a near-imperceptible 0.4° rotation tilt at the top of the bob — only on Capos, reinforces the "boss" silhouette.

**Per-unit phase offset (critical so a stack doesn't pulse in lockstep)**
- Derive a deterministic 0–1 offset from a stable id: for soldiers use `${family}-${x}-${y}` hash; for capos use `name`. Multiply by the loop duration and pass as a negative `delay` so each unit starts at a different point in the cycle.

**Wounded capo override**
- When `wounded`, swap to a slower 5s loop with no scale change (just a tiny droop: y +1px held longer than -1px). Sells "hurt" without a new asset.

## Implementation

Wrap the existing `<image>` element inside a nested `motion.g` that owns the idle loop. The outer `motion.g` keeps owning entry/selection/hover/tap. This avoids fighting framer-motion's animate prop on the outer group.

```tsx
<motion.g
  animate={selected ? {} : { y: [0, -0.6, 0], scale: [1, 1.015, 1] }}
  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: -phaseOffset }}
  style={{ transformOrigin: `${x}px ${y}px`, transformBox: "fill-box" }}
>
  <image ... />
</motion.g>
```

`transformOrigin` anchored at the figure's feet keeps the bob looking like the unit is shifting weight, not floating.

## Files

- `src/components/SoldierIcon.tsx` — wrap `<image>` in idle `motion.g`, add hash helper.
- `src/components/CapoIcon.tsx` — same wrap with Capo timings + wounded variant.

No new assets, no game logic, no other components touched.

## Performance

- Pure CSS transforms via framer-motion (GPU-accelerated).
- `repeat: Infinity` with `ease: "easeInOut"` — framer-motion uses `requestAnimationFrame`, pauses when tab is hidden.
- Per-unit phase offset is computed once per render from props, no state.
- At typical map sizes (≤40 units visible) this is negligible. If profiling later shows cost, the easy escape hatch is to disable idle when map zoom < 0.5 — not doing it preemptively.

## Out of scope

- Walk animations between hexes (movement tween is separate work)
- Combat hit-reaction shakes (already exist as flash effects)
- HQ icon, scout/intel overlays
