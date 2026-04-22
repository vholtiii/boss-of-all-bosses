

# Make the Threat Board Always Visible

## Problem

`ThreatBoardPanel` is rendered inside `GameSidePanels.tsx` (right sidebar, top of the panel stack), but it returns `null` whenever there are zero active threats:

```ts
if (totalCount === 0) return null;
```

Since incoming hits, wars, hitman contracts, erosion, and bounties are all rare (especially in Phase 1), most players never see the panel at all and conclude it doesn't exist. There's also no top-bar indicator pointing to it.

## Fix

### 1. Always render the Threat Board header

Remove the `totalCount === 0` early return. When there are no threats, show a calm "All Clear" state instead:

- Header still says **THREAT BOARD** with the alert-triangle icon (muted/green tint instead of amber/red).
- Badge shows `0` in muted styling.
- Collapsed by default; expanding reveals "All quiet. No active threats." (the empty-state copy already exists in the component).
- No pulse animation, no border glow when count is 0.

### 2. Tone tiers (already partially there, just extend to "calm")

- `count === 0` → muted/emerald tone, neutral border, no pulse.
- `count > 0, no critical` → amber (current "warn" styling).
- `count > 0, critical present` → destructive red + pulse if incoming hit (current behavior).

### 3. Status HUD entry (top bar)

Add a small **Threats** badge to the top-bar status HUD strip (per `mem://ui/status-hud`) that mirrors the count and tone, so the player sees `Threats: 0` / `Threats: 3 ⚠` at a glance and knows where to look in the right sidebar.

- Click on the badge could optionally scroll the right sidebar to top — nice-to-have, not required for this pass.

## Files Touched

- `src/components/ThreatBoardPanel.tsx` — remove the `totalCount === 0` early return; add muted "All Clear" tone branch for zero-count header styling.
- `src/components/GameSidePanels.tsx` (or wherever the top-bar HUD strip lives — will grep for status HUD badges) — add a Threats badge that reads the same `aiPlannedHits` / `activeWars` / `hitmanContracts` / etc. counts.

## Verification

- Start a new game → right sidebar shows "THREAT BOARD · 0" in muted tone, collapsed.
- Expand it → "All quiet. No active threats."
- Trigger a war or get a planned hit detected → badge turns amber/red, count updates, pulse on incoming hits.
- Top-bar Threats badge mirrors the same count and tone.

## What Doesn't Change

Threat detection logic (incoming hits, wars, ceasefires, erosion, bounties, marks). Auto-expand on first incoming hit. Click-to-jump-to-unit behavior. Badge color tiers when threats > 0.

