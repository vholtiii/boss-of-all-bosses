

# Hitman Contract System

## Summary

Hitmen reworked from promoted soldiers into external contract killers. Player pays $15,000 to target any enemy soldier or capo (blind selection — no location/stats shown). The hit resolves in 3-5 turns with no heat and no bonuses. Failed hits refund 50% and trigger AI alert mode.

## Payment Model
- On hire: full $15,000 deducted
- Success: no refund
- Failure/expired/target dead: 50% refunded ($7,500)

## Duration & Success
- Duration set at hire: Open 3, Fortified/Safehouse 4, HQ 5 turns
- Success at resolution: Open 90%, Fortified 65%, Safehouse 55%, HQ 40%
- Auto-fail after 5 turns

## AI Alert State
- Failed contracts trigger 5-turn alert on target AI family
- Alert: +1 recruit cap, +1 move range, fortify units, prioritize player hexes

## Files Modified
- `src/types/game-mechanics.ts` — HitmanContract interface, new constants
- `src/hooks/useEnhancedMafiaGameState.ts` — hire_hitman action, contract resolution, AI alert
- `src/components/HitmanPanel.tsx` — Complete rewrite with contract UI
- `src/components/GameSidePanels.tsx` — Updated props
- `SOLDIER_RECRUITMENT_GUIDE.md` — Documented contract system
- `COMBAT_SYSTEM_GUIDE.md` — Updated hitman section
