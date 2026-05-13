## Goal

Move the stack of in-game notifications (currently fixed to the viewport's top-right, where they overlap the right sidebar) so they slide in from the right edge of the map area into the gray gutter between the map and the right sidebar — never touching the hexes.

## Where the bug lives

- `src/components/ui/notification-system.tsx` (line 131) hard-codes the container as:
  ```
  fixed top-4 right-4 z-50 space-y-2
  ```
  That puts it on top of the resizable right sidebar (260–500px wide).

- `src/components/ResponsiveLayout.tsx` controls the right sidebar width (`rightWidth` state, line 170). That width is local to the component and not exposed anywhere the notification container can read.

## Plan

### 1. Expose layout dimensions as CSS vars

In `src/components/ResponsiveLayout.tsx`, on the root desktop wrapper (`<div className="min-h-screen ...">`, line 109), add an inline style that publishes:

- `--right-sidebar-width: ${rightWidth}px`
- `--top-bar-height: 4rem`  (the top bar is `h-16`)

Mobile branch can set both to `0px` so notifications fall back to the normal top-right.

### 2. Re-anchor the notification container

In `src/components/ui/notification-system.tsx`, change the container (line 131) from a viewport-fixed top-right stack to one anchored just inside the right edge of the map area:

```tsx
<div
  className="fixed z-50 flex flex-col items-end gap-2 pointer-events-none w-[320px] max-w-[90vw]"
  style={{
    top: 'calc(var(--top-bar-height, 1rem) + 0.75rem)',
    right: 'calc(var(--right-sidebar-width, 0px) + 0.5rem)',
  }}
>
```

- Sits in the thin gutter just left of the right sidebar, below the top bar.
- 320px wide and right-aligned so cards float against the sidebar's left edge — they spill into the gray padding around the map but don't reach the hexes (the map is centered with `p-4` and the hex grid is auto-centered on HQ).
- `pointer-events-none` on the wrapper plus `pointer-events-auto` on each card keeps clicks on hexes working through empty gaps. (Add `pointer-events-auto` to the existing `NotificationItem` motion.div.)

### 3. Keep the slide-from-right animation

`NotificationItem` already animates `x: 100 → 0`. With the new anchor that reads as the toast sliding out from under the right sidebar into the gutter — exactly what was requested. No animation rewrite needed.

### 4. Verify

- Resize the right sidebar from 260px → 500px and confirm the toast stack tracks the sidebar's left edge.
- Trigger a notification (e.g. end a turn) and confirm the card never overlaps a hex; if a hex is unusually close to the gutter at narrow viewports, the 320px width still keeps the card right-aligned in the gutter.
- Mobile: container falls back to `top: ~1rem; right: 0.5rem`, matching today's behavior.

## Files touched

- `src/components/ResponsiveLayout.tsx` — publish `--right-sidebar-width` and `--top-bar-height` CSS vars on desktop and mobile roots.
- `src/components/ui/notification-system.tsx` — swap the container's positioning classes for the gutter-anchored style; add `pointer-events-none/auto`.

No gameplay logic, no notification content, no other components affected.
