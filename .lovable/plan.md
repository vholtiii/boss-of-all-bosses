# Confirmation + Passive Racketeering via Hex Occupancy

## Confirmation: How Occupancy Affects Extorted Hex Income Today

Verified in `useEnhancedMafiaGameState.ts` (L4871–4882) inside `processEconomy`. For an **extorted** business (not player-built), per-turn income is:

| Occupant on the hex | Income from the business |
|---|---|
| **Capo** present | **100%** of `business.income` |
| **Soldier** present (no capo) | **30%** of `business.income` |
| **No unit** present | **10%** passive |

Player-built businesses are exempt — they always pay 100% regardless of occupancy. After this base, the result is multiplied by family bonuses, district control bonuses (e.g. Manhattan +25%), Lucchese boost, supply decay, and war penalties.

So yes — **a unit's presence on an extorted hex materially increases its income, and capos out-earn soldiers (100% vs 30%, ~3.3× multiplier).** This is also documented in `mem://gameplay/business-operations` and `mem://gameplay/business-income-calculation`.

---

## Proposal: Passive Racketeering Growth from Sustained Occupancy

A soldier who quietly **sits on an extorted business hex for 5 consecutive turns** earns +1 racketeering — no extortion action, no heat. This gives a slow, low-risk path toward Capo promotion (which currently demands `racketeering ≥ 3`, typically requiring 3+ noisy extortion actions).

### Mechanics

| Property | Value |
|---|---|
| **Trigger** | Soldier (not capo) is on a hex this family controls, that hex has a business, and the business is **extorted** (not player-built). |
| **Counter** | New per-soldier stat `extortedHexTurns` increments +1 each turn the condition holds. |
| **Reward** | When `extortedHexTurns` reaches **5**, racketeering +1 (capped at 5), counter resets to 0. Soldier loyalty +1 (steady earner reward). |
| **Reset to 0** | Soldier moves off the hex, the hex is lost/abandoned/flipped, the business is destroyed, or the soldier dies/is jailed. |
| **No reset** | Family changes phase, scout passes through, or another soldier joins the hex. |
| **Stacking with active extortion** | Performing a manual `extort` action on the same hex in the meantime is fine — it adds racketeering as it does today. The passive counter just keeps ticking; they're additive paths. |
| **Phases** | Active in **all phases**. Especially valuable in Phase 3+ where manual extort is locked, giving sit-tight soldiers a real progression path. |
| **AI parity** | Same rule applies to AI soldiers. Their existing promotion logic already reads `racketeering`, so this just feeds the pipeline organically. |

### Why this fits the design

- **Lower heat ceiling** — currently the only racketeering-growth path (the `extort` action) generates heat. This gives a heat-free alternative, matching how a real "made man" earns his bones quietly running a steady racket.
- **Rewards the existing 30% income choice** — the player already pays an opportunity cost by parking a soldier on a hex (the hex becomes harder to defend elsewhere). Adding racketeering progression rewards that commitment.
- **Slow but reliable** — 5 turns per +1 means reaching `racketeering ≥ 3` (promotion threshold) takes ~15 turns of dedicated occupancy. Active extortion still gets there in 3 turns. The two paths trade speed for heat.
- **No new UI required to function**, but small surfacing (below) makes it discoverable.

### UX Surfacing

- **Hex Info Panel** (bottom-left, when hovering an occupied extorted hex): show a small line "👔 Earning his bones — 2/5 turns to +1 Racketeering" if a soldier of yours is on it.
- **HQ Boss Overview soldier list**: when a soldier has an active counter > 0, append a 👔 badge with tooltip showing progress.
- **Turn Summary**: when a soldier ticks +1 racketeering this way, log it under "Promotions in Progress" — e.g. "Tony Salerno earned a racketeering point running Joe's Pizza shakedown."

---

## Technical Implementation

### State (`src/hooks/useEnhancedMafiaGameState.ts`)

1. **New stat field** `extortedHexTurns: number` on the soldier-stats object. Add to all 6 stat-init sites (L985, 2717, 3129–3130, 3235–3236, 5428, 7293, 7339) and into the AI fallback at L6109.
2. **Tick logic** in `processEconomy` right after the per-tile loop completes (around L4946), iterate `state.deployedUnits` for soldiers only:
   - For each soldier of any family, check if their `(q,r,s)` matches an extorted-business hex controlled by their family.
   - If yes: increment that soldier's `extortedHexTurns`. If it reaches 5, set `racketeering = min(5, racketeering + 1)`, loyalty `+1`, reset counter to 0, push a notification.
   - If no: reset counter to 0.
3. **Cleanup** — soldier death/jail handlers already drop the stats record, so no extra work.

### UI

- **`src/components/HeadquartersInfoPanel.tsx`** — Boss Overview soldier rows: render 👔 + `extortedHexTurns/5` when > 0.
- **Hex Info panel** (in `EnhancedMafiaHexGrid.tsx` or wherever the bottom-left tile detail lives — confirm at implementation time): add the per-soldier progress line.
- **`src/components/TurnSummaryModal.tsx`** — new "Promotions in Progress" section listing tick events.

### Save compatibility

Bump save version. Migrate older saves by initializing `extortedHexTurns: 0` on every existing soldier-stats record.

### Tests

`src/hooks/__tests__/passive-racketeering.test.ts` covering:
- 5 consecutive turns → racketeering +1 and counter reset
- Moving off resets the counter
- Hex flipped/abandoned resets the counter
- Capo on the hex does NOT accumulate (capos are already promoted)
- Player-built hex does NOT count (only extorted)
- AI soldiers accumulate and promote via the same pipeline
- Cap at racketeering = 5 still ticks loyalty but can't push past 5

### Memory updates

- Update `mem://gameplay/unit-attributes-and-promotion` to describe the passive path.
- Update `mem://gameplay/business-operations` to note occupancy now also progresses racketeering.

---

If approved, I'll implement this in default mode with full AI parity and the test suite above.