

## Game Design Improvements Plan

Based on your feedback: **map readability** is the biggest pain point, **turn summaries** are the priority, and we should **keep current scope** without adding or removing features.

### 1. Turn Summary Modal

After each "End Turn," show a modal summarizing everything that happened:

- **Your Income**: breakdown of territory + business income earned
- **AI Actions**: for each rival family, list territories taken, units deployed, attacks on you, casualties
- **Events**: any random events that triggered
- **Resource Changes**: money/soldiers/respect delta from start to end of turn

Implementation: collect a `turnReport` object during `endTurn` processing in `useEnhancedMafiaGameState.ts`, store it in state, and render a dismiss-able modal in `UltimateMafiaGame.tsx`.

### 2. Map Readability Improvements

**Hex territory coloring**: Replace the current subtle coloring with distinct, saturated fills per family so you can instantly see who controls what:
- Player (Gambino): cyan/teal fill
- Genovese: green fill  
- Lucchese: blue fill
- Bonanno: red fill
- Colombo: purple fill
- Neutral: dark gray

**Add hex border glow** for player-controlled hexes (gold outer stroke).

**Territory name inside each hex**: Show a short 2-3 letter label (district abbreviation) in small text so hexes aren't just colored blobs.

**Unit count badge**: Instead of tiny icons that are hard to read, show a small colored circle with the soldier count number on each hex.

### 3. Phase Indicator Banner

Add a persistent top bar showing:
- Current phase name in large text: "DEPLOY PHASE", "MOVE PHASE", "ACTION PHASE"
- A one-line hint: "Click your HQ to deploy units" / "Select a unit then click a hex to move" / "Use side panels to take actions"
- Phase transition uses a brief color flash to draw attention

This replaces the current bottom-bar status text which is easy to miss.

### 4. Income Visibility on Map

Always show income values on hexes that have businesses (not just on hover). Use a small `$XXX` label below the business icon. This makes it immediately clear which hexes are worth fighting for.

---

### Technical Details

**Files to modify:**
- `src/hooks/useEnhancedMafiaGameState.ts` — add `turnReport` to state, populate it during `endTurn` with AI action logs and income summary
- `src/components/EnhancedMafiaHexGrid.tsx` — increase hex fill opacity, add always-visible income labels, add unit count badges, add district abbreviation labels
- `src/pages/UltimateMafiaGame.tsx` — add turn summary modal component, add phase indicator banner at top
- New file: `src/components/TurnSummaryModal.tsx` — modal showing turn report

**State changes:**
- New `turnReport` field on `EnhancedMafiaGameState` with structure: `{ income: number, aiActions: Array<{family, action, detail}>, events: string[], resourceDeltas: {money, soldiers, respect} }`
- AI `processAITurn` pushes entries into `turnReport.aiActions` as it processes each family

