
# ✅ COMPLETED: Refine Police Heat — Escalating Thresholds + Lawyer Sentence Reduction

## Implemented

### 4-Tier Heat System
| Tier | Heat | Effects |
|---|---|---|
| Low | 30-49 | −15% illegal income |
| Medium | 50-69 | −15% illegal income + 20% soldier arrest (3 turns) |
| High | 70-89 | −25% illegal income + soldier arrests + 15% capo arrest (5 turns) |
| Critical | 90-100 | All above + business shutdowns + RICO timer (5 turns = game over) |

### Lawyer Sentence Reduction (25%)
- Hire Lawyer sets `lawyerActiveUntil = turn + 3`
- Immediately reduces all existing sentences by 25%
- New arrests during window also get 25% shorter sentences

### RICO Game Over
- 5 consecutive turns at 90+ heat = federal indictment
- Dropping below 90 resets the timer
- Full game-over screen with RICO theme

### UI Updates
- Heat tier indicator in Defense & Law panel
- RICO warning badge in top bar (flashing)
- Lawyer active badge with turns remaining
- Arrested units summary with return turns
- PoliceSystem shows tier effects, RICO timer, jailed units

---

# ✅ COMPLETED: Legal Business Construction — Capo Requirement

## Rules
- **Legal businesses** can only be built on a player-owned hex where a **Capo** is physically present
- Costs **1 action token** + money cost
- Player enters placement mode (clicks build button → selects hex on map)
- Map highlights valid hexes (green) during placement mode
- Illegal businesses remain unrestricted (any owned empty hex)

## Implementation
- `pendingBusinessBuild` state in `EnhancedMafiaGameState`
- `build_business` action enters placement mode (validates money, actions, Capo availability)
- `place_business_on_hex` action validates Capo presence, deducts action token
- `cancel_business_placement` action exits placement mode
- Green hex highlighting in `EnhancedMafiaHexGrid` for valid placement targets
- Capo requirement hint + available hex count in Economy section of `GameSidePanels`
