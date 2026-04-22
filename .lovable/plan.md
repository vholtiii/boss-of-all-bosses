

# AI Hit Rules Parity — Same Risks & Consequences as Player

The AI currently has shortcuts when attacking rival territory (no civilian-hit risk on blind hits, sometimes skips heat scaling, no bounty, no penalty for hitting allies/breaking ceasefire). This plan brings the AI fully in line with player rules.

## Rules to Enforce on AI Hits

When an AI family attacks a rival-controlled hex, all of the following must apply identically to the player:

1. **Scout state classification** — AI hits are categorized as **Scouted**, **Blind (unscouted)**, or **Planned** based on whether that AI family has fresh/stale scout intel on the target hex (or a planned-hit marker).
2. **Success modifiers** — same formula:
   - Scouted: +15% (fresh) / +7% (stale)
   - Blind: −20%
   - Planned: +20% (+10% if relocated), bypasses fortified defender penalty
   - Family bonuses, fortification (±), clamped 10–95%
3. **Heat scaling** — AI generates police heat for its own family using the same tiers:
   - Scouted: 50% base
   - Blind: 150% base
   - Planned: 100% base
4. **Casualties** — same 20% on victory / 40% on defeat, fortified 50% reduction; Planned hit = zero attacker casualties on success.
5. **Civilian Hit risk (Blind only, no enemies on hex)** —
   - AI family heat set to **100 (max)**
   - Attacking AI soldier removed, enters 3-turn hiding
   - Return check: loyalty ≥ 70 returns, < 70 permanently lost
6. **Blind-hit bounty** — placed on the AI family for 3 turns; targeted family attacks them with same modifiers as when the player triggers it.
7. **Plan Hit on capo** — triggers **instant war** between AI and victim (same as player rule).
8. **Diplomacy penalties** —
   - Attacking allied family: alliance broken, −25 respect, −15 reputation, −40 relationship
   - Breaking ceasefire: ceasefire voided, −15 respect
9. **Tension** — same +10 pair tension on any territory hit (success or fail), +15 on Plan Hit success, +instant-war on Plan Hit capo kill.
10. **Plan Hit failure** — −5 reputation and −10 planner loyalty for the AI family too.

## Files Touched

1. **`src/hooks/useEnhancedMafiaGameState.ts`** — AI combat resolution path:
   - Locate the AI `attack` / `hit` action handler inside `processAITurn` (around the AI action-loop where it resolves attacks on rival hexes).
   - Refactor to call the **same shared hit-resolution helper** the player uses (or, if no shared helper exists, extract the player's hit logic into one and have both call sites use it). This is the cleanest fix and prevents future drift.
   - Pass the AI's scout intel map, fortification state, family bonuses, and target context.
   - Apply heat to the AI family (not the player).
   - Apply civilian-hit consequences (heat 100, soldier hiding) to the AI when blind-hitting an empty rival hex.
   - Apply bounty marker against the AI family on blind hits.
   - Apply diplomacy penalties (alliance break, ceasefire break) and tension updates.

2. **`src/hooks/useEnhancedMafiaGameState.ts`** — AI target selection:
   - In the AI decision logic, classify whether the AI has fresh scout intel on the candidate target. If not, the action is a Blind hit and the AI must "accept" the −20% / heat 150% / civilian-risk / bounty consequences when scoring the choice.
   - Make AI personality weights consider blind-hit risk: cautious/defensive personalities prefer scouting first; aggressive/unpredictable personalities accept blind hits more readily. (Behavior tuning, no new mechanics.)

3. **`src/hooks/useEnhancedMafiaGameState.ts`** — civilian-hit aftermath ticker:
   - Ensure the existing per-turn loop that returns/loses hidden soldiers and decays bounty markers already handles AI families. If currently player-only, generalize it to all families.

4. **Turn summary / notifications** —
   - `src/components/TurnSummaryModal.tsx` and notification dispatch: surface AI civilian hits, AI bounties placed, AI ceasefire/alliance breaks, and AI heat spikes so the player sees the AI suffering the same consequences.

5. **Memory updates**
   - `mem://gameplay/ai-behavior` — note AI now uses the same hit pipeline as the player (scout-state classification, heat scaling, civilian-hit risk, bounty, diplomacy penalties, tension).
   - `mem://gameplay/combat-mechanics/hit-actions` — clarify rules apply to AI identically.
   - `mem://gameplay/combat-mechanics/blind-hits` — note civilian-hit and bounty consequences apply to AI families.

## Verification

- Watch an AI family attack an unscouted empty rival hex → AI heat jumps to 100, attacking soldier disappears for 3 turns, return check on loyalty.
- AI blind-hits a rival with units → bounty appears on the AI for 3 turns; victim AI prioritizes counterattack.
- AI attacks a family it has an alliance with → alliance breaks, relationship −40, AI loses respect/reputation in the turn summary.
- AI Plan-Hits a capo → instant war declared between the two AI families.
- AI scouted hit produces lower heat than AI blind hit on the same target.
- Player no longer feels the AI is "cheating" — same risks, same penalties.

## What Doesn't Change

- AI personality archetypes, recruitment, movement (already aligned), economy, victory conditions, capo abilities, scout mechanics themselves, corruption tiers, fog-of-war visibility rules.

