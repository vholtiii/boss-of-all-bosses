# Update READMEs for AI heat parity

Document the new AI heat parity changes so the docs match the implemented behavior. Three doc files reference police heat; two need substantive updates, one needs a one-line note.

## Files to update

### 1. `README.md` — section "Reputation & Police Heat" (≈ line 168)
Add a short bullet noting that AI families incur the same heat from claims, extorts, hits, and passive biz operations as the player, with the same per-turn decay (−2), tier income penalties (−25% at ≥40, −35% at ≥70), prosecution arrests, and a RICO equivalent (3 turns at ≥90 → that family is dismantled).

### 2. `GAME_MECHANICS.md` — section "12. Police Heat & Corruption" (≈ line 326)
Add a new sub-section **"12.x AI Heat Parity"** that lists:
- AI uses the same `HEAT_GAIN_MULT (1.30)` and difficulty `policeHeatMult` as the player.
- Per-action rates: claim +3, neutral extort +8, rival extort +12 (success) / +17 (fail), hits with same `min(25, 8 + units×2)` formula and scouted/blind/planned modifiers.
- Passive heat from owned illegal businesses (suppressed during Lay Low).
- Heat decay −2/turn.
- Tier income penalties (−25% ≥40, −35% ≥70).
- Prosecution arrests (heat ≥30, soldiers only, 4–7 turn sentence).
- RICO equivalent: 3 consecutive turns at ≥90 eliminates that AI family (HQ falls, hexes neutralized, units removed).

### 3. `COMBAT_SYSTEM_GUIDE.md` — section "2.6 Police Heat from Hits" (≈ line 111)
Add a one-line note that the same formula and modifiers apply to AI hits.

## Out of scope
- `HEADQUARTERS_SYSTEM_GUIDE.md` and `SOLDIER_RECRUITMENT_GUIDE.md` — heat refs there are about specific player UI/flows that don't change.
- No new diagrams or restructuring; just additive updates.
