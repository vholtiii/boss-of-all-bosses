## Change

Lower the "other-stat" floor from **3 → 1** when one of the two promotion stats is maxed at 5.

### Eligibility table

| Path | Victories | Racketeering | Loyalty | Training |
|---|---|---|---|---|
| Victory path | **5** | **≥ 1** | ≥ 70 | ≥ 3 |
| Racketeer path | **≥ 1** | **5** | ≥ 70 | ≥ 3 |
| Balanced path | ≥ 4 | ≥ 4 | ≥ 70 | ≥ 3 |

A soldier with 0/5 in the off-stat is still **not** eligible — they need at least one tick of progress on the other stat to prove some breadth before promotion. Loyalty ≥ 70 and training ≥ 3 stay required across all paths.

## Files

1. **`src/types/game-mechanics.ts`**
   - `CAPO_PROMOTION_REQUIREMENTS.discountedThreshold`: `3 → 1`.
   - `isCapoPromotionEligible`: rewrite to `((v >= 5 && r >= 1) || (r >= 5 && v >= 1) || (v >= 4 && r >= 4)) && loyalty >= 70 && training >= 3`. (Equivalent to swapping the constant, but I'll express it via the constant so both stay in sync.)

2. **`src/components/CapoPromotionPanel.tsx`**
   - Help text (lines ~84–86): update to `Max Victories (5) + Racketeering ≥1` and `Max Racketeering (5) + Victories ≥1`.
   - Path-label logic at lines 56–58 already reads from `discountedThreshold`, so it picks up the new value automatically.
   - Per-soldier requirement display at lines 136–144 already shows MAXED ✦ on the maxed stat; no row change needed beyond the help text.

3. **Memory** — update `mem://gameplay/unit-attributes-and-promotion` to reflect the new floor (1, not 3).

## Verify

- Soldier with V=5, R=1, L=70, T=3 → eligible ✓
- Soldier with V=5, R=0, L=70, T=3 → not eligible ✗
- Soldier with R=5, V=1, L=70, T=3 → eligible ✓
- Soldier with V=4, R=4, L=70, T=3 → eligible (balanced, unchanged) ✓
- Loyalty < 70 or training < 3 → not eligible regardless of path ✗

No AI / scoring / cost changes — same $10k cost, same loyalty discount, same 1-turn ceremony.
