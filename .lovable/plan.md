## Goal

1. **Respect** — harder to earn passively, but **bold moves pay big**. Slow drip from sitting on territory; meaningful spikes from risky aggressive plays.
2. **Influence** — driven by real-world mob power: legitimate fronts, political/police corruption, alliances, district dominance — and especially **businesses you build yourself**.

Symmetric where relevant so AI follows the same rules.

---

## Respect — harder passive, bigger bold-move payouts

### Nerf the passive drip
In `src/hooks/useEnhancedMafiaGameState.ts` (~lines 4500–4512):
- Income contribution: cap `3 → 2`, divisor `7000 → 10000`.
- Business contribution: `hexesWithBusinesses / 7 → / 10`.
- Phase 1 dampener: `0.5 → 0.4`.
- Steeper diminishing returns curve (`applyDiminishingReturns` ~4481):
  - 0–49: 1.0x | 50–69: 0.55x | 70–84: 0.30x | 85+: 0.12x

### Boost existing bold-move respect rewards
Bold moves bypass diminishing returns (apply directly, capped at 100). Add helper `awardBoldRespect(state, amount, reason)` that pushes a notification and a `boldActions` log entry.

| Action | Change |
|---|---|
| Blind Hit success (`BLIND_HIT_RESPECT`) | +50% |
| Planned Hit on rival Capo | +3 |
| Planned Hit on rival Boss | +5 |
| Successful HQ Assault | +10 |
| Capturing a rival safehouse | +3 |
| Winning combat outnumbered (attacker units < defender units) | +2 "Bold Strike" bonus |
| Successful Plan Hit during active war | +1 wartime bonus |

### New bold action: **Send a Message**
Sabotage + claim on the same enemy hex within the same turn. If both succeed, grant **+4 bonus respect** ("Sent a message to the {family}"). No new UI — detected automatically in turn resolution. Tracked in `state.metrics.boldActions[]`.

(Public Execution and Defy the Commission removed per user direction.)

### AI parity
AI gets the same bold-move bonuses on equivalent successes (Blind Hit, HQ Assault, safehouse capture, outnumbered combat, sabotage+claim combo).

---

## Influence — real-world drivers, bigger reward for building

Replace formula at line 4493:

```text
rawInfluenceGain =
    builtBusinessHexes      * 0.4    // YOU constructed it — biggest single driver
  + legalBusinessHexes      * 0.25   // legitimate fronts (overlaps with built)
  + activeAlliances         * 0.7
  + activePoliticalBribes   * 0.5    // captain/chief/commissioner
  + districtsControlled60   * 0.4
  + min(1.5, totalHexes / 15)        // small generic floor
```

Definitions:
- `builtBusinessHexes`: tiles where `business.built === true` AND controlled by player. **Only counts businesses constructed in-game — starter businesses don't count.** If the schema doesn't already distinguish, add `business.constructedTurn?: number` set on construction completion; absence means starter.
- `legalBusinessHexes`: `business.isLegal && controlled by player`. Built legal storefront stacks both bonuses (intentional).
- `activePoliticalBribes`: `activeBribes` filtered to `['police_captain','police_chief','commissioner']` with `active === true`.
- `districtsControlled60`: count of districts where player owns ≥60% of hexes (reuse logic behind `hasPlayerDistrictBonus`).

### One-off influence spike on construction completion
When a build finishes (near `pendingBusinessBuild` / built-business empire bonus ~4122), grant **+2 influence immediately** (legal builds: +3). Notification: "Your new {type} cements your influence in {district}." Bypasses diminishing returns.

### AI parity
Line 6756: replace `floor(aiTerritoryCount / 3)` with the same weighted formula using AI-tracked equivalents. For fields the AI doesn't track in detail, use conservative proxies. Goal: AI growth roughly matches the player's reworked rate — not faster.

District-control passive `+1 influence/turn`, `EXPANSION_INFLUENCE_GAIN`, `BLIND_HIT_INFLUENCE_GAIN`, and built-biz seizure influence remain **unchanged**.

---

## Tests (`src/hooks/__tests__/`)

- `respect-passive-gain.test.ts` (new): with same seed, respect after 10 idle turns ≤ 70% of pre-change baseline.
- `respect-bold-moves.test.ts` (new): Blind Hit grants ≥ +6 respect; outnumbered-attack victory adds +2 bonus; sabotage+claim combo adds +4 "Send a Message" bonus.
- `influence-real-world-drivers.test.ts` (new):
  - Identical hex counts; the state with built+legal businesses + active police_captain bribe gains strictly more influence/turn.
  - Pure dirt-hex empire gains < 1.0 influence/turn.
  - Construction completion grants the +2/+3 spike.

---

## UI touches (minimal)

- Turn Summary modal: new "Bold Moves" line listing entries from `state.metrics.boldActions[]` for the turn.
- Resource tooltip on Influence: short list of contributing factors ("+0.4 from 1 built business, +0.7 from 1 alliance, ...").

---

## Memory updates

- `mem://gameplay/respect-influence-balance`: new respect curve, bold-move bonus list, influence formula with built-business emphasis (0.4 weight).
- New `mem://gameplay/bold-actions`: "Send a Message" rule (sabotage + claim same turn → +4 respect) and bold-move respect bonus table.
- `mem://index.md`: add bold-actions entry; update respect/influence summary line.

## Files touched

- `src/hooks/useEnhancedMafiaGameState.ts` (passive blocks ~4490–4525, AI influence ~6756, build-completion handler near 4122, combat resolution for outnumbered + sabotage+claim detection, new `awardBoldRespect` helper)
- `src/components/TurnSummaryModal.tsx` — Bold Moves section
- New tests above
- Memory files

## Out of scope

- Public Execution and Defy the Commission actions (removed per user).
- Reworking starter-business definition beyond adding `constructedTurn` flag.
- Combat-earned respect rebalance beyond the listed bumps.
