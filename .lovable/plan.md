

# Build the Threat Board Panel

A single consolidated right-sidebar section that surfaces every active threat and opportunity in one place, replacing the need to scan 5 different panels each turn.

## What Goes In It

A new collapsible section in the right sidebar titled **"⚠️ Threat Board"** with up to 5 grouped subsections (each rendered only if it has entries):

1. **🎯 Incoming Hits** — rival Plan Hits detected against your units (fog-of-war gated: only shown if you have intel on that rival per existing `fog-of-war` rules). Shows target unit + turns until execution.
2. **🔪 Active Hitman Contracts** — yours (with ETA + target) and any against you that intel reveals.
3. **⚔️ Wars & Ceasefires** — every active war, ceasefire timer, and pact about to expire (≤2 turns). Pulls from existing diplomacy state.
4. **🌊 Erosion / Expansion Watch** — Phase 3+ only. Districts where your hexes are 1 turn from flipping neutral via erosion, OR rival hexes 1 turn from flipping yours via expansion.
5. **💰 Bounties & Marks** — bounties placed on your capos, soldiers marked-for-death, low-loyalty (<40) soldiers at betrayal risk.

Each row is **click-to-pan**: clicking pans the map to the relevant hex/unit (reuses the same handler the Deployed Units list now uses).

## Behavior

- **Default state**: collapsed (matches existing right-sidebar default-collapsed memory rule).
- **Header badge**: shows total threat count, e.g. `⚠️ Threat Board (4)` — colored red if ≥1 incoming hit or war, amber if only soft threats, hidden if 0.
- **Empty state**: when expanded with 0 threats, show "All quiet. No active threats." in muted text.
- **Auto-expand override**: on the first turn an incoming hit is detected, briefly auto-expand once and pulse the header (then respect user collapse).
- **No new game state**: purely a derived/read-only view of existing state (`plannedHit`, `hitmanContracts`, `tensionMatrix`, `wars`, `pacts`, `deployedUnits`, `soldierStats`, `influenceErosion`, `bounties`).

## Files Touched

1. **`src/components/ThreatBoardPanel.tsx`** (new) — derives all 5 sections from game state, renders collapsible card with click-to-pan rows.
2. **`src/components/GameSidePanels.tsx`** — mount `<ThreatBoardPanel />` near the top of the right sidebar (above existing rival/supply sections), pass game state + `onPanToHex` callback.
3. **`src/pages/UltimateMafiaGame.tsx`** — wire the existing pan-to-hex callback (already created for the Deployed Units fix) through to the new panel.

No new dependencies. No state-shape changes. No strategic mechanic changes — purely surfacing what already exists.

