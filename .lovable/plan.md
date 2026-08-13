# Sitdown Rework — The Table

Replace the scattered negotiation UI and the blind dice roll with one cinematic full-screen sitdown scene driven by a **bargaining chip** model, plus visible, persistent consequences for every deal signed.

## What changes for the player

### 1. One place: the Sitdown Scene
Every negotiation — capo territory talk, boss-to-boss diplomacy, incoming AI request — opens the same full-screen noir table:

```text
+--------------------------------------------------------------+
|  THE SITDOWN            Genovese  ·  Tension 62  ·  Turn 14   |
+---------------------+---------------------+------------------+
|  THEM               |     THE TABLE       |   YOU            |
|  Vito Corleone      |  their asks (chips) |  Don <player>    |
|  Enforcer           |  ---- vs ----       |  Respect 41      |
|  Mood: Wary         |  your offers (chips)|  Influence 22    |
|  Wants: money, calm |                     |  Cash $84,000    |
+---------------------+---------------------+------------------+
|  LEVERAGE  ███████░░░  +18   |   THEIR VERDICT: Interested   |
|  [ Add chip ▾ ]  [ Withdraw ]  [ Put it to them ]            |
+--------------------------------------------------------------+
```

The Sitdowns sidebar minicard stays, but becomes purely a tracker/launcher: every card opens the scene instead of a separate dialog. The old `NegotiationDialog` is retired.

### 2. Bargaining chips instead of a single price
Both sides build a basket. Chip types:

- **Cash** — lump sum, either direction
- **Tribute** — a % of a hex's income per turn, for N turns
- **Territory** — hand over / receive a specific hex
- **Safe passage** — free movement through the other's turf, N turns
- **Ceasefire / non-aggression** — N turns of no attacks
- **Supply access** — connect to their supply network, N turns
- **Intel** — reveal scouted hexes / fortifications
- **Favor** — an IOU redeemable once within 10 turns (they must accept one future ask)

The AI opens with a demand basket; you add, remove, and resize chips on your side. Every chip shows its **valuation to them** (not just to you) so pricing is legible.

### 3. Leverage instead of dice
No roll. A visible **Leverage** meter aggregates every modifier, each shown as a labeled line item:

- Military position around the contested hex (units, fortifications, adjacency)
- Tension and standing with that family
- Respect / Influence / Fear
- Capo personality (territory scope) or boss temperament (family scope)
- Treachery debuff, runaway-leader wariness, desperation, war state

Their verdict is deterministic from `basketValueToThem + leverage` vs their **reserve** (hidden as an exact number, but telegraphed as Insulted / Cold / Interested / Eager). Press *Put it to them* and they accept, counter once with an adjusted basket, or walk (walking costs tension). No randomness — outcomes are readable and learnable.

### 4. Consequences that show
Signed deals become **Standing Agreements**, visible after the fact:

- A Pacts strip in the sitdown scene and the sidebar listing each live agreement, its chips, turns remaining, and per-turn cash flow
- Map markers: hexes under tribute, safe-passage corridors, ceasefire borders tinted
- Turn Summary line items for every deal's inflow/outflow
- Breaking an agreement (attacking during a ceasefire, missing tribute) triggers a betrayal event: tension spike, treachery debuff, and a broadcast to other families
- Redeemable **Favors** appear as one-click actions on the rival's card

## Technical outline

**New**
- `src/types/negotiation.ts` — `Chip`, `ChipKind`, `Basket`, `SitdownSession`, `Verdict`, `StandingAgreement`
- `src/lib/sitdown-valuation.ts` — pure functions: `valueChipTo(family, chip, state)`, `computeLeverage(state, ctx)` (returns labeled line items), `evaluateBasket(...) -> Verdict`, `aiCounterBasket(...)`
- `src/components/sitdown/SitdownScene.tsx` — full-screen layout
- `src/components/sitdown/ChipRail.tsx`, `ChipCard.tsx`, `LeverageMeter.tsx`, `VerdictBar.tsx`, `PactsStrip.tsx`
- `src/lib/__tests__/sitdown-valuation.test.ts` — valuation symmetry, verdict thresholds, counter convergence, walk-away conditions

**Changed**
- `src/hooks/useEnhancedMafiaGameState.ts` — new actions `OPEN_SITDOWN`, `UPDATE_BASKET`, `SUBMIT_BASKET`, `ACCEPT_COUNTER`, `WITHDRAW`; `processNegotiation` rewritten to settle a basket into effects; existing pact types (`CeasefirePact`, `ShareProfitsPact`, `AlliancePact`, supply deals) become the effect layer written by basket settlement; add `standingAgreements` and `favors` to state
- AI sitdown generation now emits a demand **basket** rather than a single `proposedAmount` (legacy fields kept for save compat and mapped forward)
- `src/components/SitdownsPanel.tsx` — cards become launchers; inline counter input removed (haggling lives at the table); adds live Standing Agreements section
- `src/pages/UltimateMafiaGame.tsx` — mounts `SitdownScene`, drops the two `NegotiationDialog` mounts
- `src/lib/negotiation-odds.ts` — repurposed as thin re-exports over `sitdown-valuation` so existing callers keep working
- `src/lib/saveMigrations.ts` — schema bump; old `IncomingSitdown` shape converted to a basket on load
- Sound: reuse existing `sitdown_proposed / ready / accepted / declined` voices; add table-open and chip-place accents

**Unchanged** — turn/action economy, combat, tension formulas, supply-line mechanics, existing pact effects on income and movement.

## Build order
1. Types + valuation library + tests (no UI)
2. State actions and basket settlement into existing pact effects
3. Sitdown Scene UI with chips, leverage, verdict
4. AI basket generation and counter logic
5. Standing Agreements surface (sidebar, map markers, turn summary), betrayal handling
6. Retire `NegotiationDialog`, save migration, full test + build pass
