

# Refine Defense & Law: Heat Reduction + Legal Defense

## Overview
Replace the two dead buttons with functional heat-reduction and legal-defense actions. Both cost 1 action-phase slot, creating a meaningful trade-off against combat/economy actions.

## Actions

| Action | Icon | Cost | Effects | Cooldown |
|---|---|---|---|---|
| **Public Appearance** | 👑 Crown | $3,000 | −5 heat, +2 Reputation | None |
| **Charitable Donation** | 🤝 HandCoins | $5,000 | −10 heat, +3 Reputation | None |
| **Hire Lawyer** | ⚖️ Scale | $8,000 | Clears 1 active arrest penalty (profit reduction), −3 heat | 3-turn cooldown |

- **Public Appearance**: Cheap, small heat drop. Good for maintenance.
- **Charitable Donation**: Medium cost, bigger heat drop. Useful when heat is climbing.
- **Hire Lawyer**: Expensive but removes an active arrest penalty entirely (the -5%/-15%/-30% profit debuffs from the police system). If no active arrest, it still reduces heat by 3. Has a 3-turn cooldown to prevent spam.

## Changes

### 1. `src/hooks/useEnhancedMafiaGameState.ts` — Add 3 action handlers
- `public_appearance`: Deduct $3,000, reduce `policeHeat.level` by 5 (min 0), add +2 reputation, consume 1 action
- `charitable_donation`: Deduct $5,000, reduce `policeHeat.level` by 10 (min 0), add +3 reputation, consume 1 action
- `hire_lawyer`: Deduct $8,000, remove first active arrest from `policeHeat.activeArrests` array (or reduce heat by 3 if none active), consume 1 action. Track `lastLawyerTurn` in state for 3-turn cooldown

### 2. `src/components/GameSidePanels.tsx` — Update Defense & Law section
- Keep Public Appearance and Charitable Donation buttons (already exist, just need handlers)
- Add new "Hire Lawyer" button with Scale icon, $8,000 cost, disabled during cooldown
- Show cooldown remaining on Hire Lawyer button when applicable (e.g., "2 turns")
- All three phase-locked to action phase

### 3. `src/hooks/useEnhancedMafiaGameState.ts` — State addition
- Add `lastLawyerTurn?: number` to game state for cooldown tracking

