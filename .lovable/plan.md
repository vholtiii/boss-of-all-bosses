
# ✅ COMPLETED: Hit Territory Mechanic Overhaul

All 6 fixes implemented. See commit for details.

| Aspect | Before | After |
|---|---|---|
| Participants | All adjacent units | Selected unit + units on target hex |
| Success calc | 80% or 20% | Scaled 0.5 + (attackers-defenders)*0.15, capped 10%-95% |
| Reward | +$5,000 + 10 respect | +5 fear + 5 respect (no money) |
| Casualties | First in array die | Random selection (shuffle) |
| Heat | Flat +15 | 8 + 2 per unit involved (cap 25) |
| Capo hit | No | Yes |
