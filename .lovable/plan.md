

# Fix AI Claiming & Extortion — Soldiers Are Just Walking Around

## Problem
AI soldiers move onto hexes but never claim neutral territory or extort businesses because:
1. **Line 2744-2748**: Only capos auto-claim neutral hexes on arrival. Soldiers are correctly blocked from auto-claiming (matching player rules), but there's **no follow-up step** where AI soldiers spend action points to claim or extort.
2. **No AI extortion phase exists at all** — the only extortion logic is for player capo auto-extort on arrival. AI never explicitly runs an extort action.

The AI movement loop exhausts tactical actions, then jumps straight to capo deployment and promotion — skipping the "Action Phase" entirely.

## Fix — Add AI Action Phase After Movement

### `src/hooks/useEnhancedMafiaGameState.ts` (~after line 2778)

Insert a new **AI Action Phase** block after the movement loop, before capo deployment. This uses the `aiActionsRemaining` budget (2-3 points) that may still have remaining points.

**AI Claim Logic** (soldiers on neutral unclaimed hexes):
```
for each AI soldier on a neutral hex they don't own:
  if aiActionsRemaining > 0 and hex has no business:
    claim the hex (set controllingFamily = fam)
    aiActionsRemaining--
```

**AI Extort Logic** (units on neutral hexes with completed businesses):
```
for each AI unit on a neutral hex with a completed business:
  if aiActionsRemaining > 0:
    claim territory + collect extortion payout
    aiActionsRemaining--
    (same payout formula as player: legal=$1500, illegal=$3000, scaled by respect)
```

**AI Extort Enemy Logic** (units on/adjacent to enemy hex with business):
```
for each AI unit adjacent to an enemy hex with a business:
  if aiActionsRemaining > 0 and random < personality aggression threshold:
    attempt extortion (success chance ~50% + modifiers)
    aiActionsRemaining--
```

### Priority order within the action phase:
1. Extort neutral businesses (free money + territory)
2. Claim empty neutral hexes (free territory)
3. Extort enemy businesses (risky but profitable)

## Files Modified
- `src/hooks/useEnhancedMafiaGameState.ts` — add AI action phase with claim and extort logic after movement loop

