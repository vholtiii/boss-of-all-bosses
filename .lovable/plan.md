

# AI-Initiated Sitdown Requests

## What Changes

### 1. New data type: `IncomingSitdown`
**File: `src/types/game-mechanics.ts`**

Add a new interface for AI-initiated sitdown requests:
```ts
export interface IncomingSitdown {
  id: string;
  fromFamily: string;
  proposedDeal: 'ceasefire' | 'alliance' | 'safe_passage' | 'supply_deal';
  turnRequested: number;
  expiresOnTurn: number; // 2-turn window to respond
  successBonus: number;  // +15% since THEY asked
}
```

### 2. Add `incomingSitdowns` to game state
**File: `src/hooks/useEnhancedMafiaGameState.ts`**

- Add `incomingSitdowns: IncomingSitdown[]` to state interface and initial state
- Deep-copy it in `deepCloneState`

### 3. AI creates incoming sitdowns (replaces vague notifications)
**File: `src/hooks/useEnhancedMafiaGameState.ts` (~line 5563-5610)**

Replace the current "signals they want to negotiate" notifications with actual `IncomingSitdown` entries pushed to `state.incomingSitdowns`. Keep the notification but change the message to: "The [Family] family has requested a sitdown. Accept or decline below."

Personality-driven triggers stay the same (Diplomatic P2+, Defensive P3+, Opportunistic when losing). Add Aggressive families occasionally requesting sitdowns when they're losing badly (hex count < 4).

### 4. AI-to-AI sitdowns
**File: `src/hooks/useEnhancedMafiaGameState.ts`**

After the player-facing diplomacy block, add AI-to-AI ceasefire logic: diplomatic/defensive AI families can form ceasefires with each other (auto-resolved, no player input needed). Push an info notification so the player is aware: "The [Family] and [Family] families have agreed to a ceasefire."

### 5. Incoming Sitdowns UI — Accept/Decline panel
**File: `src/pages/UltimateMafiaGame.tsx`**

Add an "Incoming Sitdowns" section next to the existing Pending Sitdowns tracker. Each entry shows:
- Family name + proposed deal type
- Turns remaining to respond (e.g., "1t left")
- **Accept** button (opens NegotiationDialog with the proposed deal pre-selected and the +15% success bonus applied)
- **Decline** button (removes the sitdown, +5 tension with that family)

### 6. Expiration penalty
**File: `src/hooks/useEnhancedMafiaGameState.ts`** (turn-end lifecycle)

Expire `incomingSitdowns` where `expiresOnTurn <= state.turn`. Ignoring an incoming sitdown increases tension by +5 (less than the +8 for snubbing your own sitdown, since declining is less offensive than ghosting).

### 7. Accept flow
**File: `src/hooks/useEnhancedMafiaGameState.ts`**

Add an `acceptIncomingSitdown` action handler that:
- Consumes 1 AP
- Opens the negotiation with the +15% bonus baked in
- Removes the incoming sitdown entry on completion

## Summary
- 2 files edited (`useEnhancedMafiaGameState.ts`, `UltimateMafiaGame.tsx`)
- 1 file with type addition (`game-mechanics.ts`)
- AI families now actively request sitdowns based on personality
- AI-to-AI ceasefires happen autonomously with player notification
- Player gets Accept/Decline UI with a success bonus for accepting

