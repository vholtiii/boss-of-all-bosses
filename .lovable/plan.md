

# Update All README/Guide Files with New Mechanics

## What Changed Since Last Doc Update
Two major systems were implemented but never documented:
1. **Prosecution Risk System** — risk meter, Grand Jury Subpoena at 60+, arrest timer at 50+, federal indictment at 90+
2. **Purge Ranks / Counter-Intelligence System** — detection of rats via bribes/suspicion/self-scouting, Boss elimination action

## Files to Update

### 1. `README.md`
- Add **Prosecution Risk** subsection under "Reputation & Police Heat" summarizing the 3 thresholds (50+ arrest timer, 60+ illegal profit penalty, 90+ federal indictment)
- Add **Counter-Intelligence & Purge Ranks** subsection under "Units & Personnel" or as its own section, covering detection paths (bribe officials, suspicion markers, self-scouting) and the Boss elimination action
- Add Purge Ranks to the Boss Actions list in the overview

### 2. `GAME_MECHANICS.md`
- Add new **Section 26: Prosecution Risk System** with the three tiers, timers, and constants
- Add new **Section 27: Counter-Intelligence & Purge Ranks** covering:
  - Three detection paths (Captain/Chief/Mayor bribe discovery, suspicion markers at loyalty <40 for 2+ turns, self-scouting own hexes)
  - Elimination action mechanics (1 action, action phase only, 1 per turn)
  - Confirmed rat vs innocent outcomes with exact numbers
- Update **Section 12 (Police Heat & Corruption)** to reference prosecution risk
- Update **Section 15 (Boss Actions)** to add "15.5 Purge Ranks"
- Update Table of Contents

### 3. `SOLDIER_RECRUITMENT_GUIDE.md`
- Add new **Section 4.2: Suspicion & Informant Flags** under Soldier Stats explaining `suspiciousTurns`, `suspicious`, and `confirmedRat` fields
- Add new **Section 9: Purge Ranks (Eliminating Soldiers)** covering the mechanic and consequences

### 4. `COMBAT_SYSTEM_GUIDE.md`
- No major changes needed — Purge Ranks is a Boss action, not a combat action. Add a brief note in Section 8 (Flip Soldier) cross-referencing the counter-intelligence system for detecting flipped soldiers on your own side.

### 5. `HEADQUARTERS_SYSTEM_GUIDE.md`
- Update **Section 10 (HQ Information Panel)** to mention the Purge Ranks section in the HQ panel
- Add brief mention under Boss Actions referencing Purge Ranks as a Boss HQ action

## Technical Details

All changes are documentation-only (Markdown files). No code changes. Constants referenced from `src/types/game-mechanics.ts`:

| Constant | Value | Context |
|---|---|---|
| `PROSECUTION_ARREST_THRESHOLD` | 50 | Starts arrest timer |
| `PROSECUTION_ARREST_TIMER` | 3 turns | Consecutive turns at 50+ |
| `GRAND_JURY_THRESHOLD` | 60 | Illegal profit -30% |
| `FEDERAL_INDICTMENT_TIMER` | 3 turns | At 90+, 3 turns to respond |
| `FEDERAL_INDICTMENT_DEFENSE_COST` | $25,000 | Lawyer cost |
| `PURGE_CONFIRMED_FEAR/HEAT` | +5/+3 | Killing a confirmed rat |
| `PURGE_INNOCENT_LOYALTY_PENALTY` | -5 | Killing an innocent |
| `PURGE_INNOCENT_RESPECT_LOSS` | -3 | Wrongful kill |
| `PURGE_BRIBE_CAPTAIN_DISCOVER_CHANCE` | 25% | Captain reveals rats |
| `PURGE_BRIBE_CHIEF_DISCOVER_CHANCE` | 40% | Chief reveals rats |

