

# Fix False "Territory Secured" Notification

## Problem

Every time you click on a hex/business you own, the game fires a "Territory Secured — Bronx is now under your control" notification. It only checks if the clicked hex belongs to your family, not whether you actually control the district (60%+ threshold).

## Fix

**File: `src/pages/UltimateMafiaGame.tsx`** — two locations (lines 272-274 and 986-988)

Replace the simple family check with a district control percentage check:

```typescript
// Before:
if (business.family === gameState.playerFamily) {
  notifyTerritoryCaptured(business.district);
}

// After: only notify if player controls 60%+ of the district
const districtHexes = (gameState.hexMap || []).filter(t => t.district === business.district);
const playerHexes = districtHexes.filter(t => t.controllingFamily === gameState.playerFamily);
const controlPct = districtHexes.length > 0 ? playerHexes.length / districtHexes.length : 0;
if (controlPct >= 0.6) {
  notifyTerritoryCaptured(business.district);
}
```

Apply this same fix at both `onBusinessClick` handlers (line ~272 and ~986).

This ensures the notification only appears when you genuinely control the district, matching the 60% threshold used elsewhere in the game.

