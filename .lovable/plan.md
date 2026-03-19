

## Step-by-Step: Soldier-to-Capo Promotion

We'll build this incrementally. Here's the full roadmap — I'll implement only **Step 1** first, then wait for your confirmation before each next step.

### Step 1: Define promotion requirements and add the action handler
- Add constants: `CAPO_PROMOTION_REQUIREMENTS` (min 5 successful combat victories, min 60 loyalty, min 30 training, cost $10,000)
- Add max capos limit (3 per family)
- Add `promote_capo` action case in `performAction` that converts a soldier unit to a capo unit (changes type, grants 3 moves, assigns a name, removes from hitman list if applicable)

### Step 2: Add UI to trigger promotion
- In the HitmanPanel or a new section in GameSidePanels, show eligible soldiers with a "Promote to Capo" button
- Show requirements checklist per soldier so player knows what's needed

### Step 3: AI families can also promote soldiers
- Add logic in `processAITurn` so AI families promote eligible soldiers to capos when conditions are met

### Step 4: Balance and polish
- Tune costs/requirements based on playtesting feedback
- Add turn summary entries for promotions

---

### Technical Details (Step 1 only)

**File: `src/types/game-mechanics.ts`**
- Add `CAPO_PROMOTION_REQUIREMENTS` constant and `MAX_CAPOS = 3`

**File: `src/hooks/useEnhancedMafiaGameState.ts`**
- Add `promote_capo` case in `performAction` switch
- Convert the soldier's `DeployedUnit` entry: change `type` to `'capo'`, set `maxMoves: 3`, `movesRemaining: 3`, assign a generated name
- Deduct $10,000 from resources
- Push success notification

Shall I proceed with Step 1?

