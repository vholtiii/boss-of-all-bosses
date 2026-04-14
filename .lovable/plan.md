

# Add Training Requirement to Capo Promotion (Cap at 3)

Training is already capped at 3 in the game logic (`Math.min(3, stats.training + 1)`). Just need to add it as a promotion gate and show it in the UI.

## Changes

### 1. `src/types/game-mechanics.ts` (line 390)
- Add `&& stats.training >= 3` to `isCapoPromotionEligible()` return condition

### 2. `src/components/CapoPromotionPanel.tsx`
- Add `<Req met={s.stats.training >= 3} label={`Training: ${s.stats.training}/3`} />` line before the Loyalty requirement
- Add training to the promotion requirements summary text (~line 84)

Two files, three small edits.

