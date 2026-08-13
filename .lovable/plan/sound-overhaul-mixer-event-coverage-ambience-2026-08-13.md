# Sound overhaul: mixer, event coverage, ambience

Music stays menu-only. The work is: a proper 4-channel mixer, sounds for the game events that are currently silent, a looping city ambience bed under the map, a cleaner UI tone set, and short voice barks on the big moments.

## 1. Mixer and settings

Sound Settings grows from 2 sliders to 4 channels, each with mute toggle and a Test button:

- **Music** — menu theme (currently hidden behind an implicit default)
- **SFX** — synthesized UI/game tones
- **Voice** — recorded clips and barks
- **Ambience** — looping city bed

Master Sound toggle stays on top and kills everything. All four persist to local storage, with migration from the current saved shape so existing players keep their levels.

## 2. Menu music behaviour

- Music plays on the family-select screen only, fades out on "start game" (already the case) and fades back in when returning to the menu.
- Music now reads its own `musicVolume` instead of deriving from SFX.

## 3. Ambient city bed

A low looping street ambience (rain, distant traffic, faint sirens) plays under the map during gameplay on the Ambience channel, default ~30%. It fades in when the game board mounts and out on game over / return to menu. Heat level nudges the bed: at high heat the siren layer becomes slightly more present.

Requires one generated loop asset (`public/audio/city-ambience.mp3`). If audio generation isn't available, the Ambience channel ships wired up but silent until the asset lands.

## 4. Event coverage

Currently silent events that get sounds (synth voices unless noted):

| Event | Treatment |
| --- | --- |
| Turn start / turn end | Soft downbeat / resolving chord |
| Money income tick | Light coin shimmer scaled to amount |
| Buy out racket | Cash-register + stamp |
| Build start / complete | Existing clips, wired to the new build actions |
| Building upgrade (T2/T3) | Rising three-note motif |
| Standing order set | Short confirm blip |
| Unit select / move | Distinct low tick and footstep-ish thud |
| Heat threshold crossed | Warning swell, more urgent per tier |
| War declared | Low brass-ish hit |
| Pact signed / broken | Warm two-note / sour dissonant pair |
| Sitdown ready | Soft bell |
| Promotion to Capo | Existing levelup, upgraded |
| Insufficient funds / blocked action | Distinct "denied" thunk, not the generic error |

## 5. UI tone set

Replace the single reused `click` beep with: `hover` (very quiet), `click`, `open` (panel/modal in), `close`, `toggle`, `deny`. Existing `playSound('click')` calls are re-pointed to the right tone per context so panels, tabs and buttons no longer sound identical.

## 6. Voice barks

Short spoken lines on the big beats — successful hit, failed hit, arrest, capo promotion, war declared — picked at random from 2-3 variants per event so they don't get stale, and rate-limited so a busy turn doesn't stack them. Plays on the Voice channel alongside the existing gunshot/arrest clips.

Barks need generated voice assets. If ElevenLabs isn't connected the bark layer is skipped gracefully and the existing clips still play; I'll flag it when we get there.

## Technical notes

- `useSoundSystem.ts`: add `musicVolume` and `ambienceVolume` to `SoundConfig` with storage migration; extend the synth `VOICES` map with the new tones; add a small random-variant + cooldown helper for barks; route file clips through the Voice channel as today.
- New `useAmbience.ts` hook modelled on `useBgMusic.ts` (loop, fade in/out, respects channel volume + master mute), mounted in `UltimateMafiaGame`.
- `SoundSettingsDialog.tsx`: four `CategorySlider` instances with per-channel test hooks.
- Event wiring lands in `UltimateMafiaGame.tsx` (notification-driven events), `CityPanel.tsx` / `TileDevelopmentPanel.tsx` (build/buyout/policy), and `EnhancedMafiaHexGrid.tsx` (select/move).
- No gameplay logic changes — sound triggers only.
