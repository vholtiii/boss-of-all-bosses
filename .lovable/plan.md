

# Capo Negotiation Refinement — "Send Word" Delayed Mechanic

## Overview
Replace instant capo negotiation with a 2-step process: (1) Capo spends 1 tactical action to "Send Word" to a target enemy hex, (2) next turn, a "Negotiate" button appears for that pending request — no proximity needed.

## How It Works

```text
Turn N (Tactical Phase):
  Capo selects "Send Word" → clicks enemy hex → 1 tactical action consumed
  Hex gets a visual marker (e.g., 📩 badge) showing pending negotiation

Turn N+1 (Action Phase):
  "Negotiate" button appears on the marked hex (or in a pending list)
  Capo can be anywhere on the map — no proximity required
  Clicking opens the existing NegotiationDialog with the same roll mechanic
  If not used by end of turn, the request expires
```

## Changes

### 1. New Type: `PendingNegotiation`
**File**: `src/types/game-mechanics.ts`
- Add interface with fields: `id`, `capoId`, `targetQ/R/S`, `targetFamily`, `turnRequested`
- Add to game state tracking

### 2. "Send Word" Tactical Action
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- Add `send_word` action type in the tactical phase handler
- Costs 1 tactical action, $0
- Creates a `PendingNegotiation` entry in state
- Validates: target hex is enemy-controlled, capo is not wounded, no duplicate pending request for same hex

### 3. Pending → Active on Next Turn
**File**: `src/hooks/useEnhancedMafiaGameState.ts`
- In the turn-end/phase-advance logic, mark pending negotiations from previous turn as "ready"
- Expire any ready negotiations that weren't used last turn
- Ready negotiations are available during the Action phase

### 4. UI — "Send Word" Button on Hex Action Menu
**File**: `src/components/EnhancedMafiaHexGrid.tsx`
- During tactical phase: show "📩 Send Word" button on enemy hexes when a capo is selected (replaces or supplements the current negotiate button during tactical phase)
- During action phase: show "🤝 Negotiate" button on hexes that have a ready pending negotiation
- Add 📩 badge overlay on hexes with pending negotiations

### 5. UI — Negotiate Button in Action Phase
**File**: `src/pages/UltimateMafiaGame.tsx`
- `open_negotiate` action now checks for a valid `PendingNegotiation` in "ready" state
- Dialog opens with the same capo personality bonuses (looked up from the capo who sent word)
- After negotiation (success or fail), the pending entry is consumed

### 6. Visual Indicator
**File**: `src/components/EnhancedMafiaHexGrid.tsx`
- Small 📩 icon on hexes with pending negotiations (similar to fortification badge)
- Tooltip: "Negotiation pending — available next turn"

## What Stays the Same
- All 3 territory deal types (Bribe Territory, Share Profits, Safe Passage)
- Personality bonuses unchanged
- Roll mechanic unchanged
- Boss negotiation unchanged (still instant)
- Costs, success rates, refund rates all unchanged

## Files Modified
- **`src/types/game-mechanics.ts`** — `PendingNegotiation` interface
- **`src/hooks/useEnhancedMafiaGameState.ts`** — send_word action, pending lifecycle, expiration
- **`src/components/EnhancedMafiaHexGrid.tsx`** — Send Word button, 📩 badge, negotiate button in action phase
- **`src/pages/UltimateMafiaGame.tsx`** — wire up pending negotiation to dialog opening

