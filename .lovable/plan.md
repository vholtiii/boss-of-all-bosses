## Goal

In the right-sidebar **Supply Lines** section, make each node clearly show **who owns it** and whether **that owner** has it connected — instead of always describing status from the player's perspective.

Today (in `src/components/GameSidePanels.tsx`, ~lines 1517-1612):
- Each node card computes `isConnected` as "connected to **player** HQ" only.
- Ownership is buried as small grey text: `Owned` / `Held by gambino` / `Neutral`.
- A rival-owned node always shows `— No Route`, which is misleading (it means "no route for *you*"), and there's no indication whether the rival actually has it hooked up.

## Changes (UI-only, single file)

**`src/components/GameSidePanels.tsx`** — Supply Lines `CollapsibleSection`:

1. **Owner row, prominent.** Replace the small "district · ownership" line with a dedicated row at the top of each card:
   - Family color swatch (4px dot using existing family color tokens) + bold family label, or "Neutral" in muted text.
   - Keep district name to the right in muted text.

2. **Per-owner connection status.** Generalize the existing BFS so it accepts a `family` argument and check connectivity from **that family's HQ** through **their** controlled territory.
   - If neutral → status badge `Unclaimed`.
   - If owned (player or rival) → run BFS for the owner and show `Connected` / `Severed` badge tinted with the owner's family color.
   - Stockpile/decay copy (`Stockpile: N turns left`, `Supply cut — businesses at X%`) stays **player-only** and only renders when the player owns the node, since stockpile state is tracked per family.

3. **Player-perspective hint, secondary.** Under the owner row, add a small line only when the node is rival-owned:
   - `Not yours — cut their route to hurt their income.` (muted, single line, no new actions.)

4. **Sort order.** Group cards: player-owned first, then rival-owned (grouped by family), then neutral. Within each group, keep current node-type order.

5. **No changes** to: supply node data model, BFS/decay/stockpile game logic, map rendering, AI logic, or the Active Supply Deals subsection below.

## Technical notes

- Extract the inline BFS into a small local helper `isConnectedForFamily(node, family)` inside the component so it can be called for any family without duplicating the dir/visited boilerplate.
- Reuse the existing family color map already used elsewhere in `GameSidePanels.tsx` (e.g. tension cards) — no new tokens.
- Keep the existing `onHighlightSupplyNode` click behavior intact for all cards, including rival/neutral ones, so players can locate any node on the map.

## Out of scope

- New actions (sabotage shortcuts, claim buttons) on rival nodes.
- Map overlay changes (route colors per family stay as the existing uniform grey).
- Showing rival stockpile counters (that info is hidden by design).
