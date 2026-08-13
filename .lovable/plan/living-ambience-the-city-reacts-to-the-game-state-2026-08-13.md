# Living ambience: the city reacts to the game state

No weather. Instead, the existing procedural ambience bed learns to read more of the game and shifts its mix continuously, so the map *sounds* different when you're winning, at war, broke, or one bad turn from a RICO indictment.

Today the bed is rain hiss + traffic rumble + heat-scaled sirens. This adds four more signals and a few new layers.

## Signals the bed will react to

| Signal | Source | What you hear |
| --- | --- | --- |
| Police heat (already wired) | heat tier 0-100 | Sirens more frequent and louder; above the "critical" tier a slow low pulse (police presence) fades in under everything |
| War / tension | active wars involving the player, plus highest family tension | Distant sporadic gunfire pops and a tense low drone; peace = clean street noise only |
| Territory & economy | player blocks controlled + net income | Prosperity layer: faint crowd murmur, chatter and a distant radio when you're up; when income is negative or turf is shrinking the bed thins out to cold wind and sparse traffic |
| Progression phase | phases 1-4 | Density scales: Phase 1 is quiet backstreet, Phase 4 is a busy city with more traffic and layered activity |

All four are blended, not switched — each layer has its own gain that ramps over ~2-4 seconds when the underlying value moves, so transitions are inaudible as cuts.

## New sound layers

- **Crowd/chatter murmur** — filtered noise + slow formant wobble, gain from prosperity.
- **Distant gunfire** — sparse randomized cracks (reverb tail), only when at war or tension is high.
- **Tension drone** — sub-bass swell tied to max tension with any family.
- **Cold wind** — highpassed noise that rises as the prosperity layer falls (broke / losing).
- **Police pulse** — slow low throb at critical heat / RICO timer running.

## Turn-level accents (one-shots, not the bed)

Short stingers layered over the bed when the environment *changes state*, so shifts are noticed:

- Heat crosses into a new tier (already partly covered) — reinforced with a siren doppler pass.
- War declared / war ends — the gunfire and drone layers ramp in or out with a marked transition hit.
- Phase milestone reached — the city audibly "opens up" as density steps.
- Bankruptcy warning — wind layer surges.

## Mixer

Everything stays on the existing **Ambience** channel, respecting its volume and master mute. One addition to Sound Settings: an "Ambience reacts to the game" toggle for players who want a flat, constant bed.

## Technical notes

- `src/hooks/useAmbience.ts` grows from `{ heat }` to an `ambienceState` object: `{ heat, atWar, maxTension, prosperity, phase, ricoActive }`. Each layer keeps a persistent node graph created once; a single effect maps the state object to target gains and ramps them with `linearRampToValueAtTime`.
- `prosperity` is a derived 0-1 value computed in `UltimateMafiaGame.tsx` from player territory share and net income — a small pure helper (`src/lib/ambience-state.ts`) so it can be unit tested.
- `UltimateMafiaGame.tsx` passes the derived object; war and tension come from `activeWars` and `familyTensions`, phase from the existing milestone value.
- Randomized one-shots (gunfire, siren pass) use the same self-rescheduling timer pattern as the current siren scheduler, with gaps driven by the live state refs.
- No gameplay logic changes — read-only consumption of existing state.
