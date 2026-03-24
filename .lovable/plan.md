

# Add Status HUD Badges to Top Bar

## What
Add a compact badge strip below the existing Turn/Season display showing expiring pacts, negotiation cooldowns, and deployed soldier ratio.

## Where
`src/pages/UltimateMafiaGame.tsx` — the center "Game Status" section (lines 500-523)

## Changes

### Add status badges below "Turn X / Season" (after line 505)

A new `div` with `flex-wrap gap-1` containing:

1. **Expiring pact warnings** — For each active ceasefire, alliance, share profits, or safe passage pact with `turnsRemaining <= 1`, show a ⚠️ amber badge: `"⚠️ Ceasefire w/ Gambino expires!"`. Skip if no pacts are expiring soon.

2. **Negotiation cooldowns** — Two small badges:
   - `"🏛️ Boss: Ready"` (green) or `"🏛️ Boss: 1t"` (muted) based on `bossNegotiationCooldown`
   - `"👔 Capo: Ready"` (green) or `"👔 Capo: 1t"` (muted) based on `capoNegotiationCooldown`

3. **Deployed ratio** — Count soldiers on non-HQ hexes vs total: `"⚔️ 12/18 deployed"`. Green if >50% deployed, amber if <30%.

All badges use the existing `rounded-full px-2 py-0.5 text-[10px]` pattern already used by the pact badges in the bottom bar (lines 743-762).

Only render badges that have meaningful info (hide "Ready" cooldowns if both are 0 to reduce clutter — only show when at least one is on cooldown).

## Files Modified
- `src/pages/UltimateMafiaGame.tsx` — add status badge strip to top bar center section

