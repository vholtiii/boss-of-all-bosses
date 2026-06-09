# Prosecution Wiretaps & RICO Aides

Extend the existing wiretap system with a second class — **Federal bugs** planted by law enforcement — that feed the prosecution / RICO pipeline. The existing rival-family wiretap stays unchanged; this adds a parallel `plantedBy: 'feds'` track plus the discovery, intel, and prosecution consequences around it.

## Mechanics

### Placement (both passive + event-driven)
- **Passive heat-driven**: At end of each turn, for every family in **Hot (60+)** heat or higher, roll a chance to plant 1 Fed bug on one of their non-HQ extorted/built hexes.
  - Hot 60-79: 12% / turn
  - Critical 80-89: 22% / turn
  - RICO 90+: 35% / turn
  - Target hex weighted toward highest-earning + most-active (recent claims/extorts/hits in last 3 turns).
  - Cap: max 3 simultaneous active Fed bugs per family. Cannot target HQ.
- **Event-triggered spikes** (any of these adds 1 Fed bug immediately, ignoring cap +1):
  - Failed Plan Hit (already raises heat) → 40% bug roll
  - Raid event resolution → 50% bug roll
  - Soldier flipped to informant → 100% bug roll
  - Crossing prosecutionRisk ≥ 40 threshold → 1 guaranteed bug (one-shot per crossing)

### Lifecycle & passive effect
- Each Fed bug stores: `plantedTurn`, `q,r,s`, `targetFamily`, `discovered: false`.
- While **undiscovered**: silently accrues. **No** passive prosecutionRisk add (kept clean per your "Age-scaled + RICO accel" choice).
- While **discovered but not yet swept**: visible UI badge on hex; still produces evidence until swept (same +risk-on-sweep math doesn't double-apply — discovery is the consequence event).

### Discovery paths
1. **Sweep for Bugs** (existing action): now also rolls 75% against Fed bugs on that hex. Finding a Fed bug fires the discovery consequence below.
2. **Chief bribe (tier 3)** — adds a "Fed wires suspected: **N** active across your territory" line to the bribe report. Count only, no locations.
3. **Mayor bribe (tier 4)** — reveals exact hex coordinates of all currently active Fed bugs. Marks them `discovered: true` (triggers consequence immediately based on age). Still requires Sweep to remove.
4. **Consigliere lawyer (passive)** — while retained, each turn 25% chance to flag one undiscovered Fed bug's hex (sets `discovered: true`, triggers consequence). Surfaces as an alert.

### Discovery consequence (the core feedback loop)
When a Fed bug transitions to `discovered`:
- `age = currentTurn - plantedTurn`
- **Prosecution risk** += `min(25, age * 3)` for the owning family.
- **RICO acceleration**: if owning family's heat ≥ 80, immediately tick `ricoTimer += 1` (the Feds "rush the case"). If age ≥ 5 AND heat ≥ 80, tick `+2` instead.
- Alert/toast: "🎧⚖️ Fed wire discovered on \[district hex] — bug ran **N** turns. Prosecution risk +X.\[ RICO timer rushed.]"
- Heat is **not** directly raised (heat is the *cause*, prosecution is the *effect*).

### Removal
- Only **Sweep for Bugs** removes a Fed bug from the hex (same action that already exists; no new button). Mayor-bribe reveal does not remove, only exposes.
- Removing a Fed bug grants +3 respect (not the +5 of a rival sweep — Feds expected) and does **not** raise tension (no family planted it).

### AI parity
- Same passive/event placement applies to AI families based on their own heat.
- AI sweep heuristic already exists; extend so AI also weights sweep priority by `(undiscovered Fed bugs) * heatTierWeight` — cautious/strategic personalities sweep more aggressively at Critical/RICO heat.
- AI Mayor/Chief bribes (when AI does corruption) read the same intel.
- AI prosecution risk + RICO timer already update through the same shared pipeline.

## UI

- **Sweep button tooltip**: extend existing suspected-count to show "(N rival + M Fed suspected)" when in Hot+ heat.
- **HeatMeter overlay**: add a small `🎧` badge with active Fed-bug count under the meter when ≥1 bug is on the player. Hover tooltip lists hexes (only those discovered).
- **Hex info panel**: discovered Fed bug shows a "⚖️ Fed wire — ran N turns, swept/active" line.
- **Alerts log**: new entries for planting (silent — *no* alert; you only learn via discovery), discovery, RICO rush.
- **Mayor bribe report**: new section listing Fed bug hexes.

## Files to touch (technical section)

- `src/types/game-mechanics.ts`
  - Extend `Wiretap` interface: `plantedBy: FamilyId | 'feds'`; reuse existing fields.
  - New constants: `FED_BUG_CHANCE_BY_TIER`, `FED_BUG_MAX_PER_FAMILY`, `FED_BUG_AGE_RISK_PER_TURN = 3`, `FED_BUG_AGE_RISK_CAP = 25`, `FED_BUG_RICO_ACCEL_HEAT = 80`, `FED_BUG_RICO_ACCEL_AGE = 5`.
- `src/hooks/useEnhancedMafiaGameState.ts`
  - End-of-turn pass: roll Fed-bug placement per family by heat tier; handle event-triggered placements at the existing failed-hit / raid / informant / risk-threshold sites.
  - Sweep handler: include Fed bugs in the roll; on Fed discovery apply age-scaled risk + RICO accel.
  - Consigliere passive: per-turn 25% roll for one undiscovered Fed bug on player.
  - Mayor/Chief bribe handlers: include Fed bug count/locations in returned report; Mayor reveal marks discovered + triggers consequence.
  - AI sweep weighting update.
- `src/components/HeatMeter.tsx` — small `🎧 N` chip when player has Fed bugs.
- `src/pages/UltimateMafiaGame.tsx` — Sweep tooltip + hex info Fed-wire line.
- `src/components/CorruptionPanel.tsx` / bribe report rendering — Fed bug section.
- Memory updates:
  - New `mem://gameplay/prosecution/fed-wiretaps.md` (placement, discovery, consequence, AI parity).
  - Update `mem://gameplay/tactical/wiretap-sweep.md` (Sweep now handles Fed bugs too).
  - Update `mem://gameplay/police-heat-system.md` and `mem://gameplay/legal-and-prosecution.md` cross-refs.
  - Update `mem://gameplay/intel-bribes.md` (Chief count / Mayor locations).
  - Update `mem://gameplay/defense-and-law-actions.md` (Consigliere passive hint).
  - Append index.

## Out of scope (this pass)
- No new resources, no new map layers, no Witness Protection / Stoolie mechanics, no "Grand Jury" mini-events. Those can layer on later as additional RICO aides.
