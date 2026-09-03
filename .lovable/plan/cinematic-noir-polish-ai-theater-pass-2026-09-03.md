# Cinematic Noir Polish & AI Theater Pass

Make the game feel like a premium console strategy title while keeping the existing mechanics intact. The focus is on three pain points: making rivals feel like distinct medium-threat characters, giving every important beat cinematic/audio punch, and breaking the mid-game repetition with a more theatrical turn flow.

## Goals

- Elevate the noir dossier aesthetic into a living, cinematic boardroom.
- Make AI families readable, reactive, and personally threatening.
- Give turn starts, combat, war declarations, and victories memorable audio-visual moments.
- Reduce mid-game sameness with rival power plays, camera moves, and a visible power leaderboard.
- Keep all existing mechanics; this is presentation, pacing, and AI personality polish.

## Workstreams

### 1. Cinematic Turn Flow — "The Commission's Eye"

A short, skippable cinematic sequence at the start of each player turn and a rival-action recap at end of turn.

- **Turn-start card**: family crest, turn number, season/time-of-day, and a one-line status headline (e.g., "Heat is rising" / "War with Genovese"). Displayed as a full-screen or center-stage overlay that fades after ~2.5s or on click.
- **Rival recap reel**: after the player ends turn, queue the most significant AI actions (territory lost, hit landed, pact signed, war declared) as a series of small spotlight cards with family crests, location names, and consequences. Skippable.
- **Camera integration**: when a spotlight references a hex, the map smoothly pans/zooms to that location before the card dismisses.
- **Files**: new `TurnSpotlight.tsx`, extend `HitSpotlight.tsx`, wire into `UltimateMafiaGame.tsx` and `useEnhancedMafiaGameState.ts` turn boundaries.

### 2. AI Personality Theater — "The Five Families Have Faces"

Turn the AI from invisible score-chasers into recognizable rival bosses.

- **Rival dossier cards**: in the right sidebar, show each rival family's current posture, personality, recent mood, territory count, and a short generated headline summarizing what they did last turn.
- **Rival broadcasts**: when an AI declares war, breaks a pact, launches a planned hit, or offers a sitdown, surface a stylized message from the rival boss with their family crest and a terse in-character line.
- **Signature behaviors**: lean harder on existing `AIPersonality` and `DynamicMood` so, for example, Colombo feels reckless, Bonanno feels slippery, and Genovese feels relentless. Add one signature tactical quirk per family (e.g., Gambino favors buyouts over bloodshed, Colombo overextends into player territory).
- **Files**: extend `src/lib/ai-strategy.ts` signature quirks, new `RivalDossierStrip.tsx`, update `GameSidePanels.tsx`, add rival narrative lines to `src/lib/rival-narrative.ts`.

### 3. Living Map Atmosphere — "The City Breathes"

Make the hex map feel less static and more like a noir city at war.

- **Time-of-day cycle**: advance the visual time each turn (dawn → day → dusk → night) with a global color grade over the SVG map. Tie it to ambient audio mix.
- **District vignettes**: when the player hovers a district name or clicks a district-upgrade, briefly highlight the district boundary with a subtle ink-wash fill and show a short flavor label.
- **Combat camera**: when a hit/sabotage/extort resolves, smoothly pan the map to the target hex and flash a localized effect (already partially in `MapEffectsLayer.tsx`; extend with camera focus).
- **Weather/state overlays**: light rain/snow/fog particle layers that intensify with police heat, war count, and phase progression.
- **Files**: `EnhancedMafiaHexGrid.tsx`, `MapEffectsLayer.tsx`, `AtmosphericParticles.tsx`, `period-theme.ts` for color grades.

### 4. Audio Stingers & Reactive Music — "The Score Follows the Power"

Build on the existing synthesized sound and ambience systems.

- **Turn-start stinger**: a short musical motif that plays when the turn-start card appears, with a darker variant for high-heat or wartime turns.
- **Event stingers**: distinct synthesized cues for war declaration, phase-up, rival pact, supply-line severed, and RICO warning.
- **Reactive music bed**: extend `useAmbience.ts` / `useBgMusic.ts` so the background music layer shifts intensity based on combined threat (heat + wars + leader progress), not just a static loop.
- **Spatial combat audio**: pan one-shot combat sounds toward the target hex's screen position using Web Audio `StereoPannerNode`.
- **Files**: `useSoundSystem.ts`, `useAmbience.ts`, `sound-mapping.ts`, `useBgMusic.ts`.

### 5. Console-Ready UX Scale — "Readable from the Couch"

Make the interface feel like it belongs on a TV or premium handheld without rebuilding it.

- **Focus rings & snap states**: add visible focus outlines for keyboard/controller navigation on all interactive elements (buttons, hexes, sidebar cards).
- **Radial/contextual action menu**: when a unit or hex is selected, present the available actions in a compact radial or arc menu near the cursor instead of a distant sidebar list.
- **Bigger readable badges**: scale up resource tiles, turn meter, and notification cards by ~10–15% with tighter contrast.
- **Persistent objective strip**: add a thin top objective bar showing the current win condition progress and one active rivalry/war so the player always knows the stakes.
- **Files**: `TurnActionMeter.tsx`, `GameSidePanels.tsx`, `EnhancedMafiaHexGrid.tsx` action menu, new `ObjectiveStrip.tsx`.

## Out of Scope

- No new core mechanics (no missions, quests, or RPG systems).
- No backend or multiplayer changes.
- No full art asset replacement; we will generate or synthesize only what is needed for the above features.

## Success Criteria

- A new player can identify which rival family is the biggest threat within the first three turns.
- Combat, war declarations, and turn transitions each have a distinct audio-visual moment.
- The mid-game no longer feels like identical turns; the rival recap and objective strip create natural drama.
- All changes pass existing tests and typecheck.

## Suggested Order

1. Turn-start card + camera pan (highest visible impact).
2. Rival dossier cards + broadcasts (addresses AI competition).
3. Audio stingers + reactive ambience (addresses feedback punch).
4. Time-of-day + weather overlays (addresses map life).
5. Console UX scale + objective strip (addresses readability and mid-game stakes).
