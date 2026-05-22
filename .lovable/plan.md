## Update Quick Reference Guide — Combat section

Target file: `src/components/GameGuide.tsx` (only the `combat` section).

### 1. Refresh hit heat values to match current code

Current code uses `heatGain = min(25, 8 + units*2)`, then ×1.5 for Blind, ÷2 for Scouted, base for Planned, all scaled by `HEAT_GAIN_MULT (1.30)`. Replace the static numbers with ranges that match what players actually see:

- Blind Hit (unscouted) → "40–60% success · +12–18 heat" (was +15)
- Scouted Hit → "60–80% success · +5–8 heat" (was +10)
- Planned Hit (Phase 2+) → "85–95% success · +8–12 heat" (was +5)

Note in a Tip that heat scales with the number of units involved on both sides.

### 2. Add Push Out as a new combat entry

Insert a new subsection in the Combat card titled "Push Out (empty rival hex)":

- Uncontested (no defenders) → auto-success · +2 heat · no civilian-casualty risk
- Contested (defenders present) → light combat · +4 heat · unknown defenders if unscouted
- Only available on rival hexes with no business and no HQ
- Tip: prefer Push Out over Blind Hit on empty tiles — it's the low-heat way to evict rivals and never triggers civilian casualties

### 3. Add "push out", "empty hex", "evict" to the combat section's `keywords` array so search surfaces it.

No other sections change. No gameplay/logic changes.
