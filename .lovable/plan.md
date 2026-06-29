
# Civ V Management Polish + Combat & AI Rebalance — Combined Plan

Same goal as before (make the game *feel* like a 4X management sim) **plus** sharpened combat math and smarter AI woven into the same passes. No new mechanics — tuning and decision-quality only. Noir aesthetic preserved.

---

## Pass A — Smart End-Turn Button + AI Posture Hint

**UI (unchanged from prior plan)**
Cycler states in priority order: `INCOMING SITDOWN` → `UNIT NEEDS ORDERS` → `CAPO READY TO PROMOTE` → `READY SITDOWN` → `END TURN` → `AI THINKING…`. Hover shows full pending-items list; spacebar ends turn only in `END TURN` state.

**AI work folded in**
- Add a `pendingThreats` derivation: for each rival, surface "telegraphed" hostile setups (scouted hex adjacent to player, capo flown into striking range, Plan Hit prep visible) so the cycler can include `THREAT DETECTED — <family> staging in <district>` as a state above `END TURN`. Uses existing intel state, no new mechanics.

**Files**
- New: `SmartEndTurnButton.tsx`, `lib/pending-actions.ts`, `lib/ai-threat-signals.ts`
- Edit: `TurnStepRail.tsx`

---

## Pass B — Just Happened Feed + AI Posture Transparency

**UI (unchanged)** — sliding event cards top-right at turn start, dismissible, replayable.

**AI work folded in**
- Each rival's posture transition (e.g. `Genovese: BUILD_ECONOMY → PRESSURE_LEADER`) becomes a feed card with the *reason* ("you're #1 in Respect; they will harass") drawn from the posture decision inputs. Pure surfacing, no behavior change.
- Heat-tier crossings for rivals (when visible via intel) also feed in.

**Files**
- New: `JustHappenedFeed.tsx`, `lib/turn-events-feed.ts`, `lib/ai-posture-reasoner.ts` (pure: posture → human-readable cause)

---

## Pass C — Demographics Panel + Combat Math Pass 1

**UI (unchanged)** — Civ-style standings table with rank pills, vs-last-turn arrows.

**Combat math rebalance (Pass 1: hit success curves)**
Tune the unscouted/scouted/planned matrices to give scouting and planning their intended teeth:

| Action | Current feel | Target |
|---|---|---|
| Blind hit | Too swingy; sometimes one-shot, sometimes whiff | Wider casualty floor, lower critical-success ceiling; civilian-casualty trigger band widened |
| Scouted hit | Marginal upgrade over blind | Clear +15–20% success delta; intel staleness (>3 turns) decays bonus linearly |
| Planned hit | Already guaranteed kill, but cheap | Keep guarantee; add Phase 2 cost floor scaling with target toughness; +1 heat if target is fortified |
| Fortify defender | Modifier feels invisible | Bump defensive bonus and make it show in tooltip yield card (Pass E) |
| Safehouse defender | Strong; correct | No change to numbers, just surface in HUD |
| Capo wound penalty | 2-turn movement debuff sometimes ignored | Add −1 effective toughness during the wound window |

All changes are constant edits in the existing combat resolver — extract into `src/lib/balance/combat-tuning.ts` so the breakdown helper from Pass E reads the same source.

**Files**
- New: `DemographicsPanel.tsx`, `src/lib/balance/combat-tuning.ts`
- Edit: combat resolver (constants → import from tuning file)

---

## Pass D — Minimap + AI Smarter Decision-Making

**UI (unchanged)** — floating 180×180 minimap, viewport rect, click-to-pan, overlays for heat/supply/combat.

**AI sharpening (the big one)**
Inside the existing 8-posture tree — no new postures, smarter choices *within* each:

1. **Target selection**
   - Score candidate hexes by: net income · adjacency to existing rival territory · defender toughness · supply-line cut potential · player Respect/Influence value lost. Today's AI tends to pick whatever's reachable.
   - In `PRESSURE_LEADER`, weight hexes that flip Respect rankings (denying the leader, not just gaining for self).
