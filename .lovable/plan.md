
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

---

# Scout System Refinement — COMPLETED

## Changes Applied
1. **Decay Model**: Added `freshUntilTurn` to `ScoutedHex` (scoutedTurn + 1). Turn 1: live data from deployedUnits. Turns 2-3: stale snapshot with "⚠️ STALE INTEL" indicator.
2. **Scout Intel Bonus Scaling**: Fresh intel = +15% hit success. Stale intel = +7% hit success. Added `SCOUT_STALE_BONUS` constant.
3. **Detection Chance**: 15% chance on enemy hex scouting. No heat increase but AI gets `reinforceTarget` flag — prioritizes moving units to detected hex. Player notified. Neutral hexes have no detection risk.
4. **AI Reinforcement**: `reinforceTargets` array on game state, expires after 3 turns. AI units prioritize moving toward flagged hexes during movement phase.
5. **Neutral Hex Scouting**: Allowed, shows business info only.
6. **Tooltip Upgrade**: Fresh intel shows blue styling with live unit count. Stale shows amber styling with snapshot + "may be outdated" warning.
