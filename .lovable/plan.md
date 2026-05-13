## Fix notification placement

1. Move the notification positioning source into the shared page scope.
   - Put the sidebar-width/top-bar values on a higher-level wrapper that also contains the notification layer, or pass the live right-sidebar width directly to the notification container.
   - This removes the current CSS variable fallback to `0px`, which is why the toast is still rendering over the right panel.

2. Re-anchor desktop notifications to the map gutter.
   - Keep the container fixed below the top bar.
   - Offset it from the viewport right edge by the actual right sidebar width plus a small gutter.
   - Preserve the current mobile fallback so small screens still use the simpler top-right placement.

3. Validate against the current sidebar layout.
   - Check that notifications slide in from the right edge of the gray gutter, not on top of the right panel.
   - Confirm they continue to stay clear of the hex board while the right sidebar is resized.

## Technical details

- Current issue: `NotificationProvider` is mounted outside `ResponsiveLayout`, but the CSS vars `--right-sidebar-width` and `--top-bar-height` are defined inside `ResponsiveLayout`. The notification container therefore cannot inherit them and computes `right: calc(0px + 0.5rem)`.
- Likely implementation: either hoist the CSS vars to `UltimateMafiaGame`/`GameContent` scope or stop depending on inherited vars and pass `rightWidth` into the notification system explicitly.
- Files to update:
  - `src/pages/UltimateMafiaGame.tsx`
  - `src/components/ResponsiveLayout.tsx`
  - `src/components/ui/notification-system.tsx`