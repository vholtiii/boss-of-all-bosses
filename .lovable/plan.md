

# Add Prosecution Risk to Threat Board

## Problem

The Threat Board currently surfaces incoming hits, hitman contracts, wars, erosion, bounties, and marks — but not **Police Heat** or **Prosecution Risk**, the two systems that actually arrest your soldiers. A player can be one turn from a federal indictment with zero indication on the threat panel.

## Fix

Add a new **"Law Enforcement"** section to `ThreatBoardPanel.tsx`, positioned between "Wars & Ceasefires" and "Territory Watch". Rows surface based on thresholds:

### Prosecution Risk rows
- **Risk ≥ 50** with active consecutive-turn counter → critical row: `Federal indictment in {3 - consecutiveTurns}t` · badge `INDICTMENT` (red).
- **Risk ≥ 50** but counter at 0 → soft row: `Prosecution risk {value}/100` · badge `RISK` (amber).
- **Risk 30–49** → soft row: `Prosecution risk climbing ({value}/100)` · badge amber.

### Police Heat rows
- **Heat ≥ 90** (Tier 4 / RICO fuse) → critical row: `RICO investigation — {ricoTurnsRemaining}t fuse` · badge red `RICO`.
- **Heat ≥ 70** (Tier 3) → critical row: `Heat critical ({heat}/100) — arrests likely` · badge red.
- **Heat ≥ 50** (Tier 2 / arrest threshold) → soft row: `Heat high ({heat}/100) — 20% arrest chance/turn` · badge amber.
- **Heat 30–49** (Tier 1) → soft row: `Heat elevated ({heat}/100)` · badge amber muted.

### Active arrests / indictments (informational)
- For each jailed/indicted soldier in `soldierStats` (or wherever jail state lives — will grep), add a row: `Soldier jailed ({turnsRemaining}t)` · clickable to jump to unit if still on map. Soft tone.

## Counter updates

- `totalCount` and `hasCritical` automatically include the new section's rows (existing reduce logic).
- Top-bar Threats badge in `UltimateMafiaGame.tsx` gets the same additions so the HUD count stays in sync. Add: heat ≥ 50 (+1), prosecution risk ≥ 50 (+1), RICO active (+1, critical), each jailed soldier (+1).

## Files Touched

- `src/components/ThreatBoardPanel.tsx` — add Law Enforcement section with the rows above; import `Gavel` or `Scale` icon from lucide-react.
- `src/pages/UltimateMafiaGame.tsx` — extend the top-bar Threats badge aggregation to include heat/prosecution/jail counts and critical-tone triggers.

## Verification

- New game → Heat 0, Risk 0 → Threat Board still shows "All Clear" (0).
- Sabotage a few times until Heat hits 50 → Threat Board shows amber Law Enforcement row; HUD badge increments and turns amber.
- Drive Risk ≥ 50 for 3 turns → row turns red `INDICTMENT 1t`; HUD goes red.
- Soldier gets jailed → row appears under Law Enforcement showing turns remaining.

## What Doesn't Change

Heat/prosecution mechanics, arrest probabilities, RICO fuse logic, all existing Threat Board sections, auto-expand on incoming hit, click-to-jump behavior.

