

# Action Feedback System — Show Why Actions Are Unavailable

## Problem
Currently, disabled actions either grey out silently (side panel buttons) or don't appear at all (hex context menu). Players have no way to know *what conditions they're missing* to perform an action.

## Changes

### 1. `ActionButton` Component — Add `disabledReason` prop
**File:** `src/components/GameSidePanels.tsx` (lines 649-673)

- Add optional `disabledReason?: string` prop to `ActionButton`
- When `disabled && !phaseLocked`, replace the `sublabel` text with the `disabledReason` in a red/amber color (e.g., `text-destructive/70`)
- When `phaseLocked`, keep current lock icon behavior (phase lock is already clear)

### 2. Side Panel — Compute specific reasons for each action
**File:** `src/components/GameSidePanels.tsx`

For every `ActionButton`, derive a `disabledReason` string from the same conditions already checked in `disabled`:

| Action | Current `disabled` check | `disabledReason` |
|---|---|---|
| Plan Hit | `soldiers < 1 \|\| jailed` | "Need 1 soldier" / "Jailed" |
| Sabotage Rival | `money < 12000 \|\| jailed` | "Need $12,000" / "Jailed" |
| Extort Business | `jailed` | "Jailed" |
| Restaurant/Store/Construction | `money < X \|\| jailed \|\| actions <= 0` | "Need $X" / "No actions left" / "Jailed" |
| Launder Money | `dirtyMoney < 1000 \|\| jailed` | "No dirty money" / "Jailed" |
| Buy Mercenary | `money < cost \|\| tacticalActions <= 0` | "Need $X" / "No tactical actions" |
| Recruit Loyal | `!canRecruit \|\| money < cost \|\| tacticalActions <= 0` | "Need X hexes (have Y)" / "Need $X" / "No tactical actions" |
| Public Appearance | `money < 3000 \|\| actions <= 0` | "Need $3,000" / "No actions left" |
| Charitable Donation | `money < 5000 \|\| actions <= 0` | "Need $5,000" / "No actions left" |
| Hire Lawyer | `money < 8000 \|\| actions <= 0 \|\| cooldown` | "Need $8,000" / "No actions left" / cooldown already shown |

Logic: check conditions in priority order, return the first failing reason.

### 3. Hex Context Menu — Show unavailable actions greyed out with reason
**File:** `src/components/EnhancedMafiaHexGrid.tsx` (lines 724-850)

Currently the menu only renders actions where `canXxx` is true. Change to:
- Always show all *contextually relevant* actions (e.g., don't show "Claim" on enemy hex — that's never possible). But show actions that are *close* to being available with a reason.
- For the action menu, compute a `reason` for each action that evaluates to false:
  - `canHit` false on neutral hex → don't show (irrelevant). False because no actions left → show greyed: "No actions left"
  - `canExtort` false because soldier not on hex → show greyed: "Soldier must be on this hex"
  - `canExtort` false because no illegal business → show greyed: "No illegal business"
  - `canClaim` false because hex has a business → show greyed: "Hex has a business (extort instead)"
  - `canSabotage` false because no business → show greyed: "No business to sabotage"
- Greyed actions: `opacity-40`, no click handler, reason in `text-[8px]` below the label

### 4. Tactical Buttons — Specific disable reasons
**File:** `src/pages/UltimateMafiaGame.tsx` (lines 534-557)

Currently disabled only when `tacticalActionsRemaining <= 0`. Add per-action reasons:
- Scout: "Select a soldier first" (no unit selected) / "No adjacent enemy hex" (unit selected but no valid target) / "No tactical actions left"
- Fortify: "Select a unit first" / "Already fortified" / "No tactical actions left"
- Escort: "Select a soldier first" / "No capo nearby" / "No tactical actions left"
- Safehouse: "Select a capo first" / "Must be on your territory" / "No tactical actions left"

Show reason as a small text line below the button row, or as a tooltip on hover.

## Files Modified
- `src/components/GameSidePanels.tsx` — `ActionButton` component + all action disabled reasons
- `src/components/EnhancedMafiaHexGrid.tsx` — hex context menu greyed actions with reasons
- `src/pages/UltimateMafiaGame.tsx` — tactical button disable reasons

