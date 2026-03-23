
# Event System Refinement — COMPLETED

## Changes Applied
1. **Removed 3 events**: Market Opportunity, Celebrity Endorsement, Dock Workers Strike
2. **Refined Internal Betrayal**: loyalty-gated (< 40), 3 choices (confront/promote/ignore), defection mechanic with `pendingDefection` flag resolved in `endTurn`
3. **Merged Rat/Federal**: escalating 2-stage event with `ratIgnored` state flag. Stage 1 at heat > 30, Stage 2 at heat > 60 + ratIgnored. Independent federal at 30% chance if heat > 60 without rat.

## Final Event Pool (7 events)
1. Police Raid — unchanged
2. Rival Meeting — unchanged
3. Informant Tip — unchanged
4. Weapons Shipment — clean buy/sell
5. Political Scandal — unchanged
6. Internal Betrayal — loyalty-gated, 3 choices, defection risk
7. Rat in the Ranks / Federal Investigation — escalating event chain
