# Plan: Downloadable Condensed Game-Logic README

## Goal
Produce a single, clean, downloadable **Markdown** file that gives a condensed overview of the game's logic and mechanics — the key rules and tables, not the full deep-dive.

## Source
Consolidate and condense from the existing in-repo docs:
- `GAME_MECHANICS.md` (core: turns, map, economy, AI, diplomacy, victory, phases)
- `COMBAT_SYSTEM_GUIDE.md` (hit/extort/claim summary)
- `HEADQUARTERS_SYSTEM_GUIDE.md` (HQ, deployment, sitdown)
- `SOLDIER_RECRUITMENT_GUIDE.md` (recruitment, promotion, maintenance)

## Deliverable
- File written to `/mnt/documents/BOSS_OF_ALL_BOSSES_README.md`
- Emitted as a `<presentation-artifact>` so the user can preview/download it.
- No project source files are changed.

## Document outline (condensed)
1. **Overview & the Five Families** — one-line specialty + starting stats table.
2. **Map & Turn Structure** — map sizes table, the Deploy → Tactical → Action loop, action/tactical budgets.
3. **Units & Movement** — soldiers vs capos vs boss vs hitmen, free-connected movement, stacking limit.
4. **Combat (Hit / Extort / Claim)** — compact table: scouted vs blind vs planned; success range; outcomes.
5. **Economy & Businesses** — 4 business types + costs, capo vs soldier income, maintenance, bankruptcy.
6. **Reputation, Heat & Prosecution** — 5 metrics, heat tiers, prosecution thresholds table.
7. **Diplomacy & War** — tension scale, war triggers, pact types.
8. **AI Opponents** — personality table, difficulty modes.
9. **Victory Conditions** — 4 paths + targets.
10. **Quick Reference** — bullet cheat-sheet of key numbers (costs, caps, cooldowns).

## Verification
- Read the generated file to confirm it renders cleanly (headings, tables, no broken markdown).
- Confirm the artifact tag references the correct path/mime.
