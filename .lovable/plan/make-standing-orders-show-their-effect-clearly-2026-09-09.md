# Make Standing Orders show their effect clearly

Standing Orders already drive money, crew growth, police heat and defence — but the panels only show raw numbers, so it is hard to see what changing an order actually does. This pass makes the effect obvious before you pick, and visible after the month plays out.

## 1. Compare before you commit

In both the block mini-card and the full Manage panel, each of the four orders shows its numbers as a difference from the order currently running:

- Money: `$3,050/mo` plus a coloured delta (`-$1,525` in red, `+$400` in green) against the active order.
- Heat: plain words instead of percentages — `heat: normal`, `heat: much lower`, `heat: slightly higher`.
- Crew: `new soldier in ~4 months` (or `no crew growth here`).
- Defence: `block 25% harder to take` only on Fortify Up.

The currently active order is labelled "Running now" and shows no deltas.

## 2. A one-line summary of what this order is doing

Under the four buttons, one sentence in plain words:

> Running Muscle Up: earning $1,525 a month (half), heat slightly up, next soldier in about 3 months.

## 3. Show it on the map

Small badges on owned blocks so you can read the whole board at a glance:

- Lay Low — a faint dimmed tint with a small "quiet" marker.
- Muscle Up — a small crew icon.
- Fortify Up — a small shield icon (matching the existing defence styling).
- Earn — no badge (it is the default).

Each badge carries a hover tooltip naming the order.

## 4. Report it at the end of the turn

In the Five Boroughs Tribune (turn summary), the money section gains a short line whenever orders changed the result, e.g.:

> Standing orders: 4 blocks laid low (-$3,100, heat held down), 2 blocks on Muscle Up (+2 recruits coming).

If every block is on Earn, the line is omitted.

## Technical details

- `src/components/CityPanel.tsx` and `src/components/TileDevelopmentPanel.tsx`: compute per-order income/growth/heat against the active policy and render deltas plus the "Running now" summary sentence. Add a shared helper (e.g. `src/lib/tile-policy-preview.ts`) so both panels use identical maths and wording.
- `src/components/EnhancedMafiaHexGrid.tsx`: render a small policy badge on player-owned tiles whose `policy !== 'earn'`, reusing existing badge placement conventions.
- Turn summary: aggregate per-policy counts and the income/heat/growth deltas during monthly income resolution in `useEnhancedMafiaGameState.ts`, store on the turn report (e.g. `standingOrderSummary`), and render one line in `src/components/TurnSummaryModal.tsx`.
- No gameplay-value changes: the multipliers in `TILE_POLICIES` stay exactly as they are.

## Verification

- `tsgo` typecheck plus the existing `tile-policy-effects` tests.
- Playwright: open a block, switch orders and confirm the deltas and summary sentence update; end a turn and confirm the summary line appears.
