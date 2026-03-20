

# Fix: Extortion Failure — No Casualties, More Consequences

## Problem
Failed extortion currently kills soldiers, which doesn't make thematic sense. Extortion is a shakedown — if it fails, you get chased off or reported to the police, not gunned down.

## Changes

### File: `src/hooks/useEnhancedMafiaGameState.ts` (lines 2601–2623)

Replace the casualty block (lines 2602–2621) with penalty-only consequences:
- **Remove** all casualty/unit-removal code
- **Extra police heat**: +5 additional heat on failure (on top of the existing +8/+12 at line 2623)
- **Respect penalty**: −3 respect (word gets out you got turned away)
- **Fear penalty**: −2 fear (shows weakness)
- **Updated notification**: *"The locals refused to pay and word spread. Your reputation takes a hit."*
- **Updated combat result details**: Show the respect/fear/heat penalties instead of casualty count

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — remove casualties, add respect/fear/heat penalties on failed extortion

