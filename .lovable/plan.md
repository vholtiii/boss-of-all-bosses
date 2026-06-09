
## Goal
Stop heat-reduction from being a flat "pay-to-clear" loop. Make each tool a real decision with cost, timing, and trade-offs.

## Changes

### 1. Public Appearance — cheap, frequent, weak
- Cost stays $3,000, 1 action.
- Heat reduction: **−5 → −6**.
- Add **2-turn cooldown** (`lastPublicAppearanceTurn`).
- UI shows cooldown sublabel like Hire Lawyer does today.

### 2. Charitable Donation — substantial spend, real cooldown
- Cost: **$5,000 → $15,000**, 1 action. Now a genuine economic commitment, not pocket change.
- Heat reduction: **−10 → −18** (stronger to justify the higher price).
- Add **4-turn cooldown** (`lastCharityTurn`). Kills the "donate twice in a row" loop.
- Lingering effect: `charityActiveUntil = turn + 2` — **−1 extra heat regen per turn for 2 turns**, surfaced as a status pill.
- Reputation: **+3 → +5** (scales with bigger gesture).

### 3. Hire Lawyer — split into 3 tiers with retainers
Replace single "Hire Lawyer" button with a small picker (or 3 buttons). Each is a retainer paid up-front, then a per-turn fee while active. Only one lawyer active at a time. Cooldown applies after a retainer expires/ends.

| Tier | Retainer | Per-turn | Duration | Effect |
|---|---|---|---|---|
| **Street Attorney** | $5,000 | $0 | 3 turns | Current behavior: −25% on existing sentences, −25% on new sentences. |
| **Defense Firm** | $12,000 | $1,500/turn | 4 turns | Above + **−50% prosecution risk** from heat/informants/arrests while active + immediately releases 1 jailed soldier (not capo, not arrested-this-turn). |
| **Consigliere Counsel** | $25,000 | $3,000/turn | 5 turns | Above + **blocks 1 new arrest per turn** (street or capo) + **−1 heat/turn** passive while retained + RICO timer pauses while active. Cannot be hired if already at RICO tier 90+. |

- Retainer cooldown: **3 turns after the active period ends** before any new lawyer can be hired.
- Firing a lawyer mid-term refunds nothing and starts the cooldown.
- UI: arrest panel surfaces tier badge and turns remaining. Per-turn fee shows in economy maintenance breakdown.

### 4. Diminishing Returns on stacking PR in one turn
If both Public Appearance and Charitable Donation are used in the same turn, the second one's heat reduction is halved. Encourages spreading them out across cooldowns, not burst-clearing.

### 5. Maintain AI parity
AI already pays for `Lay Low` / `Mattresses` (per AI heat precautions memory). No AI changes — these are player-facing actions. Update heat memory to document cooldowns + tier choices.

## Technical Notes

**State additions** (`useEnhancedMafiaGameState.ts`):
```ts
lastPublicAppearanceTurn: number;
lastCharityTurn: number;
charityActiveUntil: number;
lawyerTier: 'street' | 'firm' | 'consigliere' | null;
lawyerRetainerEndsTurn: number;
lawyerCooldownUntil: number;
```

**Reducers to edit**: `public_appearance`, `charitable_donation`, `hire_lawyer` (add `tier` payload). Add per-turn fee deduction + charity passive tick in the economy maintenance phase (~line 4842).

**UI to edit** (`GameSidePanels.tsx` ~820-910): cooldown sublabels, 3 lawyer buttons (or single → dropdown), active-tier badge near existing `lawyerActiveUntil` pill (line 757), charity passive pill.

**Memory updates**: refresh `mem://gameplay/defense-and-law-actions`; add cooldown + tiered-lawyer note to `mem://gameplay/police-heat-system`.

**Tests**: reducer test asserting (a) charity blocked during cooldown, (b) second PR action in same turn yields halved heat, (c) Consigliere blocks a new arrest and pauses RICO.

## Out of scope
- No changes to passive heat sources, bribes, or AI heat behavior.
- No rebalance of arrest probabilities themselves.
