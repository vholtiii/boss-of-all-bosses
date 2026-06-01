## Realign endgame around the Commission (A + C + D + E)

Make controlling the Commission the only way to actually win, reframe Domination as **Iron Fist** (you must leave families alive to rule them), tighten the Phase 4 gate with a diplomacy requirement, and give the AI a posture that actively campaigns for votes.

---

### A. Coronation — Commission Vote becomes the ribbon-cutting

The other four conditions stop ending the game on their own. They become **qualifiers** that, once met, unlock and pre-buff the Commission Vote ("Coronation"). Only winning that vote ends the game.

**Logic** (`useEnhancedMafiaGameState.ts → updateVictoryProgress`)
- Replace the `if domination → territory → economic → legacy` block that assigns `state.victoryType`. Those conditions still flip `met: true` on `victoryProgress` (used by UI + AI), but **never** set `victoryType`.
- The only path that sets `state.victoryType = 'commission'` is a successful `callCommissionVote` (same for AI in the `aiOpponents` Commission block, `:7859-7886`).
- Add `qualifyingConditions: ('territory'|'economic'|'legacy'|'ironFist')[]` to state, recomputed each turn.
- **Coronation buff**: when calling a Commission Vote, each qualifier currently met grants `+1 yes vote` from a *neutral* rival (relationship 30–59 with no pact), reflecting peers conceding to overwhelming power. Cap the buff at +2 so diplomacy still matters.
- AI victory detection (`:1382-1430`) mirrors this: AI victories also only trigger via Commission Vote.

**Notifications**: when a qualifier first flips on/off, fire info notification (`"⚖️ Territory qualifier met — call a Commission Vote to claim the throne"`).

---

### C. Iron Fist — domination requires survivors

Rename "Domination" → **"Iron Fist"** everywhere user-facing (VictoryTracker, GameGuide, TutorialSystem, notification labels).

**Rule change** (`game-mechanics.ts` + state)
- `VictoryProgress.domination` → `VictoryProgress.ironFist`. `VictoryType` literal `'domination'` → `'ironFist'`.
- Target shifts from "eliminate 4" to **"eliminate all but 2 surviving rivals"** (i.e. on the standard 4-rival map: eliminate 2). New shape: `{ eliminated: number; target: number; survivorFloor: 2; met: boolean }` where `target = totalRivals - 2`.
- **Elimination guard**: in HQ Assault resolution and any other path that pushes a family into `eliminatedFamilies`, refuse the elimination when it would drop `survivingRivals.length` below `2`. Convert that final HQ Assault into a **Subjugation**: take all the target's hexes + safehouses, blank their treasury, but keep the family "alive" with their HQ hex flagged `subjugated: true` and a permanent `+40` relationship to the subjugator (they'll vote YES on his Commission Vote).
- New `subjugated: true` rivals: cannot declare war, cannot call Commission Votes, AI posture forced to `CONSOLIDATE`, still count toward `COMMISSION_MIN_SURVIVORS`.

---

### D. Phase 4 gate rewards diplomacy

`PHASE_CONFIGS` Phase 4 (`game-mechanics.ts:163-166`) — add two new requirements alongside the existing capo/territory floor:

```
minSurvivingRivals: 2,
diplomacy: { minActivePacts: 1 } OR { minRivalsAtRelationship: { count: 2, threshold: 40 } }
```

Implement matching checks in whatever computes phase advancement (search `canPhaseAdvance` / phase-unlock site, mirror the existing pattern). UI: `PhaseInfographic` lists the new requirements with green/red ticks. Apply symmetrically to the AI's phase-advancement check so opportunistic/diplomatic AIs aren't artificially held back.

---

### E. COMMISSION_BUILDER posture

`src/lib/ai-posture.ts` — add posture and policy:

```
'COMMISSION_BUILDER' // Phase 4+ diplomat path to victory
```

**Trigger** (in `computeAIPosture`, slotted between rules 5 and 6):
- `aiPhase >= 4`
- personality ∈ {`diplomatic`, `opportunistic`} OR (`unpredictable` with mood=calm)
- has ≥2 active pacts (alliance or ceasefire)
- not at war, not in heat emergency

**Policy**: `heatCeiling: 35`, `suppressOffense: true`, `suppressExpansion: true`, `forceBribe: false`, `acceptSitdownsForCash: true`, `refuseNewWars: true`, `warTargetMul: 0`, `economyFocusMul: 1.2`, `supplyNodeMul: 0`. Adds a new field `pursueCommission: true`.

**AI behavior wiring** (`useEnhancedMafiaGameState.ts`, AI turn loop):
- When `pursueCommission`, the AI: (1) pays for boss-level relationship bribes on the lowest-relationship surviving rival, (2) accepts sitdowns/ceasefires it would normally decline, (3) once `relationship ≥ 60 + active pact` against all surviving rivals (or buff would push it over) AND off cooldown, spends `$35k` to call the Commission Vote on its own turn.
- Slot into the existing AI commission block at `:7794-7886` — that path already exists; just add the posture-driven trigger path alongside the current relationship-only one.

---

### UI updates (mostly copy + emphasis, no new components)

- **VictoryTracker.tsx**: render Commission row first, larger, gold-bordered, labeled **"Ultimate Goal — Coronation"**. Other four conditions render below under heading **"Qualifying paths (+1 vote each, max +2)"**, smaller. Use existing tokens (`border-primary`, `bg-primary/10`).
- **CommissionVoteModal.tsx**: show per-rival breakdown including any qualifier-vote buffs. Rename header to "The Coronation".
- **GameGuide.tsx** / **TutorialSystem.tsx**: rewrite the victory section to lead with Commission. Replace "Domination" copy with "Iron Fist" + survivor rule.
- **PhaseInfographic.tsx**: Phase 4 panel renamed sub-line `"Earn the Commission's blessing"`; list new diplomacy requirement.

---

### Files to touch

```text
src/types/game-mechanics.ts        — VictoryType rename, PHASE_CONFIGS, target shape
src/types/enhanced-mechanics.ts    — subjugated flag, qualifyingConditions
src/hooks/useEnhancedMafiaGameState.ts
                                   — updateVictoryProgress refactor (A)
                                   — HQ Assault / elimination guard + subjugation (C)
                                   — phase-advance diplomacy check (D)
                                   — AI commission-builder action wiring (E)
                                   — coronation buff in callCommissionVote
src/lib/ai-posture.ts              — COMMISSION_BUILDER posture + policy
src/components/VictoryTracker.tsx  — Commission-as-apex layout
src/components/CommissionVoteModal.tsx — qualifier-buff breakdown, rename
src/components/PhaseInfographic.tsx — new Phase 4 requirements
src/components/GameGuide.tsx       — copy rewrite
src/components/TutorialSystem.tsx  — copy rewrite
src/hooks/__tests__/ai-posture.test.ts            — new test: COMMISSION_BUILDER triggers
src/hooks/__tests__/ai-victory-detection.test.ts  — assert auto-wins no longer trigger
new: src/hooks/__tests__/coronation.test.ts       — qualifier buff math, subjugation guard
```

---

### Out of scope

- Changing the underlying tension/war system or pact mechanics.
- New family powers or AI personalities.
- Map/economy rebalance (option B from the analysis). Numbers stay; only win conditions change.
- Save format upgrade beyond renaming `domination` → `ironFist` (add a saveMigration entry).

---

### Migration

`saveMigrations.ts`: on load, rewrite `victoryProgress.domination` → `victoryProgress.ironFist` (preserve `eliminated`), and `victoryType === 'domination'` → `'ironFist'`. Existing in-flight games keep their state.