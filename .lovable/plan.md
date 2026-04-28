## Goal

Make the Hitman panel's "Blind (Captain)" tab self-explanatory: show *which* families are eligible under each bribe tier, *why* they're eligible (Captain target-scoped vs Chief/Mayor map-wide), and—when the tab is empty—exactly which bribe requirement is missing.

All edits are in `src/components/HitmanPanel.tsx`. No logic changes; UI/labeling only.

## Changes

### 1. Track *source* of eligibility, not just family list

Replace the flat `captainBribedFamilies: Set<string>` with a map that records why each family is unlocked:

```ts
type BlindSource = { tier: 'police_captain' | 'police_chief' | 'mayor'; scope: 'targeted' | 'map-wide' };
const blindEligibility = new Map<string, BlindSource>(); // family → highest-tier source
```

When walking `activeBribes`, prefer the strongest source (Mayor > Chief > Captain) so the badge reflects the best active intel.

### 2. Tab header — always visible, with status

Show the "Blind (Captain)" tab unconditionally (not gated behind `hasAnyCaptain`) so players can discover the feature. When no eligibility exists, the tab is selectable but renders an explanatory empty state instead of being hidden.

Update tab label to: **"Blind Hits"** with a small lock icon when no bribes qualify.

### 3. Per-family eligibility badge

Inside the Blind tab, on each eligible family card, replace the generic purple header with a labeled chip indicating the intel source:

- Captain → amber chip: **"via Police Captain (target intel)"**
- Chief → blue chip: **"via Police Chief (map-wide intel)"**
- Mayor → gold chip: **"via Mayor (full map intel)"**

Also add a one-line note under the family name: "Hidden units in this family can be targeted." The existing soldier/capo count buttons stay.

### 4. Ineligible families — show, don't hide

List *all* rival families in the Blind tab, not just eligible ones. Ineligible families render greyed-out with a clear missing-requirement line:

- No bribe at all → **"Locked — bribe a Police Captain on this family, or a Police Chief / Mayor for map-wide intel."**
- Patrol Officer only on this family → **"Locked — Patrol Officer doesn't provide intel. Upgrade to Police Captain or higher."**

The buttons (A Capo / A Soldier) are disabled for these rows.

### 5. Empty-state panel (when no rival has any qualifying bribe)

Replace the current single-line italic text with a structured callout at the top of the Blind tab:

```
🔒 Blind Contracts unavailable
Requires one of:
  • Police Captain bribe on a specific rival family ($2,000 — target-scoped)
  • Police Chief bribe ($8,000 — map-wide, all rivals)
  • Mayor bribe ($25,000 — map-wide, all rivals)
Open the Corruption panel to bribe an official.
```

Costs are pulled from `BRIBE_TIER_DATA` (already imported via `BribeContract` types) so they stay in sync.

### 6. Tooltip on the Blind tab trigger

Add a tooltip (using existing `@/components/ui/tooltip`) explaining: "Hire a hitman against an unscouted target. Requires Police Captain (target-scoped) or Chief/Mayor (map-wide) bribe."

## Files Touched

- `src/components/HitmanPanel.tsx` — eligibility map, always-visible Blind tab, per-family source chips, ineligible rows with missing-requirement copy, structured empty state, tooltip.

## What Doesn't Change

- Hitman cost ($30k), MAX_HITMEN, Phase 3 gate, contract resolution backend.
- Known Targets tab behavior.
- Bribe tier definitions or corruption panel.
