

# Phase 3: Influence Erosion & Passive Expansion

## What Changes for the Player
In Phase 3+, you can no longer manually claim or extort territory. Instead, your empire grows and shrinks organically based on where you position your units, businesses, safehouses, and supply lines.

**Gaining territory**: Neutral hexes adjacent to your influence sources are slowly absorbed (+2 Respect, +3 Influence per hex gained).

**Losing territory**: Hexes far from any protection source decay and flip neutral (-2 Respect, -3 Influence per hex lost).

This creates a strategic shift — Phase 3 is about defending and positioning, not grabbing.

---

## Mechanics

### Influence Erosion (Losing Territory)
Each turn in Phase 3+, for every family-controlled hex (excluding HQ):
1. Check if hex is **protected** — within 2 hexes of any: friendly unit, built business, supply node, or safehouse
2. If **not protected**: increment `erosionCounter` by 1
3. If **protected or fortified**: reset `erosionCounter` to 0
4. When `erosionCounter >= 3`: hex flips to **neutral**, family loses **-2 Respect, -3 Influence**
5. Notification: "⚠️ Lost control of [District] — influence eroded"

### Passive Expansion (Gaining Territory)
Each turn in Phase 3+, for every **neutral hex only**:
1. Check if hex is adjacent (1 hex) to any family's unit, built business, safehouse, or supply node
2. If **exactly one family** has adjacency: increment `expansionCounter` by 1 for that family
3. If **multiple families** have adjacency: contested — counter resets, no expansion
4. When `expansionCounter >= 2`: hex flips to the influencing family, grants **+2 Respect, +3 Influence**
5. Notification: "🏴 Your influence has spread to [District]"

**Key rule**: Passive expansion only works on neutral hexes — you cannot passively take rival territory.

### Disabled Actions
- **Claim Territory** — blocked with "🔒 Phase 3 — Territory shifts through influence"
- **Extort Business** — blocked with same message
- Applies to both player and AI families when their phase >= 3

---

## Constants
```text
EROSION_THRESHOLD         = 3     (turns unprotected before hex flips neutral)
EROSION_PROTECTION_RANGE  = 2     (hex distance to count as protected)
EXPANSION_THRESHOLD       = 2     (turns adjacent before neutral hex is absorbed)
EROSION_RESPECT_LOSS      = -2
EROSION_INFLUENCE_LOSS    = -3
EXPANSION_RESPECT_GAIN    = +2
EXPANSION_INFLUENCE_GAIN  = +3
```

---

## Technical Changes

### 1. `src/hooks/useEnhancedMafiaGameState.ts`

**HexTile interface** — add three optional fields:
- `erosionCounter?: number`
- `expansionCounter?: number`
- `expansionInfluencer?: string`

**New function `processInfluenceSystem(state)`** — called during end-of-turn processing, only when `gamePhase >= 3`:
- **Erosion pass**: Loop all family-controlled hexes (skip HQ). For each, check if any friendly unit, built business, supply node, or safehouse exists within 2 hexes. If unprotected, increment erosion counter. If protected or fortified, reset to 0. At threshold 3, flip hex to neutral, deduct respect/influence, log event.
- **Expansion pass**: Loop all neutral hexes. For each, check adjacency (1 hex) to any family's units, built businesses, safehouses, or supply nodes. If exactly one family has presence, increment that family's expansion counter. If contested (2+ families), reset counter. At threshold 2, flip hex to that family, grant respect/influence, log event.
- Generate combat log entries and fire notifications for all territory changes.

**Block player Claim** (~line 7928 in `processClaimTerritory`): Return early with notification if `gamePhase >= 3`.

**Block player Extort** (~line 6535 in `extort_territory` case): Return early with notification if `gamePhase >= 3`.

**Block AI Claim/Extort** (~line 5437): Skip AI claim/extort logic when `opponent.resources?.cachedPhase >= 3`.

### 2. `src/components/EnhancedMafiaHexGrid.tsx`
- Set `canClaim = false` and `canExtort = false` when `gamePhase >= 3`
- Show lock icon with text: "🔒 Phase 3 — Territory shifts through influence"

### 3. `src/components/GameSidePanels.tsx`
- Gray out Extort Business button in Phase 3+ with lock indicator and tooltip

### 4. `src/components/PhaseInfographic.tsx`
- Add Phase 3 note: "Claiming & Extortion disabled — territory shifts through influence"

### 5. `src/types/game-mechanics.ts`
- Add influence system constants (thresholds, respect/influence values)

