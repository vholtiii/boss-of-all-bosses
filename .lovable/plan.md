

# Update All Game Documentation to Match Current Code

## Discrepancies Found

| Issue | Current Docs | Actual Code |
|---|---|---|
| Hitman cost | $15,000 | $30,000 |
| Hitman refund | $7,500 | $15,000 (50% of $30K) |
| Fortify cap | No limit mentioned | Max 4 per family |
| Tension & War system | Missing entirely | Full system implemented |
| Hitman global tension | Not mentioned | +5 soldier / +15 capo globally |
| Fortify hover tooltip | Not mentioned | Shows age, status, bonuses, countdown |

## Changes Per File

### `README.md`
- Line 104: Hitman cost $15,000 → $30,000
- Line 129: Add "Max 4 per family" to Fortify description
- Line 157: Hitman contracts max 3 — add "$30,000" cost
- Add new **Tension & War** section under Core Systems covering: tension meter (0-100), builders (hits +10, plan hit +15, extortion +8, encroachment +12, sabotage +15, pact break +30), reducers (ceasefire -25, alliance -35, supply deal -15, share profits -10, safe passage -8, bribe territory -5), war trigger at 80, plan hit on capo = instant war, war effects (10 turns, diplomatic lockout, forced aggression, -20% border income), hitman global tension (+5/+15), max 2 simultaneous wars

### `GAME_MECHANICS.md`
- Section 4.4 (line 168): Hitman cost $15,000 → $30,000
- Section 7.2 (line 227): Add "Max 4 per family on the map" to Fortify, mention hover tooltip showing age/status/bonuses/countdown
- Add new **Section 22: Tension & War System** with full tables for builders, reducers, war effects, post-war state, and AI behavior during war

### `COMBAT_SYSTEM_GUIDE.md`
- Section 5.1 (line 159): Add "Max 4 per family" to Fortification
- Section 5.3 (line 167): Hitman cost mention → $30,000
- Add new **Section 10: Tension & War in Combat** — how hits/extortion raise pair tension, hitman kills raise global tension, plan hit on capo = instant war, war combat modifiers

### `HEADQUARTERS_SYSTEM_GUIDE.md`
- Add brief note about war system's effect on HQ (AI forced aggression during war targets warring family, fortifies HQ-adjacent hexes)

### `SOLDIER_RECRUITMENT_GUIDE.md`
- Section 6.1 (line 138): Hitman cost $15,000 → $30,000
- Section 6.3 (line 167): Refund $7,500 → $15,000
- Section 7 (line 179): Hitman contract cost $15,000 → $30,000
- Add note about hitman kills raising global tension (+5 soldier, +15 capo)
- Add "Max 4 fortifications per family" context where relevant

## Scope
Text-only updates across 5 markdown files. No code changes.

