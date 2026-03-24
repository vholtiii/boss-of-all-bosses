

# Hide Rival Safehouse Intel from Turn Summary

## Problem
Line 2732 pushes `"Established a safehouse in ${bestHex.district}"` to `turnReport.aiActions`, which the Turn Summary modal displays openly. This reveals rival safehouse locations for free — intel that should only come from scouting or police bribes.

## Solution
**Gate the safehouse AI action** behind fog-of-war: only include it in `turnReport.aiActions` if the player has intel on that hex (scouted or has an active police bribe revealing that family).

### Change — `src/hooks/useEnhancedMafiaGameState.ts` (line ~2732)

Before pushing the safehouse action to `turnReport.aiActions`, check:
1. Does the player have an active scouted hex at those coordinates? (`state.scoutedHexes.some(...)`)
2. Does the player have an active Police Captain bribe? (`state.activeBribes.some(b => b.target includes the family)`)

If neither condition is met, either skip the push entirely or replace the detail with a vague message like `"Expanded operations"` — so the player knows the family did *something* but not what.

```
// Replace direct push with:
const hasIntel = state.scoutedHexes.some(s => s.q === bestHex.q && s.r === bestHex.r && s.s === bestHex.s) ||
  state.activeBribes.some(b => b.target === 'police_captain');

if (turnReport) {
  if (hasIntel) {
    turnReport.aiActions.push({ family: fam, action: 'safehouse', detail: `Established a safehouse in ${bestHex.district}` });
  } else {
    turnReport.aiActions.push({ family: fam, action: 'unknown', detail: 'Expanded operations in an unknown area' });
  }
}
```

### Also gate AI recruitment numbers (line ~2317)
The detail `"Recruited 3 soldier(s)"` also leaks exact troop counts. Apply the same intel check — without intel, show `"Bolstered their forces"` instead of exact numbers.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — gate safehouse and recruitment details behind fog-of-war checks

