

# Make Respect & Influence Harder to Accumulate

Goal: slow down passive gains so reaching 70+ feels earned and the high-tier bonuses (recruitment discount, HQ assault buff, bonus action thresholds) actually matter.

## Approach: Diminishing Returns + Reduced Base Gains

Rather than nerfing single sources, apply two layered changes that compound naturally.

### 1. Diminishing Returns Curve (above 60)

All passive Respect/Influence gains get scaled down as you approach the cap:

| Current value | Gain multiplier |
|---------------|-----------------|
| 0–59          | 1.0x (full)     |
| 60–74         | 0.6x            |
| 75–89         | 0.35x           |
| 90–100        | 0.15x           |

Applies to: passive turn income, business-owned bonuses, territory control bonuses, alliance bonuses. Does **NOT** apply to combat rewards (Blind Hit +20 Respect, Planned Hit +10, etc.) — those should remain high-impact "earned" spikes.

### 2. Reduce Base Passive Gains (~30%)

In `useEnhancedMafiaGameState.ts`, trim the per-turn passive trickle:
- Per-business respect bonus: reduce ~30%
- Per-territory influence bonus: reduce ~30%
- Alliance/diplomacy passive bonuses: reduce ~30%

Combat-earned and milestone-earned gains stay untouched.

### 3. Slightly Steeper Decay Above 70

Bump the existing -0.5/turn decay to **-1.0/turn when above 70**. Keeps high stats from being "set and forget" without punishing mid-tier players.

---

## Expected Impact

- Players hit 50 around turn 12–15 (was ~10)
- Reaching 80 now requires combat success or active play (was ~turn 18 passively)
- Reaching 100 becomes rare, making the recruitment discount cap and HQ assault buff feel like genuine achievements

## Files Touched

1. **`src/hooks/useEnhancedMafiaGameState.ts`** — add `applyDiminishingReturns()` helper, wrap passive Respect/Influence gain sites, reduce base values, adjust decay
2. **`src/components/GameGuide.tsx`** — update Resources section to mention diminishing returns above 60 and steeper decay above 70

No new constants file; values inlined.

