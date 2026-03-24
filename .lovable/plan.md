

# Dead Code Analysis

## Findings

The main game runs at `/` using `UltimateMafiaGame.tsx` with `useEnhancedMafiaGameState`. There are two legacy game versions (`/classic` and `/enhanced`) that are still routed but use an entirely separate, outdated state system. This creates a large tree of dead/orphaned code.

### Category 1: Legacy Pages & Their Exclusive Dependencies (largest impact)

These files are only used by the old `/classic` and `/enhanced` routes — not the main game:

| File | Used By | Status |
|------|---------|--------|
| `src/pages/Index.tsx` | `/classic` route only | Dead |
| `src/pages/EnhancedIndex.tsx` | `/enhanced` route only | Dead |
| `src/hooks/useMafiaGameState.ts` (817 lines) | Index + EnhancedIndex only | Dead — entirely separate state system |
| `src/components/MafiaHexGrid.tsx` | Index only | Dead — replaced by `EnhancedMafiaHexGrid` |
| `src/components/MafiaHud.tsx` | Index + EnhancedIndex only | Dead |
| `src/components/BusinessManagement.tsx` | MafiaHud only | Dead |
| `src/components/LegalSystem.tsx` | MafiaHud only | Dead |
| `src/components/PoliceSystem.tsx` | MafiaHud only | Dead |
| `src/components/ReputationPanel.tsx` | Index + EnhancedIndex only | Dead |
| `src/components/IntelligencePanel.tsx` | Index + EnhancedIndex only | Dead |

### Category 2: Standalone Unused Systems

| File | Status |
|------|--------|
| `src/systems/SoldierRecruitmentSystem.ts` | Never imported anywhere — entire class is dead |
| `src/components/CombatInterface.tsx` | Never imported anywhere |
| `src/components/SoldierRecruitmentInterface.tsx` | Never imported anywhere |
| `src/components/EnhancedGameMechanics.tsx` | Never imported anywhere |

### Category 3: Unused Types (partial)

Many types in `src/types/enhanced-mechanics.ts` (Mission, WeatherSystem, TechnologySystem, SeasonalEvent, EconomySystem) are imported in `useEnhancedMafiaGameState` but the corresponding systems have no actual gameplay implementation — they exist as state fields but no UI or logic uses them meaningfully.

## Proposed Cleanup

### Step 1 — Remove legacy routes from `App.tsx`
Delete the `/classic` and `/enhanced` routes and their imports.

### Step 2 — Delete dead files (14 files, ~3000+ lines)
- `src/pages/Index.tsx`
- `src/pages/EnhancedIndex.tsx`
- `src/hooks/useMafiaGameState.ts`
- `src/components/MafiaHexGrid.tsx`
- `src/components/MafiaHud.tsx`
- `src/components/BusinessManagement.tsx`
- `src/components/LegalSystem.tsx`
- `src/components/PoliceSystem.tsx`
- `src/components/ReputationPanel.tsx`
- `src/components/IntelligencePanel.tsx`
- `src/systems/SoldierRecruitmentSystem.ts`
- `src/components/CombatInterface.tsx`
- `src/components/SoldierRecruitmentInterface.tsx`
- `src/components/EnhancedGameMechanics.tsx`

### Files Modified
- `src/App.tsx` — remove 2 route entries + 2 imports
- 14 files deleted

