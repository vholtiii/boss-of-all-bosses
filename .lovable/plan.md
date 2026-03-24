

# Map Size Options: Small, Medium, Large

## Sizing (current radius 10 = Medium)

| Size | Radius | ~Hex Count | Feel |
|------|--------|-----------|------|
| Small | 7 | ~169 | Fast, aggressive |
| Medium | 10 | ~331 | Current default |
| Large | 13 | ~547 | Epic, sprawling |

## Changes

### `src/components/FamilySelectionScreen.tsx`
- Add `mapSize` state (`'small' | 'medium' | 'large'`, default `'medium'`)
- Add 3-button selector row below difficulty (same style): "🗺️ Small (Fast)", "🗺️ Medium (Classic)", "🗺️ Large (Epic)"
- Update `onSelectFamily` callback signature to include `mapSize`

### `src/pages/UltimateMafiaGame.tsx`
- Add `mapSize` to `GameConfig`, pass through to game state initializer

### `src/hooks/useEnhancedMafiaGameState.ts`
- Accept `mapSize` in `createInitialGameState`, map to radius: `{ small: 7, medium: 10, large: 13 }`
- **HQ Positions** — define per-size:
  - **Small (r=7):** gambino(-5,5,0), genovese(5,-5,0), lucchese(-5,-1,6), bonanno(5,2,-7), colombo(0,-6,6)
  - **Medium (r=10):** current positions (unchanged)
  - **Large (r=13):** gambino(-11,11,0), genovese(11,-11,0), lucchese(-11,-1,12), bonanno(10,3,-13), colombo(0,-12,12)
- **District boundaries** — scale `getDistrict()` thresholds proportionally:
  - Current thresholds: `±4` and `±3` for radius 10 (~40% of radius)
  - Formula: `threshold = Math.ceil(radius * 0.4)` applied dynamically
- No other scaling needed — AI recruitment, economy, etc. naturally scale with hex count

## Files Modified
- `src/components/FamilySelectionScreen.tsx` — map size selector UI
- `src/pages/UltimateMafiaGame.tsx` — pass mapSize in config
- `src/hooks/useEnhancedMafiaGameState.ts` — dynamic radius, HQ positions, district boundaries

