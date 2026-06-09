## Lawyer Retainer Countdown Bar + Expiry Alert

### What
Replace the plain-text lawyer active badge in the Defense & Law section with a visual countdown progress bar and an explicit "about to expire" alert.

### How
1. **Countdown Progress Bar** — Inside the existing active-lawyer badge (line ~770), add a `<Progress>` bar whose `value` is `(turnsLeft / totalDuration) * 100`. Color it green when healthy (>40%), yellow at low remaining (≤2 turns), and red at final turn.

2. **Expiry Alert** — When `turnsLeft <= 2`, render an additional warning pill directly below the progress bar (inside the same badge container):
   - `turnsLeft === 2`: amber border + "Retainer expires in 2 turns — consider renewing"
   - `turnsLeft === 1`: red border + animate-pulse + "Last turn! Retainer expires after this turn"

3. **Update Turn Counter** — Keep the existing `{turnsLeft}/{totalDuration} turns` text beside the tier name, but move it above the progress bar for better hierarchy.

4. **No state changes** — This is purely presentational; `lawyerActiveUntil`, `lawyerTier`, and `lawyerCooldownUntil` already drive the logic.

### Files
- `src/components/GameSidePanels.tsx` — add progress bar and alert pills inside the active-lawyer badge block (lines ~767–815).

### Out of scope
- No changes to lawyer mechanics, costs, or cooldowns.
- No new notifications or sounds.