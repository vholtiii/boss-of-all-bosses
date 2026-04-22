

# Two enhancements: Threat HUD popover + richer Hex Info panel

## Part 1 — Threats badge becomes a popover

Wrap the top-bar `🚨 Threats: N` badge in a `Popover` (already in `components/ui/popover.tsx`). Clicking opens a compact, scrollable card anchored under the badge.

### Popover contents (short-form, grouped)

Same six sections as `ThreatBoardPanel`, condensed to one-line rows with no sub-text:

- **🎯 Incoming Hits** — `{Family} → {Soldier/Capo} · {Nt}` (red)
- **💀 Hitman Contracts** — `{Target} · {Nt ETA}` (amber)
- **⚔️ Wars & Pacts** — `War: {Family} ({Nt})`, `Ceasefire ending: {Family} ({Nt})`, `Tension HOT: {Family}`
- **⚖️ Law** — `RICO {Nt}`, `Heat {value} (Tier N)`, `Risk {value}`, `Soldier jailed ({Nt})`
- **🌊 Territory** — `{District} eroding (1t)`, `{Family} expanding into {District} (1t)`
- **💰 Bounties & Marks** — `Bounty from {Family}`, `{Unit} marked ({Nt})`

Rows with a hex target are clickable → call existing `onSelectUnit(type, hex)` to focus the unit/tile on the map and close the popover.

If 0 threats → muted emerald "All clear. No active threats."

Width ~320px, max-height ~480px with internal scroll. Section headers + flat rows for fast scanning. Extract row-builders into a shared helper `src/lib/threat-board.ts` exporting `buildThreatSections(gameState)` so `ThreatBoardPanel.tsx` and the new popover stay in sync.

## Part 2 — Hex Info panel: Income contribution only

Extend the bottom-left hover/pinned hex card in `EnhancedMafiaHexGrid.tsx` (lines ~2144–2330) with **only Section A** (income), and only render lines whose underlying state is active. Empty hexes stay clean.

### Income contribution sub-card (player-owned hex with business)
Render the sub-card only if the hex has a business owned by the player. Inside, each row is conditional:

- `💵 Income: $X/turn (effective)` — always shown when business present (uses existing business income calc).
- `📦 Supply: ✅ Connected` — shown when supply line from HQ reaches this hex.
- `📦 Supply: ⚠️ Severed (-10%/turn decay)` — shown only when the hex is actually supply-severed (decay actively applying). Not shown for businesses that don't depend on supply.
- `🔥 Heat/turn: +X` — shown only when the business is illegal and contributes heat > 0.
- `🌊 Eroding ({Nt} until flip)` — shown only when `erosionCounter > 0` for this hex.
- `📈 Passive influence gain: +X` — shown only when this hex is actively contributing to player's passive influence/respect gain (Phase 3+ expansion candidate or qualifying owned hex), per `mem://gameplay/respect-influence-balance` and `mem://gameplay/influence-erosion-expansion`.

No threat overlay, no ZoC section, no district snapshot, no unit detail expansion in this pass.

Styling matches existing sub-cards: `mt-1 p-1.5 rounded border bg-X/30 border-X/30`, small font, consistent with current hex info card.

## Files Touched

- `src/lib/threat-board.ts` — **new**, exports `buildThreatSections(gameState)` shared by panel + HUD popover.
- `src/components/ThreatBoardPanel.tsx` — refactor to import the shared builder (no visual change).
- `src/pages/UltimateMafiaGame.tsx` — wrap the `🚨 Threats` badge in a `Popover` rendering the short-form list; pass `onSelectUnit` to focus the map.
- `src/components/EnhancedMafiaHexGrid.tsx` — add the conditional Income sub-card to the hex info card.

## Verification

- Click `🚨 Threats: N` in the top bar → popover opens with grouped one-line rows.
- Click a row with a hex target → map focuses that unit, popover closes.
- New game (0 threats) → popover shows "All clear" in muted emerald.
- Hover/pin a player-owned business hex → see Income line; Supply/Heat/Erosion/Passive-gain lines appear only when active.
- Pin an empty or rival-owned hex → no income sub-card.
- Pin an eroding owned hex → see `🌊 Eroding (Nt until flip)` line.

## What Doesn't Change

Threat detection logic. Right-sidebar `ThreatBoardPanel` UI. Hex info card position (bottom-left), styling theme, click-for-actions behavior. Map legend. All existing hex info sections (owner, terrain, business, supply node, HQ, fortification, scout intel, negotiation, units).

