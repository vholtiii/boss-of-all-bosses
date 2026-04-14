

# Play 25-Turn Simulation — Post-Fix Balance Check

## Goal
Run an automated 25-turn game simulation to verify:
1. AI income is capped properly (no runaway scaling past turn 20)
2. AI soldier counts stay within the 18-base cap (18-24 with bonuses)
3. AI families remain competitive with each other (no single family snowballs)
4. The fixes didn't break core gameplay loops

## Approach
Write a Node.js simulation script (like the previous report) that models the core economy and recruitment loop for all 5 AI families over 30 turns on Normal/Medium settings. Track per-turn snapshots of each family's money, soldiers, territory, and income. The player will follow a simple expand-and-extort strategy.

### Metrics to Report
- Per-family income at turns 5, 10, 15, 20, 25, 30 (should plateau after turn 20)
- Per-family soldier count at those same checkpoints (should cap around 18-24)
- Territory distribution — are families converging or is one dominating?
- Inter-AI competition — do AI families fight each other or only the player?

### Expected Results (Pass/Fail Criteria)
- **PASS**: No AI family exceeds ~$12k min income on Normal/Medium after turn 20
- **PASS**: No AI family exceeds ~24 soldiers (18 base + 6 max bonuses)
- **PASS**: Territory spread across families stays within 2:1 ratio (largest:smallest)
- **FAIL**: Any family hits $20k+ income or 30+ soldiers

## Output
A markdown report at `/mnt/documents/post_fix_balance_report.md` with turn-by-turn tables and a summary verdict.

## Files
- `/tmp/balance_check.js` — simulation script (ephemeral)
- `/mnt/documents/post_fix_balance_report.md` — results report

