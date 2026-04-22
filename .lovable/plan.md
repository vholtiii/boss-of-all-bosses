

# Phase 1 Respect Dampener — Suggestions A + E

Slow early-game respect by lowering starting respect and halving passive per-turn respect gains while in Phase 1. Combat spikes and claim rewards remain unchanged.

## Changes

### A — Phase 1 passive respect ×0.5
In `src/hooks/useEnhancedMafiaGameState.ts`, in the per-turn growth block where `rawRespectGain` is computed (after district/business contributions, before diminishing-returns tiering), apply a `× 0.5` multiplier when `gameState.currentPhase === 1`. Influence gain unchanged. Decay unchanged.

### E — Starting respect 25 → 15
In `src/hooks/useEnhancedMafiaGameState.ts`, change the player's initial `respect` in the starting resources block from `25` to `15`. AI starting respect unchanged (keeps competitive pressure).

## Files Touched

- `src/hooks/useEnhancedMafiaGameState.ts` — starting `respect: 15`; Phase 1 passive respect multiplier `0.5`.
- `src/components/GameGuide.tsx` — Resources section: add a line noting "Phase 1: passive respect gain halved; combat spikes unaffected" and update starting respect reference if shown.
- `mem://gameplay/respect-influence-balance` — record the Phase 1 ×0.5 passive multiplier and lower starting respect.

## Verification

- New game: player starts at 15 respect (was 25).
- Five turns of pure claiming/business income in Phase 1 → respect rises noticeably slower than before.
- An early Blind Hit still grants the full +20 respect spike (combat bypass intact).
- Once Phase 2 unlocks, passive respect returns to full rate.

## What Doesn't Change

- Influence economy, decay rates, diminishing-return tiers, claim/extort rewards, combat respect spikes, AI starting respect, AI passive growth.

