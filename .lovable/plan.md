

# Bribe Intel: Reveal Soldier Positions & Hit Intel for Captain/Chief/Mayor

## Problem
Currently, `police_captain`, `police_chief`, and `mayor` bribes only provide turn report intel (recruitment numbers, safehouses, planned hits). They do **not** reveal enemy soldier positions on the map — that uses a legacy `bribedOfficials` system that's disconnected from `activeBribes`.

## What Changes

### Map Fog of War — `src/components/EnhancedMafiaHexGrid.tsx`
- In `isHexRevealed()` (line 95-107): Add a check for `activeBribes` with tier `police_captain`, `police_chief`, or `mayor` targeting the hex's controlling family
- If any such bribe is active and targets that family → reveal the hex (shows soldier types, counts, fortification, safehouses)
- `police_chief` and `mayor` reveal **all** rival hexes (not just the targeted family), since they have broader reach

### Turn Report Intel — `src/hooks/useEnhancedMafiaGameState.ts`
- Already works for recruitment, safehouses, and planned hits — no change needed there
- Add: when `police_captain`+ bribe is active against a family, show that family's **soldier deployment movements** in the turn report (AI deploy/move actions)
- In AI movement/deploy sections (~lines 2700-2800), add intel gating similar to existing recruitment intel

### Bribe Descriptions — `src/types/game-mechanics.ts`
- Update `police_captain` description: `'20% economic pressure + reveals target family positions & intel'`
- Update `police_chief` description: `'+50% intel on target rival + reveals all rival positions'`
- Update `mayor` description: `'Shut down rival territory + full map intel'`

### Corruption Panel — `src/components/CorruptionPanel.tsx`
- No structural changes needed — descriptions auto-update from `BRIBE_TIERS`

## Files Modified
- `src/components/EnhancedMafiaHexGrid.tsx` — fog of war reveal via `activeBribes`
- `src/hooks/useEnhancedMafiaGameState.ts` — AI movement intel in turn reports
- `src/types/game-mechanics.ts` — updated bribe descriptions

