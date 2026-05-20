# Refresh Corruption HUD and UX

Goal: make the 4-tier bribe system easier to read at a glance, clearer about phase/budget gating, and visible from the main status area — without changing any underlying mechanic, cost, success formula, or AI behavior.

## Scope

- Visual + interaction refresh of `CorruptionPanel.tsx` (the collapsible sidebar card body).
- Small status indicator added to the existing top status strip (above the Heat Tier indicator) so active bribes are visible while the Corruption section is collapsed.
- No changes to `useEnhancedMafiaGameState.ts` reducer logic, no changes to `BRIBE_TIERS`, costs, success math, duration, or the `bribe_corruption` action handler.

## CorruptionPanel refresh

Replace the current flat list with a tighter, board-game styled card layout.

1. **Header strip** at top of the panel:
   - Left: small "Tactical · 1 action" pill (uses `phaseIsTactical` + `actionsRemaining`).
   - Right: `{activeBribes.length}/4 contracts` badge.
   - When `!phaseIsTactical`: full strip greyed with a single line "Available in Tactical step" (replaces the current outer lock paragraph from `GameSidePanels`).

2. **Tier rows** (one per tier, always rendered, including locked):
   - Row left: tier icon in a circular chip tinted per state (locked = muted, available = card, active = primary, unaffordable = destructive border).
   - Row mid: tier label + one-line effect; second line shows cost, duration, success% with the existing color bands.
   - Row right: state-aware control
     - Locked → "🔒 Phase 2/3" chip (same gating logic as today).
     - Active → ring progress + `{turnsRemaining}t` label; target family shown as a small chip if any.
     - Available → primary action button (Bribe) with the same disabled logic and tooltip messages as today.
   - Affordability is shown by tinting the cost number red when `money < cost` (already partially there, applied uniformly).

3. **Target selector** only renders when the user is about to act on a tier that needs a target (captain/chief/mayor) AND that tier is available and not already active. Otherwise hidden. Default selection unchanged.

4. **Empty / all-active state**: when all 4 tiers are active, replace the action area with a single "All channels engaged" footer line.

5. Keep the same component props and `onBribe` signature; this is purely a presentation refactor.

## Status HUD addition

In `GameSidePanels.tsx`, in the existing status block that already renders the Heat Tier indicator (around the heat tier lines), add — directly above the heat tier — a compact Corruption HUD line:

- Hidden when `activeBribes` is empty.
- Otherwise renders one chip per active bribe: tier icon + `{turnsRemaining}t`, color-tinted to match the panel's active-tier color.
- Soonest-expiring chip pulses (CSS animation already in the theme) when `turnsRemaining <= 1`.
- Clicking the strip opens the Corruption collapsible section (`toggle('corruption')`) and scrolls it into view.

This gives players a persistent at-a-glance read on bribe coverage without expanding the section every turn.

## Out of scope

- No changes to mechanics, AI, costs, or formulas.
- No changes to `bribe_corruption` action, `aiSpendOnHeatReduction`, or any test.
- No changes to game guide copy beyond what's already correct.

## Technical notes

- Files touched:
  - `src/components/CorruptionPanel.tsx` — UI rewrite within the same component; props unchanged.
  - `src/components/GameSidePanels.tsx` — add the small HUD strip above the heat-tier indicator inside the existing status block, and remove the now-redundant outer "Unlock in Tactical step" paragraph (lock state is handled inside the panel header).
- Styling uses existing semantic tokens (`primary`, `muted-foreground`, `destructive`, `border`, `bg-card`) and existing tier color classes (`text-green-400`, `text-yellow-400`, `text-destructive`) already used in this file — no new tokens added.
- Reuses existing icons from `lucide-react` (`Gavel`, `Shield`, `Eye`, `Crown`, `Timer`).
- Ring progress for active bribes is rendered via a small inline SVG (no new dependency).
