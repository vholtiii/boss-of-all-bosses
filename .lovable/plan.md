

# Slow Territory Acquisition — A1 + A3 + A4 + B3

Implement four compounding levers that make territory expansion slower, costlier, and more deliberate — without removing any mechanic.

---

## A1 — Claim Requires Presence Time (Contested → Claimed)

Claim is still an explicit action (1 AP), not automatic on movement.

- Player runs **Claim** on a neutral hex. The hex enters a new **Contested** state owned by the player visually but **not counted toward victory, district control, or income**.
- If the same player still has a unit on or adjacent to that hex at the **start of their next turn**, the hex finalizes to **Claimed** (full ownership, all bonuses apply).
- If the unit has moved away AND no friendly unit is adjacent, the hex reverts to **Neutral** (claim wasted, AP not refunded).
- If a rival unit moves onto a Contested hex before it finalizes, it reverts to Neutral immediately (no combat — the claim simply fails).
- Visual: Contested hexes use the player color at ~40% opacity with a dashed outline and a small ⏳ badge.

Applies to both manual Claim and capo auto-claim (capo auto-claim now produces Contested, not Claimed).

## A3 — Claiming Generates Heat

- Claim action: **+3 heat**.
- Claim on a hex containing a business: **+6 heat**.
- Heat applies on claim *initiation* (when Contested begins), not on finalization. Wasted claims still cost heat — the feds noticed you trying.
- Capo auto-claim follows the same rule.

## A4 — Diminishing Claim Returns

Respect/influence rewards from claiming scale by total hexes the family currently holds (Claimed only, not Contested):

| Family hex count | Respect per claim | Influence per claim |
|---|---|---|
| 1–10 | +1 | +1 |
| 11–20 | +0.5 (rounded down each 2 claims) | +0.5 |
| 21+ | 0 | 0 |

Income from the hex is unaffected — only the prestige reward decays. Encourages developing held territory rather than blobbing.

## B3 — Reduce Capo Fly Range

- Capo fly range: **5 → 3 hexes** per move.
- Capo moves per turn unchanged (3).
- Scout range unchanged (2 hexes).
- Auto-claim still triggers on hexes the capo lands on (now produces Contested per A1).

Keeps capos elite (still fly, still scout 2, still 3 moves) but they can no longer cross half the map in one turn.

---

## Technical Outline

### Files Touched

1. **`src/types/game-mechanics.ts`** — add `'contested'` to hex `controlledBy` semantics via a new field `contestedBy?: FamilyId` and `contestedSince?: number` on the hex type. Keep `controlledBy` strictly for finalized ownership.

2. **`src/hooks/useEnhancedMafiaGameState.ts`**
   - **Claim handler**: write to `contestedBy` + `contestedSince = currentTurn` instead of `controlledBy`. Apply heat (+3 / +6). Do NOT grant respect/influence yet.
   - **New finalization pass** at the start of each player's turn: for every hex where `contestedBy === player`, check if a friendly unit is on or adjacent. If yes → finalize (`controlledBy = player`, clear contested fields, grant diminishing respect/influence per A4). If no → revert to neutral.
   - **Rival intrusion check**: in unit-move handler, if destination hex is Contested by another family, clear contested state (revert to neutral).
   - **Capo auto-claim**: route through the same Claim path (contested + heat + diminishing rewards).
   - **Capo fly range constant**: `CAPO_FLY_RANGE: 5 → 3`. Update pathfinding/range-highlight helpers that read this.
   - **Diminishing rewards helper**: `getClaimRewards(familyHexCount) → { respect, influence }`.
   - **Victory / district-control / income calculations**: ensure they count only `controlledBy === family`, ignore Contested.

3. **`src/components/EnhancedMafiaHexGrid.tsx`** — render Contested hexes (40% opacity fill, dashed stroke in family color, ⏳ badge). Update legend.

4. **`src/components/MapLegend`** (within hex grid file) — add Contested entry.

5. **`src/components/HeadquartersInfoPanel.tsx`** + any territory counters — display "Held: X (+Y contested)" so players see pending finalizations.

6. **`src/components/AlertsLogPanel.tsx`** indirectly — emit alerts for: "Claim contested → finalized" (success), "Claim reverted (no presence)" (warning), "Claim broken by Genovese intrusion" (warning). Hooked at finalization pass.

7. **Tooltip / action preview** for Claim button — update to show "+3 heat, requires holding for 1 turn" and current diminishing-reward tier.

### Memory Updates

After build, update three memory files:
- `mem://gameplay/unit-actions/manual-constraints` — claim now contested for 1 turn, costs +3/+6 heat.
- `mem://gameplay/capo-abilities` — fly range 5→3; auto-claim produces contested.
- `mem://gameplay/respect-influence-balance` — note diminishing claim rewards tier table.

### What Doesn't Change

- Extort, sabotage, hit, fortify, scout: untouched.
- Erosion/expansion (Phase 3+): untouched.
- AP costs, movement rules other than capo range: untouched.
- AI uses the exact same rules (contested, heat, diminishing rewards, range 3).

