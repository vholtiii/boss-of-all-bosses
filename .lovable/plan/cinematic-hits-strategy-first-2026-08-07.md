# Cinematic Hits, Strategy First

## Goal
Make hits feel like consequential noir operations without turning combat into a cutscene. Every presentation beat should reinforce the decision: why the attack succeeded or failed, who is now exposed, and what changed on the board.

## Direction
Use a blended treatment:
- **Tactical cut-in** for the immediate result: briefly spotlight the target hex and show the decisive modifiers.
- **Evidence dossier** for important outcomes: a compact stamped result panel for capo kills, planned hits, HQ assaults, and other high-stakes actions.
- **Street-level impact** for the map: a sharper burst, directional particles, sound layering, and aftermath markers.

Default playback is a **brief 2–3 second spotlight** with a visible **Skip** action. Routine hits should resolve closer to one second; major outcomes may use the full spotlight.

## Player-facing sequence
```text
Commit action
  -> 250–350ms target lock / camera emphasis
  -> resolve existing combat math
  -> impact burst + layered sound
  -> result card: Why it worked / Who is exposed
  -> return focus to the board with aftermath marker
```

The combat result remains authoritative immediately. The sequence is presentation-only and must never delay turn-state updates, consume extra actions, or change hit odds.

## Implementation slices

### 1. Add a structured hit presentation model
Create a small presentation payload derived from `lastCombatResult` and the existing combat state, including:
- hit style: standard, blind, scouted, planned, hitman, capo, or HQ;
- outcome and stakes: success, failure, wounded, killed, civilian risk, territory change;
- decisive modifiers: intel, preparation, unit strength, fortification, terrain/district, and major penalties;
- exposure summary: surviving units, weakened defense, retaliation risk, heat/tension change, and the next actionable threat;
- target coordinates and a stable timestamp/id.

Keep this separate from combat resolution so the existing formulas and AI behavior remain unchanged.

### 2. Add a short-lived hit sequence controller
Introduce a timestamp-gated FIFO or presentation queue so rapid AI/player hits do not overwrite one another. The controller should:
- sequence one hit at a time;
- support `skip` immediately;
- auto-advance after the brief spotlight;
- avoid replaying on React re-renders or turn-summary updates;
- collapse low-stakes repeated hits into a compact batch when several resolve in the same turn.

### 3. Upgrade the map impact layer
Extend the existing map effects instead of creating a separate combat renderer:
- target lock ring and short camera/viewport emphasis;
- success/failure-specific flash and particle choreography;
- stronger silhouettes for capo/HQ outcomes;
- directional impact lines or tracer-like motion that remains SVG/map-native;
- a restrained one-turn aftermath marker for recent violence, so the board communicates where defenses are weakened without adding permanent clutter.

Use semantic theme tokens and the existing family color system. Respect reduced-motion preferences.

### 4. Build the tactical result cut-in
Add a compact overlay anchored to the target area or a consistent edge-safe position. It should prioritize:
- outcome headline;
- concise `Why it worked` modifier stack, showing only the decisive factors;
- `Who is exposed` strip with surviving/retreated units, defense state, and retaliation risk;
- clear consequence delta for heat, tension, loyalty, territory, or money when relevant;
- Skip control with accessible labeling.

Avoid repeating the full turn report or covering the sidebars. Routine hits use a compact card; major hits use a more dramatic evidence-dossier treatment.

### 5. Layer the audio treatment
Use the existing sound system and channels:
- low pre-impact cue during target lock;
- distinct impact sound for success, failure, wound, and kill;
- short noir sting only for high-stakes outcomes;
- no overlapping duplicate file playback when a result is also emitted as a notification.

Keep audio independently skippable/mutable through the current sound settings and preserve the existing autoplay-safe behavior.

### 6. Connect major outcomes to existing reports
Keep the immediate cut-in focused and send full context to the existing Turn Summary and Just Happened systems:
- mark the most significant hit as the turn headline candidate;
- attach jump-to-hex/unit references to the event;
- group secondary combat outcomes instead of stacking multiple competing cards;
- ensure the post-turn report remains the complete audit trail.

## Technical boundaries
- Do not modify combat formulas, hit odds, AI decisions, action budgets, or turn sequencing.
- Reuse `lastCombatResult`, existing map effects, sound hooks, and notification/report data where possible.
- Preserve timestamp deduplication and add queue-level deduplication for batched results.
- Keep ordinary hits under approximately 1 second of active map motion; reserve 2–3 seconds for the spotlight and major outcomes.
- Test player hit success/failure, blind/scouted/planned hits, capo/HQ outcomes, AI hit bursts, skip behavior, reduced motion, and mobile-safe positioning.

## Acceptance criteria
- A hit is immediately understandable as a strategic outcome, not just a flash or toast.
- The player can identify at least one decisive reason for the result and who is now vulnerable.
- Major hits feel distinct from routine combat through pacing, map emphasis, audio, and dossier treatment.
- Skipping returns the player to a fully usable board without losing the result or report entry.
- Multiple hits resolve in readable order without dropped or duplicated cinematics.
- No new visual stack obscures the map, sidebars, phase rail, or action controls.