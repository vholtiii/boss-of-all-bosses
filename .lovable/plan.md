## Heat Meter Overlay

Add a floating heat meter pinned to the top of the hex map. Shows current heat (0–100), the tier (cool/warm/hot/critical/RICO) matching existing AI heat tiers, the per-turn delta vs. last turn, and a 5-turn mini sparkline.

### What it shows

```
┌─────────────────────────────────────────┐
│ 🔥 HEAT  ▓▓▓▓▓▓▓▓░░░░  62 / 100  HOT   │
│           ▲ +7 this turn   ╱╲_╱╲       │
└─────────────────────────────────────────┘
```

- **Bar**: gradient/segment bar tinted by tier — emerald (cool <40), amber (warm 40–59), orange (hot 60–79), red (critical 80–89), pulsing dark-red (RICO 90+). Matches the existing tier breakpoints in `useEnhancedMafiaGameState.ts` and AI posture logic.
- **Delta chip**: `▲ +N` (red) or `▼ -N` (green) showing change from previous turn. Hidden on turn 1.
- **Sparkline**: tiny inline SVG plotting the last 5 turns of heat values.
- **Tier label** and tooltip explaining current effects (e.g. "Critical — RICO timer ticks every turn").

### Placement

Floating overlay anchored top-center of the hex map area (inside the map container, above the SVG, `pointer-events-auto` only on the chip itself so panning still works around it). Compact, ~280px wide, semi-transparent dark backdrop matching the noir aesthetic. Does not overlap the existing top status bar.

### Data source

- Current heat: `gameState.policeHeat.level` (already in state).
- History: add a small `heatHistory: number[]` (last ~8 values) maintained in `useEnhancedMafiaGameState.ts`. Pushed at end of each turn after heat is updated; trimmed to last 8. This is the only state addition.
- Delta: `current - heatHistory[heatHistory.length - 1]` from the prior turn snapshot.

### Files

- **New**: `src/components/HeatMeter.tsx` — presentational component (bar + delta + sparkline + tooltip).
- **Edit**: `src/hooks/useEnhancedMafiaGameState.ts` — add `heatHistory` to state init and append on turn end.
- **Edit**: `src/pages/UltimateMafiaGame.tsx` — mount `<HeatMeter heat={...} history={...} />` inside the map container, positioned absolutely at top-center (both desktop and mobile map tab).

### Out of scope

No changes to heat mechanics, costs, or reduction rules. Pure visualization plus a small history array.
