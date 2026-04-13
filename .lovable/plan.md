

# Add Subtle Family Power Visual Elements to Gameplay UI

## Overview
Three additions: (1) dashed border accents on hex map for active powers, (2) small status badge in the top bar for active power durations, (3) AI power usage entries in the turn summary modal.

## 1. Hex Map Border Accents (`EnhancedMafiaHexGrid.tsx`)

Following the existing pattern (fortified = green circle+shield, scouted = blue circle+eye), add thin colored dashed borders around hexes affected by active powers. No badges — just borders that blend with existing visual language.

**Genovese — Front Boss hexes**: Thin purple dashed border (matching Genovese color `#8A2BE2`) around hidden hexes owned by the player. For enemy Front Boss hexes visible via scout, show a faint gray dashed border with a 🎭 badge (same positioning pattern as fortified shield badge).

**Lucchese — Boosted District**: When `luccheseBoostedDistrict` is active, all player hexes in that district get a thin gold dashed border (`#D4AF37`, `strokeDasharray="4,3"`, low opacity ~0.6). Subtle enough to notice on inspection but not distracting.

**Bonanno — Purge Immunity**: Soldiers with active flip immunity get a very faint teal ring around the soldier icon position (using `bonannoPurgeImmunity` unit IDs). Just a 1.5px dotted circle.

**Gambino**: No persistent hex indicator needed (scout results already show via existing 👁️ badges).

**Colombo**: No hex indicator (passive/reactive).

Add entries to the collapsible legend at the bottom-left:
- Purple dashed = "Front Boss (Hidden)"
- Gold dashed = "Boosted District"

## 2. Status Bar Indicator (`UltimateMafiaGame.tsx`)

In the existing status badge row (lines ~570-594, where pact expiry warnings and cooldown badges live), add a small power status pill when any power effect is active:

- Front Boss: `🎭 Front Boss: 2t` (purple-tinted pill)
- Lucchese Boost: `💰 Shakedown: 3t` (gold-tinted pill)  
- Bonanno Immunity: `🛡️ Purge: 2t` (teal-tinted pill)
- Power cooldown: `⚡ [PowerName]: 2t CD` (muted pill, only during tactical phase)

Same styling as the existing cooldown/pact badges: `px-2 py-0.5 rounded-full text-[10px] border`.

## 3. Turn Summary Entries (`TurnSummaryModal.tsx` + game state)

AI power usage is already tracked via `aiActions` in the turn report. Ensure the game state's AI power activation logic pushes entries like:
- `{ family: 'genovese', action: 'family_power', detail: '🎭 Activated Front Boss on a hex in Midtown' }`
- `{ family: 'bonanno', action: 'family_power', detail: '🔫 Donnie Brasco Purge — removed 2 disloyal soldiers' }`

These will automatically appear in the "Rival Activity" section of the existing turn summary modal with no UI changes needed there.

The game state hook (`useEnhancedMafiaGameState.ts`) needs to push these `aiActions` entries in the AI power usage block of `processAITurn()`.

## Files Changed

1. **`src/components/EnhancedMafiaHexGrid.tsx`** — Add dashed border overlays for Front Boss, Lucchese boost, and Bonanno immunity. Add legend entries.
2. **`src/pages/UltimateMafiaGame.tsx`** — Add active power status pills in the status badge row.
3. **`src/hooks/useEnhancedMafiaGameState.ts`** — Add `aiActions` push calls in AI power usage logic so they appear in turn summaries.

