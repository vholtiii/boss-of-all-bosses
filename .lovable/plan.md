## Scope

Address review items **#1, #5, #7** plus an intel-sources audit.

- **#1** Recruitment is in the wrong step (currently uses tactical budget but is administrative).
- **#5** Launder Money silently uses no budget.
- **#7** Defense & Law (PR / donation / lawyer) charge action tokens but Bribe Corruption / Hitman don't — same conceptual cluster, inconsistent cost.
- **Intel restriction**: intel may only come from (a) Scout, (b) Bribe (Corruption tiers + Dellacroce family power), (c) Flip Soldier, (d) capturing an enemy Safehouse. No other paths.

---

## Changes

### 1. Move Recruitment from Tactical → Action

**`src/hooks/useEnhancedMafiaGameState.ts`** — `recruit_soldiers` and `recruit_local_soldier` cases (~L7444, L7483) and the duplicate paths in the `dispatch`-style switch (~L1444 area if present):
- Replace every `tacticalActionsRemaining` check + decrement with `actionsRemaining`.
- Add both action types to `actionPhaseActions` gate list (L7203) so the standard "no actions left" warning fires consistently.

**`src/components/GameSidePanels.tsx`**:
- Move the two recruit `ActionButton`s out of the "Recruitment & Tactical" `CollapsibleSection` and into the existing economy section alongside Build / Launder.
- Rename the source section to just **"Tactical"**.
- Update sublabels: keep "1 action" wording (now truthful — it's an action token).
- Change `phaseLocked={!isTacticalPhase}` → `phaseLocked={actionsLocked}` on the recruit buttons; update `disabledReason` to "No actions left".

### 2. Charge an action token for Launder Money (#5)

**`useEnhancedMafiaGameState.ts`** — `launder` / `launder_money` case:
- Add `'launder_money'` to `actionPhaseActions`.
- Decrement `actionsRemaining -= 1` on success.

**`GameSidePanels.tsx`** — Launder Money button sublabel: `"20% fee · 1 action"`.

### 3. Charge action tokens for Bribe Corruption + Hire Hitman (#7)

**`useEnhancedMafiaGameState.ts`**:
- Add `'bribe_corruption'` and `'hire_hitman'` to `actionPhaseActions`.
- In `case 'bribe_corruption'`: after the success/fail branch resolves (money already debited), `newState.actionsRemaining = Math.max(0, newState.actionsRemaining - 1);`
- In `case 'hire_hitman'`: same — decrement after the contract is pushed.

**UI sublabels** (so the cost is visible):
- `CorruptionPanel.tsx` — append `· 1 action` to each tier row's metadata line, and disable the Bribe button when `actionsRemaining <= 0`. Pass `actionsRemaining` + `phaseIsAction` as new props from `GameSidePanels`.
- `HitmanPanel.tsx` — same treatment for the Hire button.

### 4. Restrict intel sources (the new ask)

Audit shows the only legitimate intel writers to `scoutedHexes` should be:

| Source | Code path | Status |
|---|---|---|
| Manual Scout | scout action (~L1819-1834, L2429+) | KEEP |
| Dellacroce family power (a bribe-equivalent network) | family_power gambino branch (L1847-1883) | KEEP |
| Bribe Corruption (Captain/Chief/Mayor reveal map intel) | already implicit via `activeBribes`; no scoutedHexes write — KEEP as-is |
| Flip Soldier (informant gives positions) | currently writes nothing — **ADD**: on successful flip, push a 2-turn scout entry on the flipped soldier's hex + 1-ring of HQ |
| Capture enemy Safehouse | L9395-9415 — full-family intel for 1 turn | KEEP |
| **Random Event "Informant Tip" (Pay)** | L7062-7072 | **REMOVE** — violates the restriction |
| Other | none found | — |

**Concrete edits:**

- **`useEnhancedMafiaGameState.ts`** L7062-7072: delete the "Informant Tip" eligible event entirely (and any `case` handling its `pay`/`ignore` choices if it has dedicated logic — currently it only applies generic consequences, so just removing the event push suffices).

- **`useEnhancedMafiaGameState.ts`** `processFlipSoldier` (L8976-9041): on the success branch (after pushing to `flippedSoldiers`), push a `ScoutedHex` for the flipped soldier's current hex with `turnsRemaining: 3, freshUntilTurn: state.turn + 1`, mirroring the safehouse-capture write pattern at L9398. Use the soldier's q/r/s. This represents the new informant feeding positions.

- **Audit verification** (no code change, just confirm in implementation): grep `scoutedHexes.push` and `scoutedHexes = [...` in the codebase and confirm every site is one of the four allowed sources. Already verified above.

### 5. Memory updates

- `mem://gameplay/turn-structure` — add: "Recruitment, Launder, Bribe Corruption, and Hitman contracts now consume action tokens (Action step), not tactical actions."
- `mem://gameplay/recruitment-costs` — change "1 tactical action" → "1 action token (Action step)".
- `mem://gameplay/tactical-mechanics` — remove recruitment from the tactical-action list.
- `mem://gameplay/corruption-system` — note "1 action token per bribe attempt".
- `mem://gameplay/hitman-contracts` — note "1 action token to place a contract".
- New: `mem://gameplay/intel-sources` — canonical list: Scout, Bribe (incl. Dellacroce power), Flip Soldier, Safehouse capture. No other intel paths permitted.
- `mem://gameplay/random-events` — remove "Informant Tip".

---

## Out of scope

- No change to Boss Strategy / War / Mattresses / Commission Vote (still anytime, free of budgets).
- No change to action-budget *size* (`BASE_ACTIONS_PER_TURN`). Tighter feel from the new costs is intentional; tuning is a separate pass if needed.
- No UX restructure of Plan Hit (was review item #2 — separate ticket).
- AI doesn't gain free intel from the removed "Informant Tip" event (was player-only anyway).

---

## Files touched

- `src/hooks/useEnhancedMafiaGameState.ts` (gate list + 4 case-budget edits, 1 event removal, flip-success scout entry)
- `src/components/GameSidePanels.tsx` (move recruit buttons, rename section, update sublabels, pass new props)
- `src/components/CorruptionPanel.tsx` (add `· 1 action` + disable when out of actions)
- `src/components/HitmanPanel.tsx` (same)
- 6 memory files (update / create)

## Open question

OK to proceed exactly as above, or want to keep "Informant Tip" alive as flavor and just have the "Pay" choice grant money/rep without intel?
