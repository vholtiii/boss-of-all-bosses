

# Rename Turn Steps to Avoid "Phase" Collision

## Problem
The word "phase" is used for both turn steps (Deploy, Tactical, Action) and game stages (Making Your Bones, etc.), creating confusion. Game stages should own the word "Phase"; turn steps need a different label.

## Approach
Rename the three turn steps from "phases" to **"steps"** throughout the UI. The internal `turnPhase` state variable stays unchanged to avoid a massive refactor -- only user-facing labels change.

### UI Label Changes

| Current | New |
|---------|-----|
| `DEPLOY` phase | `📦 DEPLOY STEP` |
| `TACTICAL PHASE` | `📋 TACTICAL STEP` |
| `ACTION PHASE` | `⚔️ ACTION STEP` |
| `END TURN` phase | `⏳ END TURN` (unchanged) |
| Phase indicator pill strip: `deploy / tactical / action` | `deploy / tactical / action` (keep short, remove "phase" context) |
| Button: "Next Phase" | "End Turn" |
| Button: "End Deploy" / "End Tactical" | "Next Step" |
| Button: "Skip to Action" | "Skip to Action" (unchanged) |
| "Available during Action phase" tooltips | "Available during Action step" |
| Banner sub-line: "Phase 1: Making Your Bones" | "🔫 Phase 1: Making Your Bones" (keep -- this IS a phase) |

### Files Modified

**`src/pages/UltimateMafiaGame.tsx`** (~5 spots)
- Line 839-842: Rename `phaseConfig` labels from `DEPLOY` / `TACTICAL PHASE` / `ACTION PHASE` to `DEPLOY STEP` / `TACTICAL STEP` / `ACTION STEP`
- Line 596: Pill strip labels (already short, keep as-is)
- Line 609: Button text "Next Phase" → "End Turn", "End Tactical" → "Next Step"

**`src/components/HeadquartersInfoPanel.tsx`** (~6 spots)
- Lines 665, 703, 825: "Available during Action phase" → "Available during Action step"

**`src/components/GameSidePanels.tsx`** (~2 spots)
- Any "Action phase" references in tooltips → "Action step"

### Not Changed
- `turnPhase` state variable name (internal, not user-facing)
- Game stage "Phase 1/2/3/4" labels (these correctly use "Phase")
- Phase-locked tooltips like "Unlocks in Phase 2" (correct usage)

