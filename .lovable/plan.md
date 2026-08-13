# Game Analysis — the consigliere's post-mortem

A sidebar panel you can open at any time that answers "what went wrong, and why?" — plus "what did I leave on the table?" Everything is derived from game data, so it is instant, free, and always consistent.

## What it shows

Two stacked sections, newest first:

**Setbacks — what went wrong**
Each card names the bad outcome, then the chain of causes that produced it, then the fix.

- Capo arrested / indicted → heat tier at the time, number of unbribed turns, the heat-generating actions of the last 3 turns (hits, blind hits, extortions), whether a lawyer retainer was active.
- Money negative → itemised: gross legal + illegal, soldier upkeep, empty-hex overhead, penalties (informants, heat tier, disconnected supply), and the single largest line item called out as the driver.
- Soldier killed / hit failed → whether the target was scouted, intel freshness, defender fortification, whether you were outnumbered.
- Territory lost → erosion vs. rival capture, who took it, whether it was garrisoned, whether it was cut off from supply.
- Business income collapsed → supply line severed, garrison missing, district control lost, informant drag.
- Loyalty slide / defection → decay from idle turns, mercenary ratio, no Family Dinner, purge fallout.
- Sitdown / pact fallout → what was conceded, tension change, pact expiry you didn't renew.
- RICO clock movement → discovered wiretaps, prosecution risk contributors.

**Missed opportunities — what you left on the table**
- Actions unspent at end of turn (with a count over the last 5 turns).
- Units idle on an owned block with nothing built, or standing where they earn nothing.
- Affordable build/upgrade you could have started, with the income it would have added.
- Anchor rackets in your territory left un-extorted or un-bought-out.
- Claimable empty blocks adjacent to your units.
- Promotion-eligible soldiers not promoted; bribe tier affordable while heat was high.
- Construction sites left unattended (slower ETA than necessary).

Each entry is one short line: the finding, the number that matters, and the corrective move. Severity chips (critical / warning / note) with a turn filter (last turn, last 5, whole game).

## Where it lives

A collapsible "Game Analysis" section in the right sidebar, alongside the existing sections, open at any time. A badge shows the count of unreviewed critical setbacks since your last look.

## Technical notes

- Add `turnReportHistory: TurnReport[]` (rolling last 12 turns) to `EnhancedMafiaGameState` in `src/hooks/useEnhancedMafiaGameState.ts`, appended when each turn report is finalised. The existing `TurnReport` already carries `incomeBreakdown`, `heatReasons`, `prosecutionReasons`, `loyaltyReasons`, `territoryChanges`, `supplyChanges`, `warUpdates`, `relationshipChanges` — those are the raw material. `alertsLog` supplies the event timeline for the "what led up to it" chains.
- New `src/lib/game-analysis.ts`: pure functions `analyzeSetbacks(state)` and `analyzeMissedOpportunities(state)` returning `AnalysisFinding[]` (`{ id, severity, turn, title, causes: string[], advice, hexRef? }`). No new game rules — read-only derivation over state, history and alerts.
- New `src/components/GameAnalysisPanel.tsx` rendering the two sections; mounted inside `RightSidePanel` in `src/components/GameSidePanels.tsx`. Clicking a finding with a `hexRef` selects/centres that block.
- Save compatibility: `turnReportHistory` defaults to `[]` for existing saves so old games still load; analysis simply starts from the current turn onward.
- Unit tests in `src/lib/__tests__/game-analysis.test.ts` for the bankruptcy, arrest, and lost-territory chains.
