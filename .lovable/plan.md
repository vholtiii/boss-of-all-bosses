

# Add "Marked for Death" Timer to Deployed Units List

## Change

**File: `src/components/HeadquartersInfoPanel.tsx` (~line 522-524)**

After the loyalty badge for each soldier, add a conditional ☠️ timer badge when `soldierStats[unit.id].markedForDeath` is true:

```tsx
{ss.markedForDeath && ss.markedTurnsRemaining > 0 && (
  <span className="text-[9px] px-1 rounded mt-0.5 bg-red-900/30 text-red-400 animate-pulse">
    ☠️ {ss.markedTurnsRemaining}t
  </span>
)}
```

This displays a pulsing red badge like "☠️ 3t" next to the loyalty indicator, showing how many turns remain before the mark expires. One small addition, one file.

