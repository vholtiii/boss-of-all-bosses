

# Split Negotiation: Boss (Family-Level) vs Capo (Territory-Level)

## Design

**Boss at HQ** handles family-wide diplomacy:
- **Ceasefire** ($8,000 + 5 respect) — stop attacks for 3-5 turns
- **Alliance** ($5,000) — conditional pact with violation penalties

**Capos on enemy hexes** handle local deals:
- **Bribe for Territory** ($8,000+) — pay to peacefully claim the hex
- **Share Profits** ($3,000) — don't take the hex, but earn 30% of its income each turn for 5 turns. Non-aggressive, no reputation cost
- **Safe Passage** ($2,000) — buy 3 turns of free movement through that family's territory without triggering combat. Useful for flanking or reaching distant hexes

## Balance Notes

- **Share Profits** is the peaceful money play — cheaper than Bribe but you don't own the hex. Good for high-income hexes you can't take militarily. Enemy can break it by attacking you (they lose reputation)
- **Safe Passage** is tactical — enables bold moves through enemy lines. Limited to 3 turns, does not grant territory or income. If the capo attacks during safe passage, it's auto-violated (reputation hit)
- Boss negotiations require no unit on enemy territory — the Boss sends word from HQ. Higher cost, bigger scope
- Capo negotiations still require the Capo to be on/adjacent to enemy territory

## Changes

### `src/types/game-mechanics.ts`
- Add `scope: 'family' | 'territory'` to `NegotiationConfig`
- Add `share_profits` and `safe_passage` negotiation types
- Update `NegotiationType` union
- Add `ShareProfitsPact` and `SafePassagePact` interfaces
- Ceasefire/Alliance get `scope: 'family'`, the rest get `scope: 'territory'`

### `src/hooks/useEnhancedMafiaGameState.ts`
- **Boss negotiation action**: New action type `boss_negotiate` available from HQ during Action phase. Opens family-level negotiation dialog (ceasefire/alliance only). No Capo needed — Boss handles it
- **Capo negotiate**: Filter to territory-scope options only (bribe, share_profits, safe_passage)
- **Share Profits logic**: Store pact with target hex + family. In `processEconomy`, calculate income from shared hexes and add 30% to player income. Pact lasts 5 turns
- **Safe Passage logic**: Store pact with target family. In combat resolution, skip combat if attacker has active safe passage with defender. Auto-violate if player attacks during passage (reputation penalty). Lasts 3 turns
- **1 negotiation per turn**: Apply to both Boss and Capo negotiations combined
- **50% refund on failure**: Apply to all negotiation types
- **Single backend roll**: Remove UI roll, backend is authoritative

### `src/components/HeadquartersInfoPanel.tsx`
- Add "Diplomacy" section to Boss Overview with buttons for Ceasefire and Alliance negotiations (against each known enemy family)
- Show active pacts (ceasefires, alliances, shared profits, safe passages) with turns remaining

### `src/components/NegotiationDialog.tsx`
- Accept `scope` prop to filter which options show
- Boss dialog: shows ceasefire + alliance, target family picked from dropdown
- Capo dialog: shows bribe + share profits + safe passage
- Add scope badges, refund note, cooldown display
- Animate backend roll result (no local roll)

### `src/pages/UltimateMafiaGame.tsx`
- Wire Boss negotiate action from HQ panel
- Pass scope to NegotiationDialog based on source (Boss vs Capo)
- Pass `negotiationUsedThisTurn` and `lastNegotiationResult` to dialog

## Files Modified
- `src/types/game-mechanics.ts` — new types, scope field, new pact interfaces
- `src/hooks/useEnhancedMafiaGameState.ts` — boss negotiate action, share profits/safe passage logic, single roll, cooldown, refund
- `src/components/HeadquartersInfoPanel.tsx` — diplomacy section in Boss Overview
- `src/components/NegotiationDialog.tsx` — scope filtering, backend roll animation, new options
- `src/pages/UltimateMafiaGame.tsx` — wire both negotiation sources

