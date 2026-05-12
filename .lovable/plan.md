Smooth out the cinematic zoom-in on family confirm so it feels less jarring.

### Changes in `src/components/FamilySelectionScreen.tsx` (transition overlay)

**Total duration:** 2.2s → **3.0s** (still in the "medium" range you picked, just a touch more breathing room).

**Zoom layer (the table push-in)**
- Easing: `easeInOut` → custom cubic bezier `[0.22, 0.61, 0.36, 1]` (a slow-out ease that starts gentle and decelerates).
- Scale curve: `1.05 → 1.45 → 1.6` over `[0, 0.45, 1]` → softer ramp `1.05 → 1.18 → 1.42 → 1.6` over `[0, 0.35, 0.75, 1]` so the early push is gradual and the big rush only happens mid-way.
- Brightness/saturate curve smoothed to match (no hard mid-point step).

**Smoke puffs**
- Push their delays back ~200ms (0.5/0.65/0.4/0.8 → 0.85/1.0/0.75/1.15) so smoke doesn't start eating the frame while the zoom is still settling.
- Duration 1.6s → 1.8s, ease `easeOut` → `[0.33, 1, 0.68, 1]` for a softer arrival.

**Vignette glow**
- Slow the opacity ramp (`[0, 0.4, 1]` over 2.2s → `[0, 0.5, 1]` over 3.0s) so the family-color halo creeps in instead of popping.

**Dense haze cap**
- Shift its opaque hold later (`[0, 0.55, 1]` → `[0, 0.7, 1]`) so the screen doesn't go dark before the title beat lands.

**Title beat**
- Re-time to fit the new 3.0s window: appears around 1.9s, holds, fades by 2.85s.

**Handoff**
- `setTimeout` to call `onSelectFamily` bumped from 2200ms → **2950ms** so the map mounts under the fully covered smoke (no visible cut).

No changes to the music fade, ambience crossfade, reduced-motion fallback, or any other component.
