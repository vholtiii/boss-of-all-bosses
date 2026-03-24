

# Hide AI Safehouse Actions from Turn Summary Without Intel

## Problem
Even with the fog-of-war gate, the turn summary still shows "Expanded operations in an unknown area" when AI builds a safehouse. This tells the player that a safehouse was built — information they shouldn't have without scouting or a police bribe.

## Fix — `src/hooks/useEnhancedMafiaGameState.ts` (line ~2838-2845)

When `hasIntel` is false, **don't push anything** to `turnReport.aiActions` instead of pushing the vague "Expanded operations" message. Only report the safehouse action when the player actually has intel on that hex.

```
if (turnReport) {
  const hasIntel = state.scoutedHexes.some(...) || 
    (state.activeBribes || []).some(b => b.tier === 'police_captain' || b.tier === 'police_chief');
  if (hasIntel) {
    turnReport.aiActions.push({ family: fam, action: 'safehouse', detail: `Established a safehouse in ${bestHex.district}` });
  }
  // else: no report at all — player doesn't know it happened
}
```

Also apply the same treatment to AI recruitment (line ~2417-2421): when there's no intel, don't push "Bolstered their forces" either — just stay silent.

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — remove vague fallback messages, only report AI actions when player has intel

