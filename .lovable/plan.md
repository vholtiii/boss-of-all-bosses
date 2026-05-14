## Problem

The "Soldier jailed — returns turn N" entry you're seeing is an **AI family's soldier**, not yours.

In `src/hooks/useEnhancedMafiaGameState.ts` around line 7459, the AI heat block arrests AI soldiers and pushes them into the same shared `state.arrestedSoldiers` array the player uses:

```ts
state.arrestedSoldiers = [...(state.arrestedSoldiers || []), {
  unitId: arrested.id,
  returnTurn: state.turn + sentence,
  source: 'heat',
}];
```

The right‑sidebar UI in `GameSidePanels.tsx` (line ~831) then renders every entry in that array as **"🔒 Soldier jailed — returns turn N"** with no family filter — so AI arrests show up as if they were yours.

This also explains a chunk of your "spontaneous soldier" complaints: when those entries hit `returnTurn`, the release block at line 4243 re-deploys the unit **at the player HQ as `family: playerFamily`** — silently converting an AI soldier into a player soldier.

## Plan

1. **Tag every arrest entry with `family`.** Extend the `arrestedSoldiers` / `arrestedCapos` entry type with `family: FamilyId`. Set it on every push site:
   - Player heat arrest (~4328) → `family: playerFamily`
   - Player prosecution arrest (~4449) → `family: playerFamily`
   - AI heat arrest (~7459) → `family: fam`
   - Any other push site found in a final sweep.

2. **Filter the jail UI to the player.** In `GameSidePanels.tsx` line ~829‑836, only render entries where `a.family === gameState.playerFamily` (treat missing `family` as player for backward compatibility with existing saves, since pre‑fix entries were effectively player‑scoped on the UI side anyway).

3. **Filter the release blocks to the right family.**
   - Player heat release (~4239) and player prosecution release (~4531): only operate on `a.family === playerFamily` (or undefined for legacy entries).
   - Add a parallel AI release path: AI entries past `returnTurn` get re‑deployed at that AI family's HQ as `family: a.family`, with a corresponding AI-arrest notification ("🔓 Genovese soldier released from jail"). Same dedupe / `alreadyDeployed` guard.

4. **Fix the lawyer reduction (~8466) to only touch player arrests.** Currently it maps over the full array; restrict to `a.family === playerFamily || !a.family`.

5. **Backfill existing saves.** In `src/lib/saveMigrations.ts`, on load, set `family = playerFamily` on any `arrestedSoldiers` / `arrestedCapos` entry missing the field. This clears the confusion on your current save without erasing legitimate jail terms.

6. **Verify**:
   - Push an AI family's heat to ≥30 and trigger an AI arrest → no entry appears in your jail list.
   - Advance past that AI sentence → an AI soldier reappears at the AI's HQ, not yours; you do not gain a soldier.
   - Your own heat arrests still show up and release at your HQ as before.
   - Hire-lawyer still reduces only your sentences.

### Files to touch

- `src/hooks/useEnhancedMafiaGameState.ts` — type (~502), all push sites, both release blocks, lawyer reduction.
- `src/components/GameSidePanels.tsx` — jail list filter (~829).
- `src/lib/saveMigrations.ts` — backfill `family` on existing entries.

No gameplay-balance changes; this is a containment fix for a state-leak bug between AI and player.
