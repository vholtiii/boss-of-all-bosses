# Fix unit information stacking above hex information

## Goal
Ensure the selected soldier/capo dossier is consistently readable above the hex details panel, without obscuring either panel or changing game behavior.

## Changes
1. **Create a shared bottom-left information stack in the map layer**
   - Replace the two independently positioned bottom-left panels with one layout anchor.
   - Render `SelectedUnitDock` first so it naturally occupies the upper position.
   - Render the selected/hovered hex information beneath it with a consistent gap.

2. **Remove fragile positional coupling**
   - Stop relying on `--hex-card-h` and separate absolute `bottom` offsets to calculate the unit panel position.
   - Keep the existing animated entrance/exit behavior and selection interactions intact.

3. **Preserve nearby map controls**
   - Check the Map Key placement against the new stack and offset it only if needed so it does not cover the information panels.
   - Keep the layout usable at narrower widths by constraining the stack width and allowing content to wrap.

4. **Validate the visible states**
   - Verify with no selected unit, selected soldier, selected capo, and a long hex-information state.
   - Confirm the unit details remain above the hex card, both remain clickable, and no console/type errors are introduced.

## Technical details
- Primary implementation target: `src/components/EnhancedMafiaHexGrid.tsx` and the positioning classes in `src/components/SelectedUnitDock.tsx`.
- Use the existing design tokens and component patterns; no new gameplay state, persistence, or backend work.
- Maintain the current animation and z-index hierarchy while making the vertical relationship explicit.