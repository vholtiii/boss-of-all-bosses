# Unified Recruit Notifications

Every way a soldier joins the family should announce itself the same way: one clear notification, an entry in the turn summary and the Just Happened feed, plus a sound cue and a flash on the map.

## What changes

### 1. One recruit event, four sources
Today the four recruit paths (infrastructure block growth, mercenary hire, local loyal recruit, Bronx free recruit) each fire their own ad-hoc notification with different wording. They will all route through a single helper that emits a consistent event:

- Title: `👥 New Soldier` (plural `👥 X New Soldiers` when several arrive in one turn)
- Line: source + where they came from, e.g. "Recruited from the Fulton Street infra block", "Mercenary hired at HQ", "Local from the Bronx (free)".
- Passive block recruits arriving in the same end-of-turn pass are grouped into one notification instead of one per block.

### 2. Turn summary
The turn summary modal gets a "Crew" row/section listing recruits gained this turn, broken down by source (passive / hired / local / district-free), with the running soldier count before → after.

### 3. Just Happened feed
Each recruit event is pushed to the Just Happened feed with the same wording and a crew icon, auto-dismissing on the standard 8s timer.

### 4. Sound + visual flash
- New sound cue registered in the sound mapping (a short affirmative "crew" stinger) played on any recruit event, respecting the existing mixer channels and mute settings.
- **Voice note**: a gravelly noir line plays once per turn when new soldiers join ("Fresh blood at the table, boss."). Batched — one line no matter how many joined that turn — on the voice channel, obeying the existing bark cooldown and volume settings. Lines are AI-generated audio files shipped with the game (a few variants, picked at random; singular vs plural wording).
- The block that produced the recruit pulses a brief green flash / floating "+1 SOLDIER" text through the existing map effects layer. HQ pulses for hires with no source block.

## Technical notes

- Add a `recordRecruit({ count, source, tile? })` helper in `useEnhancedMafiaGameState.ts`; replace the four inline notification sites (~lines 4013, 5888, 9524, 9573) with calls to it.
- Accumulate recruits into the existing turn report structure (alongside income breakdown) so `TurnSummaryModal.tsx` can render the Crew section.
- Register a `recruit` voice in `src/lib/sound-mapping.ts` and trigger it from the helper.
- Reuse the floating-text / flash API already used by extort and combat feedback in `MapEffectsLayer.tsx`.
- Add a `recruit` bark set to `BARKS` in `useSoundSystem.ts` pointing at new `/sounds/barks/recruit-*.mp3` files; generate those clips as noir voice lines and drop them in `public/sounds/barks/`. Fire the bark from the end-of-turn recruit rollup only (once per turn), not per recruit.
- Player-only notifications; rival recruits stay silent (no change to AI parity logic).
