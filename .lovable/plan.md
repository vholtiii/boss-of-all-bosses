# Clean up the top HUD bar

The top bar in the screenshot crowds the title block, the turn/season block, and the status chips into one row that overlaps and is hard to scan. Goals: clearer visual hierarchy, no overlap, easier to read.

## Changes (UltimateMafiaGame.tsx, ~lines 740–1010)

### 1. Left block — title group
- Drop the inline "Enhanced Underworld" subtitle and the raw "Seed: 637472711" string from the top row.
- Keep only the gold "ULTIMATE FIVE FAMILIES" wordmark.
- Move "Enhanced Underworld" to a small caption under the wordmark (one tight stacked line, muted).
- Move the seed into a tiny icon button (hash icon) with a tooltip showing the full seed; click copies it. Removes the long mono number from primary view.

### 2. Center block — turn / season / commission
- Replace the side-by-side `Turn N` + `Season` + `Commission Active` row with a single pill:
  - Big "TURN 1" in gold, dot separator, capitalized season ("· Spring"), dot, small green "Commission" with the pulse dot.
  - All on one baseline so "1" and "Spring" no longer stack awkwardly into adjacent chips.
- RICO and Prosecution warning pills stay, but render on a second center line only when active, so they never push the turn label sideways.

### 3. Right cluster — status chips
- Today threats / cooldowns / deployed / power chips wrap into the center area and visually collide with "Active". Move this whole chip cluster out of the center column into a dedicated right-side flex group with `flex-wrap` and `justify-end`, capped width, separated from the title by clear gap.
- Standardize chip styling: single height (h-5), consistent padding, single icon + label + value, no emoji-plus-text-plus-checkmark mashups. The "🚨 Threats: 0 ✓" becomes "🛡 Threats · 0" when clear and "🚨 Threats · N" when not.
- Group related chips with thin dividers: Diplomacy (Boss/Capo cooldowns) | Forces (deployed) | Effects (power FX) | Threats (popover trigger last).

### 4. Layout container
- Switch the outer header from a 3-column flex to a CSS grid `grid-cols-[auto_1fr_auto]` so the center block is truly centered and never gets pushed by the right cluster growing.
- Add `min-w-0` and `truncate` to the title and season text so narrow viewports collapse cleanly instead of overlapping.
- Increase row gap and add a subtle bottom border under the header to separate it from the map.

### 5. Small polish
- Pulse the green "Commission" dot only, not the whole label.
- Use `tabular-nums` for "Turn N" so the number doesn't shift width turn-to-turn.
- Drop redundant ✓ check marks where the tone color already conveys "all clear".

## Out of scope
- Threat popover content (unchanged).
- Side panels and map.
- Color tokens / theme.

## Validation
- Inspect on the current 2209px viewport: title left, centered turn pill, right chip cluster, no overlap.
- Resize narrower (1200px, 900px): chips wrap to a second row under the right cluster, title truncates with ellipsis, center pill stays centered.
- With RICO timer active: warning pill appears under turn pill, layout doesn't shift.
- With many active pacts/cooldowns: right cluster wraps, doesn't push the turn block.
