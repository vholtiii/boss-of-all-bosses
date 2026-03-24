

# Boss Overview Panel: Unit & Business List with Map Highlighting

## Summary
When the player clicks the Boss icon in the HQ panel, expand a "Boss Overview" sub-panel showing all deployed units and all owned/extorted businesses. Clicking any item highlights its hex on the map with a distinct pulsing ring.

## Changes

### 1. Add highlight state — `src/pages/UltimateMafiaGame.tsx`
- New state: `bossHighlightHex: { q: number; r: number; s: number } | null`
- Pass it as a prop to `EnhancedMafiaHexGrid` and `HeadquartersInfoPanel`
- Pass a `onBossHighlightHex` callback to HeadquartersInfoPanel that sets/clears this state

### 2. Boss Overview sub-panel — `src/components/HeadquartersInfoPanel.tsx`
- Add `bossExpanded` local state, toggled by clicking the Boss card
- When expanded (player family only), show two scrollable sections:

**Units List:**
- Each deployed soldier and capo listed with type icon, district name, and coordinates
- Units at HQ listed separately as "Stationed at HQ"
- Clicking a deployed unit calls `onBossHighlightHex({ q, r, s })` — clicking again or clicking another clears/changes it

**Businesses List:**
- All `familyBusinesses` listed with business icon, name/type, district, income, and legal/illegal badge
- Clicking a business calls `onBossHighlightHex` with that business's hex coordinates

- New props: `deployedUnits` (full deployed units array), `onBossHighlightHex`, `bossHighlightHex`

### 3. Highlight hex on map — `src/components/EnhancedMafiaHexGrid.tsx`
- Accept new prop `bossHighlightHex: { q: number; r: number; s: number } | null`
- In the hex render loop, when a hex matches `bossHighlightHex`, render a bright gold animated pulsing ring (similar to the plan-hit planner highlight) so it's unmistakable on the map

### 4. Wire props — `src/pages/UltimateMafiaGame.tsx`
- Pass `deployedUnits`, `bossHighlightHex`, and `onBossHighlightHex` to HeadquartersInfoPanel
- Pass `bossHighlightHex` to EnhancedMafiaHexGrid
- Clear `bossHighlightHex` when HQ panel closes

## Files Modified
- `src/components/HeadquartersInfoPanel.tsx` — Boss expandable sub-panel with unit/business lists
- `src/components/EnhancedMafiaHexGrid.tsx` — render gold highlight ring for `bossHighlightHex`
- `src/pages/UltimateMafiaGame.tsx` — state + prop wiring

