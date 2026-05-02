## B1 (slim) — Hard cap: 1 outstanding Send Word per capo

### Rule
A capo may have at most **one** entry in `pendingNegotiations` at a time (whether `ready` or in-flight). Once it's accepted, declined, expired, or the capo dies/is jailed, the slot frees up.

No per-family cap, no withdraw action — saved for follow-up if needed.

### Change

**`src/hooks/useEnhancedMafiaGameState.ts`** — in the `send_word` block (~L2034), after the existing duplicate-hex check and before pushing `newPending`, add:

```text
const capoBusy = (prev.pendingNegotiations || []).some(p => p.capoId === unit.id);
if (capoBusy) {
  return {
    ...prev,
    pendingNotifications: [...prev.pendingNotifications, {
      type: 'warning',
      title: '📩 Capo Already Engaged',
      message: `${unit.name || 'This capo'} is already in a sitdown. Wait for it to resolve.`,
    }],
  };
}
```

The check short-circuits with a warning toast and does NOT consume `tacticalActionsRemaining`.

### Files touched
- `src/hooks/useEnhancedMafiaGameState.ts` — the one check above.
- `src/hooks/__tests__/send-word-caps.test.ts` (new, small) — verifies a second Send Word from the same capo is blocked while the first is pending, and is allowed again after the pending is removed.

### Memory updates
- Amend `mem://gameplay/negotiation-mechanics/send-word` to record: 1 outstanding Send Word per capo (hard cap).

### Out of scope
- Per-rival-family soft cap (2).
- Withdraw / cancel pending sitdown action.
- Disabled-with-reason styling on the Send Word menu item (toast is sufficient for now).
