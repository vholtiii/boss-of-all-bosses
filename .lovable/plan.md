

# Make HQ Panel Draggable

## Change

Add drag functionality to the `HeadquartersInfoPanel` so users can click and drag it to reposition it anywhere on screen.

## Implementation

**File: `src/components/HeadquartersInfoPanel.tsx`**

The panel already uses `motion.div` from framer-motion. Framer-motion has built-in drag support via the `drag` prop.

- Add `drag` prop to the outer `motion.div` (line 219)
- Add `dragMomentum={false}` so it stops where you release
- Add `dragConstraints` to keep it within the viewport
- Add a `cursor: grab` style to the card header to indicate draggability
- Modify the click-outside handler to ignore drag events (prevent closing when dragging)

Key changes:
```tsx
// On the motion.div (line 219-225):
<motion.div
  ref={panelRef}
  drag
  dragMomentum={false}
  dragConstraints={{ left: -window.innerWidth + 320, right: 0, top: 0, bottom: window.innerHeight - 200 }}
  initial={{ opacity: 0, x: 80 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: 80 }}
  transition={{ type: 'tween', duration: 0.25 }}
  className="fixed top-4 right-4 z-40 w-80 max-h-[calc(100vh-2rem)] overflow-y-auto"
  style={{ cursor: 'grab' }}
  whileDrag={{ cursor: 'grabbing' }}
>
```

Also update the click-outside listener to track whether a drag just occurred, so dragging doesn't accidentally close the panel.

