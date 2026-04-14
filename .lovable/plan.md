

# Refine Send Word & Negotiate UX for Clarity

## Problem
The two-step Send Word → Negotiate flow is confusing because:
1. After sending word, there's no prominent reminder that a sitdown is ready next turn
2. Players must remember to click the specific enemy hex and find "Negotiate" in the context menu
3. No summary panel shows all pending/ready negotiations in one place
4. The connection between the tactical "Send Word" button and the action-phase "Negotiate" option isn't visually linked

## Solution: Add a Pending Negotiations Tracker + Ready Sitdown Prompt

### 1. Add "Pending Sitdowns" summary bar below the tactical toolbar (`UltimateMafiaGame.tsx`)
- Show a compact list of all pending negotiations (📩 waiting / 🤝 ready)
- Each entry shows: capo name, target family, target hex coords, status
- Ready entries get a gold highlight and a **"Sit Down"** button that directly opens the NegotiationDialog (no need to find the hex on the map)
- Visible in both Tactical and Action phases so the player always knows the state

### 2. Auto-prompt notification when sitdowns become ready (turn transition)
- Already notified via pendingNotifications — verify this exists in the turn-end logic
- Add a more prominent "action required" style to the notification: "🤝 Sitdown with [Family] is ready — click to negotiate or find the hex on the map"

### 3. Improve the Send Word instruction text (`UltimateMafiaGame.tsx` ~line 827)
- Add step-by-step flow: "Step 1: Select a capo → Step 2: Click an enemy hex → Step 3: Next turn, use the Sit Down button below or click the hex"

### 4. Pulse the 🤝 badge on the map when ready (`EnhancedMafiaHexGrid.tsx` ~line 1238)
- Add a CSS pulse animation to the ready badge so it visually calls attention on the map

### 5. Add "Sit Down" shortcut button on hex hover tooltip (`EnhancedMafiaHexGrid.tsx` ~line 2149)
- When hovering a hex with a ready negotiation, show a clickable "🤝 Sit Down Now" button in the tooltip panel

## Technical Details

### File: `src/pages/UltimateMafiaGame.tsx`
- **~line 833 (after tactical toolbar)**: Insert a `PendingSitdowns` section that maps over `gameState.pendingNegotiations`, showing status badges and a direct "Sit Down" button for ready ones that sets `negotiationState`
- **~line 827**: Rewrite Send Word description to a numbered step flow

### File: `src/components/EnhancedMafiaHexGrid.tsx`
- **~line 1238**: Add `className="animate-pulse"` or SVG animation to the ready negotiation badge circle
- **~line 2149**: Add an interactive button in the tooltip for ready negotiations

### File: `src/hooks/useEnhancedMafiaGameState.ts`
- Verify turn-end logic flips `ready: true` and sends a notification (already exists — just confirm)

Four files touched, primarily UI additions. No game logic changes needed.

