

# Auto-Close HQ Panel on Outside Click

## Change
Add a click-outside listener to `HeadquartersInfoPanel` using a `useRef` + `useEffect` with a `mousedown` event handler.

### File: `src/components/HeadquartersInfoPanel.tsx`
- Add a `ref` on the outer `motion.div` container
- Add a `useEffect` that listens for `mousedown` on `document`
- If the click target is outside the ref'd element, call `onClose()`
- Clean up the listener on unmount

This is a standard click-outside pattern — no other files need changes.

