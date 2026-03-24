

# Implementation Plan: Stability, Polish & Replay Value

Implementing 7 of 8 items from the approved plan (skipping #6 — legacy economy removal).

---

## 1. Fix Family Selection Screen Layout + Normalize Soldiers

**File**: `src/components/FamilySelectionScreen.tsx`

- Change card width from `w-[170px]` to `w-[150px]` so all 5 fit in one row on most screens
- Add horizontal scroll fallback for very small screens
- Update `startingResources.soldiers` to balanced values: Gambino 4, Genovese 4, Lucchese 3, Bonanno 3, Colombo 3
- Realign bonus descriptions to match `FAMILY_BONUSES` in game-mechanics.ts (Colombo should show combat bonuses, not economic)
- Add optional seed input field below difficulty selector (text input, placeholder "Random" — leave blank for random seed)

## 2. Game Over / Victory Screen with Stats

**File**: `src/pages/UltimateMafiaGame.tsx`

- Add `bankruptcy` type to the existing game over check (lines 284-342 already handle RICO)
- After RICO check, add a bankruptcy game over screen with the same structure: emoji, title, description, stats, "Return to Main Menu" button
- Enhance the existing victory screen (lines 344-405) with post-game stats: turns played (`gameState.turn`), territory count, total money, soldiers remaining, families eliminated (`gameState.victoryProgress.domination.eliminated`), victory type
- Both screens already have "Return to Main Menu" via `onExitToMenu` — keep that

**File**: `src/hooks/useEnhancedMafiaGameState.ts`

- In the bankruptcy block (line 1943-1951), add `newState.gameOver = { type: 'bankruptcy', turn: newState.turn }` so the UI can detect it
- Update `gameOver` type to: `{ type: 'rico' | 'bankruptcy'; turn: number } | null`

## 3. Expose Map Seed for Replayability

**File**: `src/components/FamilySelectionScreen.tsx`

- Add a text input for "Map Seed" below the difficulty selector (optional — empty = random)
- Pass seed through `onSelectFamily` callback (add to interface)

**File**: `src/pages/UltimateMafiaGame.tsx`

- Update `GameConfig` interface to include optional `seed?: number`
- Pass seed to `useEnhancedMafiaGameState`
- Display current seed in the top bar (small text, e.g., "Seed: 1234567890")

**File**: `src/hooks/useEnhancedMafiaGameState.ts`

- Accept optional `seed` parameter in hook
- Use provided seed instead of `Math.random()` in `createInitialGameState` if present

## 4. Save/Load Version Tolerance

**File**: `src/hooks/useGameSaveLoad.ts`

- Change strict version check to a warning: if version differs, still return the data but add a warning message
- Parse major version only for hard rejection (e.g., reject `0.x` saves but allow `1.x.y` variations)

## 5. Realign Family Bonuses to Identity

**File**: `src/types/game-mechanics.ts`

- Colombo (military/attack family): Move `income: 20` to `combatBonus: 20`, add `fearGeneration: 15`, keep `recruitmentDiscount: 15`
- Gambino (power/political): Keep as-is (combat + territory income + intimidation)
- Genovese (business/stealth): Keep as-is (business income + laundering + upgrade)
- Lucchese (intel/subterfuge): Keep as-is (hit success + heat reduction + intel)
- Bonanno (defense/loyalty): Keep as-is (extortion + intimidation + fear)

**File**: `src/components/FamilySelectionScreen.tsx`

- Update Colombo's displayed bonuses to match: "+20% combat power", "-15% recruitment cost", "+15% fear generation"

## 6. Quick Turn / Skip Phase Button

**File**: `src/pages/UltimateMafiaGame.tsx`

- The "Next Phase" / "End Deploy" button already exists (line 475-484). Enhance it:
- When no units can be deployed (deploy phase) or no tactical actions remain (tactical phase), auto-highlight the skip button with a pulsing style
- No new button needed — the existing advance phase button serves this purpose

## Summary of Files Modified

| File | Changes |
|------|---------|
| `src/components/FamilySelectionScreen.tsx` | Layout fix, soldier normalization, seed input, bonus text |
| `src/pages/UltimateMafiaGame.tsx` | Bankruptcy game over screen, victory stats, seed display/pass-through |
| `src/hooks/useEnhancedMafiaGameState.ts` | Bankruptcy gameOver state, seed parameter |
| `src/hooks/useGameSaveLoad.ts` | Relax version checking |
| `src/types/game-mechanics.ts` | Colombo bonus realignment |

