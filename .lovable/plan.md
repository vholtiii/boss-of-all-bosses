

# Remove Non-Functional Side Panel Buttons

## Change — `src/components/GameSidePanels.tsx` (lines 560-579)

Replace the two broken buttons with a hint:

**Before:** Two `<Button>` elements (Take Over, Extort) that silently fail due to missing hex coordinates.

**After:**
```tsx
<div className="mt-3 px-2 py-2 rounded bg-muted/30 text-center">
  <p className="text-xs text-muted-foreground italic">
    💡 Select a unit, then click a hex for actions
  </p>
</div>
```

## Files Modified
- `src/components/GameSidePanels.tsx`

