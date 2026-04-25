
# Heat overhaul + Lay Low (family-wide stand-down)

## A. Heat — raise penalties + stronger passive gain (decay unchanged at 2/turn)

### A1. Tier thresholds (Tier 1 raised to 40+ per your note)
In `src/hooks/useEnhancedMafiaGameState.ts` around line 4011:
- **Tier 1: 40+** (was 30) — Income penalty
- Tier 2: 50+ (unchanged) — Soldier arrests
- Tier 3: 70+ (unchanged) — Capo arrests
- Tier 4: 90+ (unchanged) — RICO

Update tier label messages on line 4016 to reflect "40+" for Tier 1.

### A2. Bigger penalties
- **Tier 1 income**: Illegal income penalty deepened from -15% → **-25%**.
- **Tier 2 arrests**: Soldier arrest chance per turn raised from current → **30%**.
- **Tier 3 arrests**: Capo arrest chance raised from current → **25%**.
- **Tier 4 RICO**: Game-over timer shortened from **5 turns → 3 turns**. Update timer text/notifications (lines 4101, 4106, 4112) and `ricoTimer` checks accordingly.

### A3. Stronger passive heat (decay stays at 2/turn)
- Multiply heat from `claim`, `extort`, `hit`, `sabotage` actions and ambient/passive heat (line 3933 area) by **1.30**.
- Leave `policeHeat.reductionPerTurn = 2` untouched everywhere.

### A4. Notifications
Update tier-entry toast copy in `tierMsgs` to match new thresholds and stronger penalties (e.g., "Heat hit 40+. Illegal income -25%.").

## B. Lay Low — family-wide stand-down (free but punishing)

### B1. State
Add to game state:
- `layLowActiveUntil?: number` — turn through which Lay Low is active.
- `layLowAfterglowUntil?: number` — turn through which the post-Lay-Low informant flip reduction applies.

Helper: `isLayingLow(state) = (state.layLowActiveUntil ?? 0) >= state.turn`.

### B2. Activation (Boss action, free, no cooldown)
New button in `src/components/HeadquartersInfoPanel.tsx` "Lay Low (3 turns)" with confirmation dialog explaining penalties.

On activate:
- Set `layLowActiveUntil = turn + 2` (covers current + next 2 turns = 3).
- Immediate **-5 respect**.
- Push notification + turn report event.

### B3. Penalties while active
- **Illegal income = $0** for all owned + extorted illegal businesses (legal income unaffected). Gate in `business-income-calculation` path.
- **Block offensive actions**: `claim`, `extort`, `hit` (all tiers), `sabotage`, `assaultHQ`, `sendWord`/`sitDown` initiation. Each guarded with a clear toast: "Cannot act while laying low."
- Defense, scouting, recruitment, deployment, fortify, safehouse, abandon, legal construction → **still allowed**.

### B4. Benefits while active
- **Arrest immunity**: Skip Tier 2 soldier arrests and Tier 3 capo arrests. Skip prosecution-driven arrests (`legal-and-prosecution` flow) for the duration.
- **Ratting risk = 0**: Force `policeHeat.rattingRisk = 0` while active (line 4277 area).
- **Afterglow**: On expiry, set `layLowAfterglowUntil = turn + 2`. While afterglow active, informant/rat flip chance reduced by **10**.

Note: Heat decay stays at the normal 2/turn — no faster decay during Lay Low (per "decay unchanged" decision in A).

### B5. UI
- **Status HUD badge** (`src/components/GameSidePanels.tsx` / status HUD): Show "🤫 Laying Low (Nx)" with turns remaining when active; show "Afterglow (Nx)" when in afterglow window.
- **HQ panel**: Lay Low button shows "Active — N turns left" when running, disabled until expired.
- **Action menus**: Blocked offensive buttons get a 🤫 lock icon + tooltip "Disabled while laying low."

## Files Touched
- `src/hooks/useEnhancedMafiaGameState.ts` — tier thresholds, penalties, RICO timer, heat-gain multiplier, Lay Low state/gates/effects, action blockers, arrest/ratting skips, afterglow.
- `src/components/HeadquartersInfoPanel.tsx` — Lay Low button + confirm dialog + active state UI.
- `src/components/GameSidePanels.tsx` — Lay Low/Afterglow status badges; locked-action tooltips.

## What Doesn't Change
- Heat decay rate (stays 2/turn).
- Tier 2/3/4 thresholds (50/70/90).
- Bribery/corruption tiers, scout, fortify, safehouse, supply lines.
- AI heat behavior parity is preserved (AI still uses its own `resources.heat` proxy; Lay Low is player-only for this pass).