2. **Sitdown pricing**
   - Replace flat-price heuristic with a value function: `offer ≈ targetHexNetIncome × turnsRemaining × tensionDiscount`. Caps at current Phase ceiling.
   - AI accepts/rejects player offers using same function ± personality variance.
3. **Heat management**
   - Below `hot`: free to act. At `hot`: skip blind hits, prefer scouted/planned. At `critical`: spend on bribes/PR before any heat-positive action. At `RICO`: full `COOL_OFF` override regardless of posture preference.
   - Wires into existing bribery/lawyer/PR actions — no new actions.
4. **Phase 3+ expansion play**
   - AI now actively places fortify/safehouse to *block* player erosion attempts on contested borders; previously reactive only.
5. **Capo usage**
   - AI flies capos toward high-EV targets instead of patrol-style local moves. Respects Plan Hit's Phase 2 unlock.
6. **Personality variance** preserved (existing per-family weights), just modulating the new scoring functions instead of replacing them.

**Files**
- New: `src/lib/ai/target-scoring.ts`, `src/lib/ai/sitdown-pricing.ts`, `src/lib/ai/heat-gates.ts`
- Edit: existing AI turn driver — replaces inline heuristics with calls to the above
- Test: snapshot a deterministic seed mid-game to confirm AI doesn't regress into passivity

---

## Pass E — Rich Hex Tooltips + Combat Math Pass 2

**UI (unchanged)** — full yield breakdown card with line items, plus "what if I claim/extort/hit here?" projection.

**Combat math rebalance (Pass 2: projections honest)**
The projection lines must reflect the new tuning from Pass C and Pass D. Extract:
- `lib/hex-yield-breakdown.ts` (income lines)
- `lib/combat-projection.ts` (success% + casualty range for the currently selected unit attacking this hex, reading from `balance/combat-tuning.ts`)

This forces the combat tuning to be inspectable — no hidden modifiers. Any number shown in the tooltip comes from the same constants the resolver uses.

**Files**
- New: `HexYieldTooltip.tsx`, `lib/hex-yield-breakdown.ts`, `lib/combat-projection.ts`
- Edit: existing hover tooltip component

---

## Files summary

**New (UI)** — `SmartEndTurnButton`, `JustHappenedFeed`, `DemographicsPanel`, `Minimap`, `HexYieldTooltip`
**New (pure helpers)** — `pending-actions`, `ai-threat-signals`, `turn-events-feed`, `ai-posture-reasoner`, `hex-yield-breakdown`, `combat-projection`
**New (balance/AI)** — `balance/combat-tuning.ts`, `ai/target-scoring.ts`, `ai/sitdown-pricing.ts`, `ai/heat-gates.ts`
**Edited** — combat resolver (constants extraction), AI turn driver (heuristic replacement), `TurnStepRail`, `ResponsiveLayout`, `UltimateMafiaGame`, existing hover tooltip

**Untouched** — save format, hex grid, dialog chrome, fonts, palette, panel components

---

## Sequencing

1. **Pass A** — Smart End-Turn + threat signal
2. **Pass B** — Feed + posture reasons
3. **Pass C** — Demographics + combat math Pass 1 (tuning constants)
4. **Pass D** — Minimap + AI scoring/pricing/heat-gates
5. **Pass E** — Rich tooltips + combat math Pass 2 (honest projections)

Recommend approving A+B first (lowest risk, biggest "feels different" payoff), playtesting, then green-lighting C–E.

---

## Out of scope (still)

- No new combat mechanics (no ambush rolls, no counter-attacks, no retreat orders — you marked these out)
- No economy rebalance pass
- No alliance-against-leader AI behavior
- No new fonts, palette, or panel chrome
- No save format changes
- No new dependencies

