

# Plan: Gameplay Phases + Commission Vote Victory Path

This is a large feature with two major systems. I recommend implementing in **two batches** to keep changes reviewable.

---

## Batch 1: Gameplay Phases (4-Phase Gating System)

### Concept
Four phases gate which mechanics are available, creating a natural game arc from scrappy newcomer to criminal empire. Each phase requires **both** a minimum turn AND milestone conditions. AI families follow the **same gates**.

### Phase Definitions

```text
Phase 1: Making Your Bones (Turns 1-8)
  Available: Move, extort, claim, recruit soldiers, basic combat (blind hits)
  Locked: Scouting, alliances, Plan Hits, Capo promotion, Boss diplomacy, fortification, safehouses

Phase 2: Establishing Territory (Turn 9+, 8+ hexes, 20+ respect)
  Unlocks: Scouting, Capo promotion, Plan Hits, safehouses, fortification

Phase 3: Controlling Territory (Turn 18+, 20+ hexes, 2+ Capos, 1+ built business)
  Unlocks: Boss diplomacy, alliances, ceasefires, bribes above patrol level

Phase 4: Boss of All Bosses (Turn 30+, 35+ hexes OR $40k income OR 80+ respect)
  Unlocks: Commission Vote victory path
```

### Technical Changes

**`src/types/game-mechanics.ts`**
- Add `GamePhase = 1 | 2 | 3 | 4`
- Add `PHASE_CONFIG` array with milestone requirements per phase
- Add `'commission'` to `VictoryType`
- Add `commission` field to `VictoryProgress`

**`src/hooks/useEnhancedMafiaGameState.ts`**
- Add `gamePhase: GamePhase` to `EnhancedMafiaGameState` (default: 1)
- Add `calculateGamePhase()` helper that checks milestones + min turn for the player
- Add `calculateAIPhase()` that checks the same milestones per AI family
- Call phase calculation at end of each turn; push notification on phase transition
- Gate existing handlers:
  - Scout action: check `gamePhase >= 2`
  - Capo promotion: check `gamePhase >= 2`
  - Plan Hit: check `gamePhase >= 2`
  - Safehouse/fortify: check `gamePhase >= 2`
  - Boss negotiation (alliance, ceasefire): check `gamePhase >= 3`
  - Bribes above patrol: check `gamePhase >= 3`
- Gate AI actions similarly using per-family phase tracking

**`src/pages/UltimateMafiaGame.tsx`**
- Add phase banner in the top HUD showing current phase name + icon
- Phase progress tooltip with next-phase requirements and current values
- Disable/grey out buttons for locked actions with "Unlocks in Phase X" tooltip

**`src/components/HeadquartersInfoPanel.tsx`**
- Grey out Boss diplomacy buttons when `gamePhase < 3`
- Grey out Declare War when `gamePhase < 3`

**`src/components/GameSidePanels.tsx`**
- Grey out scout/fortify/safehouse buttons when `gamePhase < 2`
- Show lock icon + phase requirement text

---

## Batch 2: Commission Vote (Victory Path)

### Concept
In Phase 4, the player (or AI) can call a Commission Meeting to win through diplomacy. The vote threshold **scales with survivors**: you always need support from **all surviving rivals minus one** (unanimous minus one). This prevents cheap wins when most families are eliminated.

### Vote Rules

| Survivors | Votes Needed | Effect |
|-----------|-------------|--------|
| 4 rivals  | 3 of 4      | Strong consensus required |
| 3 rivals  | 2 of 3      | Still need broad support |
| 2 rivals  | 2 of 2      | Unanimous -- hard to win |
| 1 rival   | Cannot call  | Too few families for legitimacy |

- **Cost**: $15,000 + 1 action point
- **Cooldown**: 10 turns between attempts
- **Vote criteria**: AI votes YES if relationship >= 60 AND active alliance/trade pact
- **Treachery debuff**: Automatic NO from all families
- **Failed vote penalty**: -10 relationship with all NO voters
- **AI can also call votes** in Phase 4

### Technical Changes

**`src/types/game-mechanics.ts`**
- Add `COMMISSION_VOTE_COST = 15000`, `COMMISSION_VOTE_COOLDOWN = 10`, `COMMISSION_MIN_SURVIVORS = 2`
- Add `commission` to `VictoryProgress` interface

**`src/hooks/useEnhancedMafiaGameState.ts`**
- Add `commissionVoteCooldownUntil: number` to state
- Add `handleCommissionVote()` handler: checks Phase 4, cost, cooldown, survivor count; resolves votes; triggers victory or penalties
- Add AI commission vote logic in AI turn processing
- Update `updateVictoryProgress` to track commission readiness

**`src/components/HeadquartersInfoPanel.tsx`**
- Add "Call Commission Meeting" button (Phase 4 only, with cost/cooldown display)

**`src/pages/UltimateMafiaGame.tsx`**
- Commission vote modal: dramatic per-family vote reveal with YES/NO animations
- Wire the action through `handleAction`

**`src/components/VictoryTracker.tsx`**
- Add commission vote progress bar (supporting families / needed)

**`GAME_MECHANICS.md`**
- Document all 4 phases and Commission Vote rules

---

## Gameplay Holes Addressed

1. **Phase 1 is too restrictive?** No -- basic combat (blind hits) + extort + claim provides plenty to do for 8 turns. Locking scouting creates genuine risk early on.
2. **AI getting stuck in Phase 1?** AI follows same gates but their passive behavior in Phase 1 (expansion-only) aligns naturally with what's available.
3. **Commission Vote with 1 survivor?** Blocked -- need minimum 2 surviving rivals. This forces the diplomatic player to keep rivals alive.
4. **AI calling commission vote?** Yes, creates tension -- player must manage relationships or risk an AI diplomatic victory.
5. **Phase regression?** No -- once a phase is reached, it stays. Losing hexes doesn't drop you back.

## Files Modified
- `src/types/game-mechanics.ts`
- `src/hooks/useEnhancedMafiaGameState.ts`
- `src/pages/UltimateMafiaGame.tsx`
- `src/components/HeadquartersInfoPanel.tsx`
- `src/components/GameSidePanels.tsx`
- `src/components/VictoryTracker.tsx`
- `GAME_MECHANICS.md`

