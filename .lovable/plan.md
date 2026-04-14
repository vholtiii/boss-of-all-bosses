

# Add Tension Penalty for Ignored Sitdowns

## What Changes
When a "ready" negotiation (🤝) expires unused at the end of a turn, tension between the player's family and the target family increases by **+8**. The rival family interprets the ignored sitdown as disrespect. A notification informs the player.

## Technical Detail

**File: `src/hooks/useEnhancedMafiaGameState.ts` (~line 2734-2735)**

Currently:
```ts
// Expire "ready" negotiations that weren't used last turn
newState.pendingNegotiations = newState.pendingNegotiations.filter(p => !p.ready);
```

Replace with:
```ts
// Expire "ready" negotiations — ignoring a sitdown increases tension
const expiredNegs = newState.pendingNegotiations.filter(p => p.ready);
for (const expired of expiredNegs) {
  addPairTension(newState, newState.playerFamily, expired.targetFamily, 8);
  newState.pendingNotifications.push({
    type: 'warning' as const,
    title: '😤 Sitdown Snubbed',
    message: `The ${expired.targetFamily} family is offended you ignored their sitdown. Tension +8.`,
  });
}
newState.pendingNegotiations = newState.pendingNegotiations.filter(p => !p.ready);
```

One file, ~8 lines added. Uses the existing `addPairTension` helper which respects cooldowns and caps.

