

# Refine Police Heat: Escalating Thresholds + Lawyer Sentence Reduction

## Overview
Overhaul the police heat system with 4 escalating consequence tiers, a RICO game-over mechanic, and a lawyer system that reduces arrest sentences by 25%.

## Threshold System

| Tier | Heat Range | Effects |
|---|---|---|
| **Low** | 30-49 | −15% illegal income |
| **Medium** | 50-69 | −15% illegal income + 20% chance/turn to arrest 1 soldier (jailed 3 turns, auto-released) |
| **High** | 70-89 | −25% illegal income + soldier arrests continue + 15% chance/turn to arrest a capo (jailed 5 turns, auto-released) |
| **Critical** | 90-100 | All above + 1 random illegal business shut down/turn + **RICO timer starts** (5 consecutive turns at 90+ = game over) |

## Arrest Durations

| Unit Type | Base Sentence | With Lawyer (−25%) |
|---|---|---|
| Soldier | 3 turns | 2 turns |
| Capo | 5 turns | 4 turns |

## RICO Timer
- State field: `ricoTimer: number` (0-5)
- Each turn at heat ≥90, increment by 1. Below 90 → reset to 0
- At 5 → federal indictment, game over
- Flashing red warning in HUD when active

## Lawyer Sentence Reduction (25%)
- "Hire Lawyer" sets `lawyerActiveUntil = currentTurn + 3`
- Immediately reduces all existing active sentences by 25% (min 1 turn)
- New arrests during lawyer window also get 25% shorter sentences
- Green badge in Defense & Law: "⚖️ Lawyer Active — Sentences −25%"

## Changes

### 1. `src/hooks/useEnhancedMafiaGameState.ts` — State additions
- Add `ricoTimer: number` (init 0), `arrestedCapos: Array<{unitId, returnTurn}>` (init []), `arrestedSoldiers: Array<{returnTurn}>` (init []), `lawyerActiveUntil: number` (init 0)

### 2. `src/hooks/useEnhancedMafiaGameState.ts` — Rewrite arrest/heat logic (~lines 1578-1628)
Replace existing 3-tier system with new 4-tier logic:
- 30+: ×0.85 illegal income multiplier
- 50+: 20% soldier arrest roll → 3-turn sentence (2 with lawyer)
- 70+: ×0.75 illegal income, 15% capo arrest roll → 5-turn sentence (4 with lawyer)
- 90+: Shut down 1 random illegal business, increment ricoTimer. Game over at 5

### 3. `src/hooks/useEnhancedMafiaGameState.ts` — Turn processing
- Release arrested soldiers/capos where `returnTurn <= currentTurn`
- Apply income penalty multiplier in economy processing

### 4. `src/hooks/useEnhancedMafiaGameState.ts` — Hire Lawyer handler update
- Set `lawyerActiveUntil = turn + 3`
- Reduce all active arrest sentences by 25% (min 1)

### 5. `src/components/GameSidePanels.tsx` — Lawyer status
- Green badge "⚖️ Lawyer Active — Sentences −25%" when active

### 6. `src/components/PoliceSystem.tsx` — UI updates
- Display current tier, active effects, arrested units with countdowns, RICO timer

### 7. `src/components/MafiaHud.tsx` — RICO warning
- Flashing red: "RICO INVESTIGATION: X turns until indictment"

