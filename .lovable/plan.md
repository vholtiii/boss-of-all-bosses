# Who Builds What — Presence-Gated Construction

## What the code does today

- Player construction (`startBuild`) requires **no unit at all**: own the block, no anchor racket standing, cash, 1 action. You can develop a block on the other side of the map with nobody on it.
- The AI **does** require a capo standing on the block before it breaks ground — so rivals play by a stricter rule than the player.
- A dead legacy path still enforces "a Capo must be on the hex," but nothing in the UI routes to it anymore.
- Buy-out and standing orders are also presence-free.
- Construction ticks down a fixed `monthsRemaining` each turn regardless of who is standing there.

That makes development the one economic system that ignores the map, which fights the rest of the design (claim, extort, combat all require presence).

## The new rules

**Rank gates the trade.**

| Track | Who can break ground |
|---|---|
| Store Front, Loan Office (shylock), Legal Front | Soldier, capo, or boss |
| Brothel, Gambling Den, Safehouse | Capo or boss only |

A soldier who tries to break ground on a brothel, den, or safehouse gets a clear refusal: *"This is capo work. Send someone with rank."*

**Crew on site sets the pace.** Construction months are no longer fixed — each turn a block under construction advances by:

- Capo or boss on the block: **1.5 months of progress per turn** (a capo riding the job pushes it)
- Soldier(s) only: **0.6 per turn** (a soldier can hold a capo's job site, but it crawls)
- Nobody on the block: **0.35 per turn** (crews slack when no one is watching)

So a capo can start a casino and hand it off to a soldier — the job continues, just slower. The City Panel shows the live rate and revised ETA so the trade-off is visible before you walk the capo away.

**Buy-out needs presence too.** Buying an anchor racket out requires any unit of yours (soldier, capo, or boss) standing on that block — money changes hands at the table. Standing orders stay free and remote, as they are now.

**AI plays the same rules.** The AI's capo-only build restriction is relaxed to match: its soldiers can start store fronts, loan offices, legal fronts, and safehouses; brothels and dens still need a capo. AI sites tick with the same crew-speed table.

## Player-facing changes

- Build buttons in the City Panel and Tile Development Panel show a lock with the reason when the crew on the block can't do that trade ("Capo work" / "Send a crew to this block").
- A block under construction shows: current tier being built, progress, the speed the crew on site is producing, and the ETA at that speed.
- Buy-out button locks with "Send someone to close the deal" when the block is empty.

## Technical notes

- `src/types/game-mechanics.ts`: add `BUILD_RANK_REQUIREMENT: Record<BuildingType, 'soldier' | 'capo'>` and `BUILD_SPEED = { capo: 1.5, soldier: 0.6, unattended: 0.35 }`, plus a `buildProgressRate(capoPresent, soldiers)` helper. Change `TileBuild.monthsRemaining` to accept fractional values (it is already a number; ticks become fractional).
- `src/hooks/useEnhancedMafiaGameState.ts`:
  - `startBuild` (~13087): look up units on the tile, reject when no unit present, reject capo-tier tracks when only soldiers are there.
  - `buyOutAnchor` (~13145): require any friendly unit on the tile.
  - Construction ticks (~5789 and ~6527): subtract `buildProgressRate(...)` instead of 1; complete when `<= 0`.
  - AI build block (~8245): swap the capo-only candidate filter for the same rank table; keep the interior-hex preference.
  - Remove the dead `build_business` / `place_business_on_hex` legacy cases so there is one rule set.
- `src/components/CityPanel.tsx` and `src/components/TileDevelopmentPanel.tsx`: use the existing `capoHere` / `soldiers` values already computed in CityPanel to disable and annotate build buttons, render the crew-speed line and ETA, and gate the buy-out button.
- Tests: extend the existing build/policy test suites with cases for soldier-built store front allowed, soldier-built casino rejected, capo speed vs soldier speed vs unattended progress, buy-out requiring presence, and AI parity.
