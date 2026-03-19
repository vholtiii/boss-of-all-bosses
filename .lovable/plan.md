

## Phase-Locked Actions: Enforce What You Can Do in Each Phase

### Current Problem
All side-panel actions (Attack Territory, Plan Hit, Sabotage, Extort, Build Business, etc.) are always available regardless of turn phase. The hex grid partially enforces phases, but the side panel does not. This lets players take strategic actions during Deploy or Move, breaking the intended flow.

### Design

Each phase has a strict set of allowed interactions:

| Phase | Allowed Actions |
|-------|----------------|
| **Deploy** | Click HQ → select unit → place on adjacent hex. Nothing else. |
| **Move** | Select deployed unit → move it, **fortify**, **scout** adjacent hex, **escort** (capo carries soldiers). No combat, no economy. |
| **Action** | Hex-grid context menu: **Hit** (soldiers on enemy hex), **Extort** (soldiers on neutral hex), **Negotiate** (capo on enemy hex), **Establish safehouse** (unit on own territory). Side panel: **Plan Hit**, **Sabotage Rival**, **Extort Business**, **Build Business**, **Launder Money**, **Recruit**, **Train**, **Bribe**, **Hitman**, etc. |

### Changes

**1. `GameSidePanels.tsx` — Disable/hide actions outside the Action phase**
- Pass `turnPhase` into `LeftSidePanel`
- During `deploy` and `move` phases: collapse and disable all action sections (Strategic Actions, Economy, Defense & Law, Corruption, Hitmen). Show a banner: "Complete deployment/movement to unlock actions."
- During `action` phase: all sections enabled as they are now
- Add new action buttons for **Sabotage Rival** (on hex context menu — soldiers on enemy territory, different from Hit), **Establish Safehouse** (on hex context menu)

**2. `EnhancedMafiaHexGrid.tsx` — Add safehouse + sabotage to action context menu**
- Expand the action-phase context menu to include:
  - "🏠 Safehouse" — when player unit is on own territory (not HQ)
  - "💣 Sabotage" — when player soldiers are on enemy territory (alternative to Hit)
- Wire these to existing `processSafehouse` and a new sabotage handler

**3. `UltimateMafiaGame.tsx` — Pass `turnPhase` to side panels**
- Thread `turnPhase` through to `LeftSidePanel`

**4. `useEnhancedMafiaGameState.ts` — Add sabotage action handler**
- Create a hex-based sabotage action: soldiers on enemy hex can damage the business there (reduce income, increase heat) without full combat. Costs 1 soldier move, no territory flip.

### Files to Change

| File | What |
|------|------|
| `src/components/GameSidePanels.tsx` | Accept `turnPhase`, disable all action sections during deploy/move, show phase guidance |
| `src/components/EnhancedMafiaHexGrid.tsx` | Add Safehouse + Sabotage options to action-phase context menu |
| `src/pages/UltimateMafiaGame.tsx` | Pass `turnPhase` to side panels |
| `src/hooks/useEnhancedMafiaGameState.ts` | Add hex-based sabotage action handler |

