

# Phase Progression Infographic

## Summary
Create a new `PhaseInfographic` component that shows all 4 game phases as a visual timeline/roadmap, highlighting the player's current phase and each rival family's phase, with progress bars toward the next phase.

## What It Looks Like
- A horizontal 4-stage timeline (Phase 1 through 4) with icons and names
- The player's current phase is highlighted with a glowing border; completed phases are filled, future phases are dimmed
- Below the timeline: a "Requirements for Next Phase" checklist with progress bars for each metric (hexes, respect, capos, businesses, turns)
- Below that: a compact row showing each rival family's current phase as a badge, so the player can see who's ahead/behind

## Where It Lives
- New component: `src/components/PhaseInfographic.tsx`
- Placed in the **Right Side Panel** (`GameSidePanels.tsx`) as a new collapsible section called "Phase Progression" between Territory Control and Events
- Also accessible via the existing phase tooltip at the bottom banner (optional enhancement)

## Technical Details

### New File: `src/components/PhaseInfographic.tsx`
- Accepts: `gamePhase`, `turn`, `hexMap`, `resources`, `units`, `aiOpponents`, `playerFamily`, `familyBonuses`
- Renders the 4-phase timeline using `PHASE_CONFIGS` data
- For the player: computes current metrics vs next phase requirements (reuses the same logic as `phaseProgressRows` in `UltimateMafiaGame.tsx`)
- For AI rivals: reads `cachedPhase` from each opponent's resources to show their phase
- Progress bars use the existing `<Progress>` component
- Phase nodes use colored circles/badges: green (completed), amber/glowing (current), gray (locked)

### Modified File: `src/components/GameSidePanels.tsx`
- Import `PhaseInfographic`
- Add it as a collapsible section in `RightSidePanel`, positioned above "Rival Families"
- Pass through the relevant game state props

### Data Flow
- Player phase: `gameState.gamePhase || 1`
- AI phases: `opponent.resources.cachedPhase || 1` (already tracked per AI family)
- Requirements: computed from `PHASE_CONFIGS` and current game state metrics (hexes, respect, capos, businesses, income)
- No new state or hooks needed — all data already exists

## Visual Design
```text
┌─────────────────────────────────────┐
│  PHASE PROGRESSION                  │
│                                     │
│  [1]────[2]────[3]────[4]           │
│  ●══════●══════○──────○             │
│  Making  Estab.  Control  Boss      │
│  Bones   Terr.   Terr.   of All    │
│                                     │
│  Next: Phase 3 — Controlling Terr.  │
│  ┌─ Turn 18+      ✅ (turn 22)     │
│  ├─ 20+ hexes     ❌ 14/20         │
│  ├─ 2+ capos      ✅ (2)           │
│  └─ 1+ business   ❌ 0/1           │
│                                     │
│  Rival Phases:                      │
│  Genovese [2] Lucchese [1]          │
│  Colombo  [2] Bonanno  [1]          │
└─────────────────────────────────────┘
```

