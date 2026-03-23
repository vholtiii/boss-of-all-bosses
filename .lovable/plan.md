

# Add Hover Tooltip for Disabled ActionButtons

## Problem
When an ActionButton is greyed out (disabled), the `disabledReason` text shows inline but can be hard to notice. The user wants a tooltip on hover explaining why the button is disabled.

## Fix — `src/components/GameSidePanels.tsx`

Wrap the `ActionButton`'s `<Button>` in a `<Tooltip>` from the existing UI tooltip components when the button is disabled and has a `disabledReason` (or is `phaseLocked`).

Since disabled buttons don't fire pointer events by default, wrap in a `<span>` to capture hover.

### Changes to `ActionButton` component (lines 729-747):

```tsx
const ActionButton: React.FC<{...}> = ({ icon, label, sublabel, disabled, phaseLocked, disabledReason, variant = 'outline', onClick }) => {
  const isDisabled = disabled || phaseLocked;
  const tooltipText = phaseLocked ? 'Available in a different phase' : disabledReason;

  const button = (
    <Button ...existing props...>
      ...existing content...
    </Button>
  );

  if (isDisabled && tooltipText) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="w-full block">
              {button}
            </span>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};
```

Add imports for `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip`.

## Files Modified
- `src/components/GameSidePanels.tsx` — add tooltip wrapper to ActionButton component

