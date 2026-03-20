

# Tactical Options Review & Issues Found

## Summary of All 4 Tactical Actions

### 1. SCOUT (Soldier only) — Mostly Working
- Select soldier -> click adjacent non-player hex -> reveals enemy count, business info for 3 turns
- Scouted hexes tick down each turn and expire correctly
- **Issue**: After scouting, `movesRemaining` is decremented (line 978) in addition to `tacticalActionsRemaining`. Since tactical phase doesn't allow regular movement, the `movesRemaining` deduction is harmless this turn, but it means the soldier has fewer deploy-phase moves next turn — which is wrong because moves are reset at turn start (line 1240). Actually, wait — moves ARE reset at turn start, so this is fine functionally. But the deduction is unnecessary code.

### 2. FORTIFY (Any unit) — Has Bugs
- **Bug 1: Already-fortified units waste a tactical action.** There's no check for `unit.fortified === true`. A player can re-fortify an already-fortified unit, spending a tactical action for no effect.
- **Bug 2: Fortify button flow is inconsistent.** The onClick handler (line 447-451) calls `fortifyUnit()` immediately if a unit is already selected AND the action is 'fortify'. But if no unit is selected, it sets `moveAction` to 'fortify', then the player clicks a unit to select it — but then they need to click Fortify AGAIN (or click the unit's hex) to actually fortify. The `selectUnit` flow for fortify (line 714-717) only sets up `availableMoveHexes` to the unit's own hex, requiring a second click on the hex to trigger `moveUnit`, but `moveUnit` has NO fortify handler — it would fall through to regular movement which is blocked in tactical phase. **Fortify only works if the unit is selected first, then the Fortify button is clicked.** The reverse flow (click Fortify first, then click unit) is broken.
- **Bug 3: The UI description says "skip movement for +25% defense bonus this turn"** but the mechanic is supposed to persist across turns until the unit moves. The description is misleading.

### 3. ESCORT (Capo only) — Working but has duplication
- Two paths do the same thing: `selectUnit` (line 719-754) handles soldier->capo click, AND `moveUnit` (line 806-833) handles the hex-click path. Both work but there's redundant code.
- The escort tooltip says "click a hex with your capo" but we just added click-on-capo-unit support. Description should mention both options.

### 4. SAFEHOUSE (Capo only) — Working
- Duration correctly set to 5 turns
- Ticks down each turn, expires with notification
- Destroyed when enemy captures the hex
- Only 1 safehouse at a time
- Requires player-controlled hex
- **Minor**: `movesRemaining` is set to 0 on safehouse creation (line 1000), which is unnecessary since there's no movement in tactical phase and moves reset at turn start.

## Proposed Fixes

### File: `src/hooks/useEnhancedMafiaGameState.ts`

**Fix 1 — Fortify: add already-fortified guard**
In `fortifyUnit()` (line 934), add check: `if (unit.fortified) return prev;` to prevent wasting a tactical action.

**Fix 2 — Fortify: fix the "select Fortify first, then click unit" flow**
In `selectUnit` fortify handler (line 714-717): instead of setting up `availableMoveHexes` and waiting for a hex click, call `fortifyUnit` logic inline — set `fortified: true`, deduct tactical action, and deselect. This makes both flows work: (a) select unit then click Fortify, and (b) click Fortify then click unit.

**Fix 3 — Scout: remove unnecessary `movesRemaining` deduction**
In `processScout` (line 978), stop decrementing `movesRemaining` since it has no effect (reset at turn start) and is conceptually wrong for a tactical-phase-only action.

**Fix 4 — Safehouse: remove unnecessary `movesRemaining = 0`**
In `processSafehouse` (line 1000), stop setting `movesRemaining` to 0 for the same reason.

**Fix 5 — Update misleading comment**
Line 1238: Change comment from "Clear fortified status" to "Reset moves and escort for new turn (fortified persists until unit moves)".

### File: `src/pages/UltimateMafiaGame.tsx`

**Fix 6 — Update Fortify description**
Change from "this turn" to "persists until the unit moves".

**Fix 7 — Update Escort description**
Mention clicking the capo unit directly (not just the hex).

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — 5 logic fixes
- `src/pages/UltimateMafiaGame.tsx` — 2 description fixes

