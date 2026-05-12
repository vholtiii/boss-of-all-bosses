## Goal
Replace the current 3-category sound mixer (UI / Alert / Combat) with two clear sliders — **SFX** (synthesized oscillator beeps) and **Voice** (recorded `.mp3` clips like the gunshot, extortion lines, arrest line) — plus the existing **Master mute** toggle.

## Why this split
The "voice vs SFX" axis cuts cleanly across the codebase:
- **Voice** = anything in `SOUND_FILES` (`hit_kill`, `assassin_kill`, `capo_fail`, `extort_success`, `extort_fail` voice layer, `arrest`).
- **SFX** = every synthesized preset in `soundPresets` (clicks, notifications, danger beeps, money chime, hit_fail beep, the synth half of `extort_fail`, etc.).

Compound sounds like `extort_fail` (file + synth) naturally route each leg to its own slider — you can mute the voice line and still hear the fail buzzer, or vice versa.

## Steps

### 1. `src/hooks/useSoundSystem.ts`
- Update `SoundConfig` interface: replace `uiVolume` / `alertVolume` / `combatVolume` with `sfxVolume` and `voiceVolume`. Keep `enabled` (master mute).
- Update `DEFAULT_CONFIG` accordingly (default both to `0.5`).
- Delete the `SOUND_CATEGORIES` map and the old `getVolumeForSound` helper. Replace with two helpers:
  - `getVoiceVolume()` → returns `enabled ? voiceVolume : 0`
  - `getSfxVolume()` → returns `enabled ? sfxVolume : 0`
- In `playSound`:
  - File branch uses `getVoiceVolume()` for `audio.volume` (skip if 0).
  - Oscillator branch uses `getSfxVolume()` for the gain ramp (skip if 0).
  - `FILE_ONLY_SOUNDS` logic unchanged.
- Add a one-time **migration** in `loadConfig`: if a saved blob still has `uiVolume`/`alertVolume`/`combatVolume`, derive `sfxVolume = max(uiVolume, alertVolume)` and `voiceVolume = combatVolume`, then drop the old keys. Re-save under the same `STORAGE_KEY`.

### 2. `src/components/SoundSettingsDialog.tsx`
- Remove the three `CategorySlider` instances and their imports (`Mouse`, `Bell`, `Swords`).
- Render two `CategorySlider`s:
  - **SFX** — icon `Bell` (or `Volume2`), description "Beeps, clicks & alerts", `value={soundConfig.sfxVolume}`, `onChange={(sfxVolume) => onUpdateConfig({ sfxVolume })}`, test plays `'click'`.
  - **Voice** — icon `Mic` (lucide-react), description "Spoken lines & gunshots", `value={soundConfig.voiceVolume}`, test plays `'arrest'` (short, recognizable clip).
- Keep the master Sound switch block unchanged. Both sliders disable when master is off (existing `disabled` prop).

### 3. Verify call sites
- `onTestSound={playSound}` in `UltimateMafiaGame.tsx` already routes to the same `playSound`, no change needed.
- `SOUND_CATEGORIES` is not exported and only used internally — safe to remove.
- Run a quick `rg` check for `uiVolume|alertVolume|combatVolume` across `src/` to confirm no other references survive (the dialog and hook are the only known users).

## Out of scope
- No changes to background music (`useBgMusic`) — it has its own controls.
- No new sound files, no re-tuning of existing presets, no UI redesign beyond the slider swap.
- No per-sound overrides.
