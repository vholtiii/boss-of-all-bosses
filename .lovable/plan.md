

# Add Phase Progress Tooltip to HUD Banner

## What
Wrap the "Phase X: Name" line in the top HUD banner with a Tooltip that shows a breakdown of requirements for the **next** phase, with current progress vs targets. If already at Phase 4, show "Max phase reached."

## Implementation

### File: `src/pages/UltimateMafiaGame.tsx`

1. Import `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider` from `@/components/ui/tooltip`

2. Compute next-phase progress data near line 836:
   - Get `nextPhaseConfig = PHASE_CONFIGS[gp]` (if `gp < 4`)
   - Calculate current values: player hex count, turn, respect, capo count, built business count, income — all from `gameState`
   - Build an array of requirement rows with `{label, current, target, met}` for each requirement in the next phase config

3. Wrap the Phase line (line 870-872) in a Tooltip:
   - Trigger: the existing `<span>` showing phase icon/number/name
   - Content: a compact panel listing each next-phase requirement with green checkmarks or red X indicators, plus "Unlocks: ..." list

### UI Design
```text
┌─────────────────────────────┐
│ Next: Phase 2 — Establishing│
│ Territory                   │
│                             │
│ ✅ Turn 9+     (current: 12)│
│ ❌ 8+ hexes    (current: 5) │
│ ✅ 20+ respect (current: 25)│
│                             │
│ Unlocks: Scouting, Plan Hits│
│ Capo Promotion, Safehouses  │
└─────────────────────────────┘
```

For Phase 4's OR-condition, show all three paths with indicators.

### Files Modified
- `src/pages/UltimateMafiaGame.tsx` — tooltip around phase line (~20 lines added)

