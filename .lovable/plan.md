## Two New Tactical-Step Actions

Adds one paired intel mechanic (Wiretap ↔ Sweep for Bugs) and one loyalty mechanic (Family Dinner at HQ). Both are full-parity: AI families can use them too. All effects fit existing strategy/territory focus — no missions, no new resources.

> **Heads-up on existing rule:** `mem://gameplay/intel-sources` says there are exactly 4 canonical intel paths (Scout, Bribe, Flip Soldier, Safehouse). Wiretap adds a 5th. I'll update that memory as part of the build so the rule stays accurate.

---

### 1. 🎧 Wiretap (intel) + 🧹 Sweep for Bugs (counter-intel)

The mob's signature non-violent intel play. One side plants bugs, the other sweeps them.

**Wiretap a rival hex**
- **Where**: tactical step menu → target a *known* rival-controlled hex (must have been scouted at least once, so you know what's there). Capo not required — any deployed soldier within 2 hexes of the target can "make the drop".
- **Cost**: $1,500 + 1 tactical action.
- **Effect**: For **4 turns**, you passively learn:
  - The owning family's next planned action on or from that hex (claim, extort, sabotage, hit, plan-hit, sitdown) — revealed in your Alerts log the turn before it resolves.
  - Live unit count on that hex (bypasses fog).
- **Discovery risk**: 15% per turn the rival rolls a discovery check. If they have an active Sweep (see below), the chance jumps to 75%. On discovery: wiretap expires, tension +8 with that family, and the rival learns *you* were the planter.
- **Limits**: max 2 active wiretaps per family. Cannot wiretap an HQ. Phase 2+ only (intel-tier mechanic).

**Sweep for Bugs**
- **Where**: tactical step menu → target your own hex or HQ.
- **Cost**: $800 + 1 tactical action.
- **Effect**: Immediately rolls discovery for any active wiretap on that hex (75% chance per wiretap). If found:
  - Wiretap removed.
  - +5 respect ("we caught them in our walls").
  - Tension +5 with the planter.
- **Passive**: Even if no wiretap was found, the hex gains a 2-turn *Counter-Surveillance* tag (raises discovery rate to 75% for any wiretap planted during those 2 turns).
- **Limit**: 1 sweep per turn (it's a tactical action, so naturally capped).

**Why it's mafia-authentic**: every major NY family ran wire ops on rivals through the 80s; the Bonannos famously got pinched after FBI bugs in their social clubs. Sweeps were a regular routine — Castellano's house was swept weekly.

---

### 2. 🍝 Family Dinner at HQ (loyalty)

The Sunday sit-down at the boss's table — keeps the crew tight.

- **Where**: tactical step menu → action on your HQ.
- **Cost**: $1,000 + 1 tactical action. **5-turn cooldown** per family.
- **Effect**: +6 loyalty to every friendly soldier and capo **on or within 2 hexes of HQ** (matches the existing `LOYALTY_CAPO_AURA_RANGE` for consistency). +1 respect.
- **Side effect**: small heat cost (+1) — feds notice big gatherings ("Apalachin moment").
- **Limit**: HQ must have at least 1 friendly unit nearby.

**Why it's mafia-authentic**: Sunday dinner / wedding gatherings were the social glue that kept loyalty enforceable. Also the historical cause of mass arrests (Apalachin '57).

---

### AI Parity

Both AI heat posture and personality already drive tactical decisions. AI hooks:

- **Wiretap**: Cautious/strategic personalities will plant wiretaps on the top-threat rival's nearest extortable hex when they have spare tactical budget and money. Aggressive/opportunistic skip in favor of Plan Hit / direct action. AI uses wiretap intel to pick higher-success Plan Hit targets.
- **Sweep**: Any AI runs a sweep on its HQ when (a) it detects a wiretap was placed on its hexes (i.e., player's wiretap is now active) — surfaced via tension spike heuristic — or (b) once every ~8 turns as routine. Cautious personalities sweep more.
- **Family Dinner**: AI uses it when average crew loyalty drops below 55 and cooldown is ready.

All three respect the existing AI heat ceilings (skipped at `critical`/`rico` unless strategic override).

---

### Files (planned)

**Types & constants** — `src/types/game-mechanics.ts`
- `Wiretap` interface: `{ id, targetQ/R/S, plantedBy, plantedTurn, expiresTurn, lastIntel?: string }`.
- Constants: `WIRETAP_COST`, `WIRETAP_DURATION`, `WIRETAP_DISCOVERY_BASE`, `WIRETAP_DISCOVERY_SWEPT`, `WIRETAP_MAX_PER_FAMILY`, `WIRETAP_PLANT_RANGE`, `SWEEP_COST`, `SWEEP_DISCOVERY_CHANCE`, `COUNTER_SURVEILLANCE_DURATION`, `FAMILY_DINNER_COST`, `FAMILY_DINNER_COOLDOWN`, `FAMILY_DINNER_LOYALTY`, `FAMILY_DINNER_HEAT`.
- Extend `IntelSource` union with `'wiretap'` and update `INTEL_SOURCE_LABELS`.

**State** — `src/hooks/useEnhancedMafiaGameState.ts`
- Add `wiretaps: Wiretap[]` and per-hex `counterSurveillanceUntilTurn` to game state.
- Add `lastFamilyDinnerTurn: Record<family, number>` for cooldown tracking.
- Action handlers: `plant_wiretap`, `sweep_for_bugs`, `family_dinner`.
- End-of-turn pass:
  - Decrement wiretap durations; roll discovery; append intel entries for any rival action originating from a bugged hex next turn.
  - Decrement counter-surveillance timers.
- AI turn pass: hooks above (wiretap targeting via existing threat-board, sweep heuristic, dinner loyalty check).

**UI** — `src/components/GameSidePanels.tsx` (tactical action group) + map hex menu
- "Plant Wiretap" entry on rival hex action menu (when scouted, has range, has budget, Phase ≥ 2).
- "Sweep for Bugs" entry on own hex action menu.
- "Family Dinner" entry on HQ action menu (cooldown shown).
- Active-wiretap badges in `RightSidePanel` intel list (showing target, turns remaining, last intel snippet).
- Sweep result toast + alerts log entry.

**Memory** — update `mem://gameplay/intel-sources` to include Wiretap as a 5th canonical path; add new memories `mem://gameplay/tactical/wiretap-sweep` and `mem://gameplay/tactical/family-dinner`.

### Out of scope
- No new resources, no new map mechanics, no UI redesign of the tactical bar beyond adding entries.
- No "Tail a Capo" / "Pinch a Stoolie" this pass (next batch candidates).
- Save format gets new optional fields — old saves still load (missing fields default to empty arrays / 0).
