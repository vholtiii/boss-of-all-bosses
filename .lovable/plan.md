

# Add Sound Settings Dialog with 3-Category Volume Control

## Overview
Add a gear/settings icon to the top bar that opens a styled dialog with a mute toggle and three independent volume sliders for different sound categories: UI clicks, notification alerts, and combat/action sounds.

## Changes

### 1. Update Sound System — `src/hooks/useSoundSystem.ts`
- Expand `SoundConfig` to include three volume channels: `uiVolume`, `alertVolume`, `combatVolume`, plus global `enabled` (mute toggle)
- Map each sound preset to a category:
  - **UI**: `click`
  - **Alerts**: `success`, `error`, `notification`, `danger`
  - **Combat**: `combat`, `hit_success`, `hit_fail`, `extort_success`, `extort_fail`, `money`, `levelup`
- `playSound` selects the correct volume channel based on the preset's category
- Use `useState` instead of `useRef` for `soundConfig` so UI re-renders when config changes

### 2. Create Settings Dialog — `src/components/SoundSettingsDialog.tsx`
- New component using the existing `Dialog` UI primitive
- Styled to match the game's noir/mafia aesthetic (dark bg, gold accents)
- Contains:
  - **Master mute toggle** (Switch component) at the top
  - **Three labeled sliders** (Slider component), each 0-100:
    - 🖱️ UI Sounds (clicks, button presses)
    - 🔔 Alert Sounds (notifications, warnings, danger)
    - ⚔️ Combat Sounds (hits, extortion, money, level-up)
  - Each slider has a small speaker icon that toggles that category's individual mute (click to zero, click again to restore)
  - A "Test Sound" button next to each slider that plays a sample from that category
- Props: `soundConfig`, `onUpdateConfig`, `open`, `onOpenChange`

### 3. Wire into Top Bar — `src/pages/UltimateMafiaGame.tsx`
- Add `Settings` (gear) icon import from lucide-react
- Add state: `showSoundSettings`
- Place a gear button in the top bar (next to tutorial/save buttons) with `data-no-sound` to avoid click sound on the settings button itself
- Render `SoundSettingsDialog` with config from `useSoundSystem`
- Destructure `updateSoundConfig` and `soundConfig` from the hook (already partially done)

### 4. Persist Settings — localStorage
- On config change, save to `localStorage` key `'mafia-sound-settings'`
- On hook init, load saved config from localStorage if present
- This way sound preferences survive page refreshes

