

# Commission Vote Reveal Modal

## What
A dramatic modal that shows each family's vote being revealed one-by-one with staggered animations when a Commission Meeting is called (by player or AI). Instead of dumping results into a notification, the vote plays out visually.

## Design

```text
┌─────────────────────────────────────┐
│     👑 THE COMMISSION MEETS         │
│     "Who shall lead us all?"        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🟢 Gambino    ✅ YES        │    │
│  │     "We support you."       │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 🔴 Lucchese   ❌ NO         │    │
│  │     "Relationship too low"  │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ ⏳ Bonanno    ...revealing  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Result: 2/3 votes (need 3)        │
│  [Continue]                         │
└─────────────────────────────────────┘
```

Each vote card fades in with a 1-second delay between reveals. Final result appears after all votes shown.

## Implementation

### New file: `src/components/CommissionVoteModal.tsx`
- Props: `open`, `onClose`, `voteResults: {family, vote, reason}[]`, `needed`, `callerFamily`, `isPlayerCaller`, `won`
- Uses `framer-motion` for staggered card animations
- Each vote card reveals after a delay using `AnimatePresence` + sequential state updates via `useEffect` timers
- Family-colored borders matching existing `familyColors` pattern
- Sound effects on each reveal (`playSound('notification')` for YES, `playSound('danger')` for NO)
- Final result banner: gold glow for win, red for loss

### Modified: `src/hooks/useEnhancedMafiaGameState.ts`
- In `processCommissionVote`: Instead of pushing notifications with results, store vote data in a new state field `commissionVoteResult: {callerFamily, voteResults, needed, won, isPlayerCaller}`
- In AI commission vote section (~line 4620): Same -- store results in `commissionVoteResult`
- The notification is still pushed but simplified (modal handles the detail)

### Modified: `src/pages/UltimateMafiaGame.tsx`
- Import and render `CommissionVoteModal`
- Read `gameState.commissionVoteResult`, pass to modal
- On modal close, clear the result from state
- Pass `playSound` to modal for vote reveal sounds

### State type addition in `useEnhancedMafiaGameState.ts`
- Add `commissionVoteResult` field to `EnhancedMafiaGameState` interface

## Files
- **New**: `src/components/CommissionVoteModal.tsx`
- **Edit**: `src/hooks/useEnhancedMafiaGameState.ts` (store vote results in state instead of only notifications)
- **Edit**: `src/pages/UltimateMafiaGame.tsx` (render modal, handle close)

