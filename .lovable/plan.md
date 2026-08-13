# Sound pass: supply lines, escort, and sitdowns

## Scope

Fill the remaining important-action gaps the user called out without overwriting the existing sound set. Add distinct procedural sounds for:

1. **Establishing a supply line** — both a supply node newly connecting to your territory and a supply-deal pact being signed.
2. **Escorting a soldier** — attaching a soldier to a capo, and the capo moving with escorts.
3. **Sitdowns** — a sitdown being proposed, becoming ready, and being accepted/declined.

The existing Music / Ambience / SFX / Voice mixer, settings dialog, and all current `playSound` calls stay untouched. Voice stays ambient-only (no spoken barks).

## Sound design

- **Supply line connect**: a low, rising drone (sawtooth + triangle) that resolves upward, like a line locking in — roughly 0.8s, low-mid frequency.
- **Supply deal pact**: a short metallic/clinking two-note tone (distinct from `pact_signed`, which is warm) because a supply deal is a business transaction.
- **Escort attach**: a clipped “formation” sound — two short square ticks in quick succession.
- **Escort move**: a heavier, muffled footfall + low thud when a capo drags escorted soldiers into a new hex.
- **Sitdown proposed**: a soft, cautious bell/chime (different from the general notification bell).
- **Sitdown ready**: a slightly more resolved, warm chord.
- **Sitdown accepted**: a single, clean handshake-like tone.
- **Sitdown declined**: a sour, short dissonant pair.

All synthesized via the Web Audio graph in `useSoundSystem.ts` (no new asset files to manage). Each sound is routed through the SFX channel and respects the existing volume, mute, and de-dupe rules.

## Wiring

### `src/hooks/useSoundSystem.ts`

- Extend the `VOICES` record with: `supply_connect`, `supply_deal`, `escort_attach`, `escort_move`, `sitdown_proposed`, `sitdown_ready`, `sitdown_accepted`, `sitdown_declined`.
- No changes to `SoundConfig`, storage, or channel behavior.

### `src/hooks/useEnhancedMafiaGameState.ts`

- When a `supplyChanges` event with `event === 'connected'` is produced during turn resolution, push a notification with title `Supply Line Established` and the relevant detail so the notification processor in `UltimateMafiaGame.tsx` can pick it up.
- When a `supply_deal` pact is created (player or AI), push a `Supply Deal Active` success notification.
- When `startEscort` succeeds, push an `Escort Formed` info notification.
- When a capo moves with escorted soldiers, include a flag in the resulting state so the UI layer can trigger `escort_move`.
- When a sitdown is proposed, accepted, declined, or becomes ready, add explicit notification titles: `Sitdown Proposed`, `Sitdown Ready`, `Sitdown Accepted`, `Sitdown Declined`.

### `src/pages/UltimateMafiaGame.tsx`

- In the `pendingNotifications` switch, map the new notification titles to the new sound keys:
  - `Supply Line Established` / `Supply Reconnected` → `supply_connect`
  - `Supply Deal Active` → `supply_deal`
  - `Escort Formed` / `Soldier Attached` → `escort_attach`
  - `Sitdown Proposed` → `sitdown_proposed`
  - `Sitdown Ready` → `sitdown_ready`
  - `Sitdown Accepted` → `sitdown_accepted`
  - `Sitdown Declined` → `sitdown_declined`
- Add an effect or callback that watches for the escort-move flag and fires `escort_move`.

### `src/components/SitdownsPanel.tsx` and `src/components/GameSidePanels.tsx`

- Keep UI logic as-is; the sound triggers come from the notification stream and the game-state hook, not from direct UI clicks, so all paths (player action, AI action, turn resolution) are covered consistently.

## Testing

- Add a small test file `src/hooks/__tests__/new-sound-events.test.ts` that verifies the sound hook exposes the new keys and that each voice function runs without throwing when called at a nominal volume.
- Run the full test suite and type-check before finishing.

## Out of scope

- No new music or ambience work (the existing `useBgMusic` and `useAmbience` hooks are already in place).
- No new voice/bark clips (ambient reactions only, per user direction).
- No changes to existing sound keys, file clips, or mixer channel layout.
