

# Refine Takeover/Extort System — Visual & Audio Feedback

## Problem Summary
When the player clicks "Hit" or "Extort" on the hex action menu, the menu closes, the hex ownership silently updates, and a small toast appears in the corner — but there is no on-map feedback, no dramatic moment, and no sound. It feels like nothing happened.

## Plan

### Step 1: Add a Combat Result Overlay on the Hex Grid
After a Hit or Extort action resolves, display a temporary animated overlay directly on the affected hex showing the outcome.

**What it shows:**
- Success: green flash on hex + floating text showing "+$5,000 / +10 respect" (hit) or "+$3,000 / +5 respect" (extort)
- Failure: red flash on hex + floating text showing "FAILED — 2 casualties"
- The overlay auto-dismisses after ~2.5 seconds with a fade-out

**Implementation:**
- Add a `combatResult` state to `EnhancedMafiaHexGrid` (stores hex coords, outcome type, text, timestamp)
- After `onAction` fires for hit/extort, the game state pushes a `lastCombatResult` field alongside `pendingNotifications`
- The hex grid renders an SVG overlay group at the target hex with framer-motion animations (scale-in, float-up text, color flash)

**Files:** `src/hooks/useEnhancedMafiaGameState.ts`, `src/components/EnhancedMafiaHexGrid.tsx`

### Step 2: Add Sound Effects for Hit and Extort
Use the existing `useSoundSystem` hook (Web Audio API oscillator-based) to play distinct sounds.

**Sounds:**
- Hit success: low rumble + rising tone (combat → success preset combo)
- Hit failure: descending harsh tone (combat → error preset)
- Extort success: cash register chime (money preset)
- Extort failure: error buzz (error preset)

**Implementation:**
- Wire `playSound` calls into the notification drain effect in `UltimateMafiaGame.tsx` — when a combat result notification is detected, play the corresponding sound
- Add new presets to `useSoundSystem.ts` for `hit_success`, `hit_fail`, `extort_success`, `extort_fail` with multi-tone sequences

**Files:** `src/hooks/useSoundSystem.ts`, `src/pages/UltimateMafiaGame.tsx`

### Step 3: Add Hex Flash Animation on Ownership Change
When a hex changes from neutral/enemy to player-owned, animate the hex polygon itself.

**Effect:** The hex border briefly pulses gold (3 pulses over 1.5s), then settles to the new ownership color. Uses framer-motion `animate` on the polygon's stroke/fill.

**Files:** `src/components/EnhancedMafiaHexGrid.tsx`

### Step 4: Remove/Disable Legacy "TAKE OVER" Button
The old `MafiaHud` component has a permanently-highlighted yellow "TAKE OVER" button that is confusing. Since `UltimateMafiaGame.tsx` (the active game page) doesn't use `MafiaHud`, verify it's not rendered. If the user is seeing it, identify where and either remove or disable it.

**Files:** `src/components/MafiaHud.tsx` (audit only — may not need changes)

---

### Technical Details

**Combat Result Data Flow:**
```text
performAction (hit/extort)
  → processTerritoryHit / processTerritoryExtortion
    → sets state.lastCombatResult = { q, r, s, success, title, details, type }
    → sets state.pendingNotifications (existing)

UltimateMafiaGame.tsx useEffect
  → drains pendingNotifications → toasts
  → reads lastCombatResult → plays sound

EnhancedMafiaHexGrid
  → reads gameState.lastCombatResult
  → renders SVG overlay at (q,r,s) with animated text + hex flash
  → auto-clears after timeout
```

**New state field on `EnhancedMafiaGameState`:**
```typescript
lastCombatResult?: {
  q: number; r: number; s: number;
  success: boolean;
  type: 'hit' | 'extort' | 'sabotage';
  title: string;
  details: string; // e.g. "+$5,000, +10 respect"
  timestamp: number;
}
```

