## Goal

Polish four UI surfaces: phase progression timeline, hex map hover/interaction, the on-map action menu, and the family-selection screen. All changes are visual/UX — no gameplay rule changes.

---

## 1) Phase Progression — Clearer & More Engaging
**File:** `src/components/PhaseInfographic.tsx`

- **Filled vs hollow icons for met requirements:** Replace the green-dot/`✓` pattern with a filled gold/green circle behind the icon when met, hollow ring when unmet. Animate the fill on transition (Framer `layoutId`).
- **Trend indicator on perf rows:** Track `current` value across renders via `useRef`; when it grew since last turn, show a tiny ▲ in green next to the number. No data plumbing required.
- **Earned-waiting countdown ring:** When `earnedWaiting`, replace the static pulse on the next-phase node with a gold SVG ring that visually drains over `turnFloor - turn` turns (CSS `stroke-dashoffset` keyed on `turn`).
- **Rival phase trend chips:** Compare current `cachedPhase` to a stored prior value; show ▲ if a rival just promoted (1-turn flash). Add a small icon (`Crown`) on the rival closest to the player's phase.
- **Hover tooltip** on each timeline node listing that phase's unlocks (use `HoverCard`).

---

## 2) Hex Map — Standardized Hover & Selection Feedback
**File:** `src/components/EnhancedMafiaHexGrid.tsx`

- **Standardize hover micro-card** (bottom-left panel, lines ~2146–2350): tighten to a 3-section template — Header (district + control %), Body (terrain/business/income), Footer (status badges: fortified, supply, erosion, pending negotiation). Replace inline emojis with Lucide icons for visual consistency.
- **Intel-staleness fade:** Hexes whose scout intel is older than the freshness window get a slight desaturation overlay; staleness shown as a small clock badge in the hover card footer.
- **Selected-unit movement preview:** When a unit is selected, render soft gold rings on hexes within their movement range (one ring layer per range step, fading outward). Already partially present for Capos — extend to soldiers and unify the styling.
- **Contested-hex dual pulse:** For hexes where two families have units (or where erosion is active), pulse two color rings alternating in the hex outline.
- **Thicker supply lines** + slightly more saturated when player-connected; muted grey when only rivals are using them. Tune in the existing supply-flow CSS.

---

## 3) Action Menu — Smarter Header & Inline Costs
**File:** `src/components/EnhancedMafiaHexGrid.tsx` (action-menu block, lines ~1700–1930)

- **Recommended Actions header:** Add a small caption above the existing button list ("Recommended:"), highlighting 1–3 buttons with a gold left-border based on simple heuristics:
  - Adjacent enemy soldier + scouted ⇒ Hit Territory
  - Friendly hex with extortable business ⇒ Extort
  - Empty/neutral hex inside player territory ⇒ Claim
  - Rival capo within range and tension low ⇒ Negotiate
  Heuristics live in a small helper inside the file; no state/store changes.
- **Inline cost previews on each button:** Append e.g. `· $2,000` / `· 1 action` chips so the player sees cost without hovering. Pulls from existing cost constants already imported (`FLIP_SOLDIER_BASE_COST`, etc.). Hit/Extort/Claim show the expected action cost.
- **Disabled actions show *why* prominently:** The `DisabledAction` reason text already exists but is tiny. Move it onto a single line, slightly larger, with a `lucide` lock icon to make it scannable.
- **Header polish:** Replace the plain `⚔️ X/Y Actions` line with a 3-segment mini-bar showing actions remaining as filled/empty pips, plus the phase badge.

---

## 4) Family Selection — More Atmospheric
**File:** `src/components/FamilySelectionScreen.tsx`

- **Ken-Burns pan on background:** Slow CSS scale+translate animation (~30s loop) on the `mafia-sitdown-bg.png` layer for cinematic motion. Keep vignette and noise overlays.
- **Title entrance:** Replace the plain fade with a typewriter-style reveal of "THE FIVE FAMILIES" plus a brief gold underline draw (SVG `pathLength`).
- **Smoke / cigar particles:** `AtmosphericParticles` already exists — add a denser drifting layer of warm-toned soft circles at the bottom of the viewport for a smoky-room feel. Extend the existing component with a `density="high"` prop or a sibling layer in the screen.
- **Family card flip-on-hover:** On hover, the front (crest + name + stats) gently rotates Y to reveal the motto + difficulty + power name (no full 180°, ~12° tilt with the back content overlaying via opacity). Uses Framer Motion `whileHover` and a back-face div positioned absolutely.
- **Selected-card spotlight:** When a family is picked, dim the others slightly more (opacity 0.55) and apply a faint family-color light cone (CSS radial-gradient) behind the selected card.
- **Difficulty named flavors:** Replace `🟢 Easy / 🟡 Normal / 🔴 Hard` with mafia-flavored names underneath:
  - Easy → "Made Man" — "+50% money, weaker AI"
  - Normal → "Wiseguy" — balanced
  - Hard → "The Don" — "-25% money, stronger AI"
  Keep the same selection state, just enrich labels and tooltips.
- **Audio sting on selection:** Tiny one-shot via existing `useSoundSystem` (gunshot/click) when a family is clicked.
- **Subtle 1955 NYC ambience strip:** Below the title, animate a slow scrolling typewriter line of period flavor text ("Five families. One throne. The Commission watches.").

---

## Technical Notes (not user-facing)

- All four targets are existing files; no new dependencies. Lucide icons, Framer Motion, Tailwind animations, and `HoverCard` are already in use.
- No changes to game state shape, hooks, or simulation code — purely presentational.
- Card-flip uses CSS `perspective` on parent + `rotateY` on child; back-face content positioned absolute with `backfaceVisibility: hidden` analog (since rotation is mild, simple opacity crossfade is enough).
- Movement-range rings reuse existing `getHexPosition`/range BFS helpers already in `EnhancedMafiaHexGrid.tsx`.
- Recommended-action heuristics are pure functions of the data already passed into `actionMenu` (booleans + tile + nearby units).

## Out of scope

- Resource delta animations, heat tier bar, rival threat meters, turn-summary refactor (other items from the earlier suggestion list — held for a follow-up batch).
- Any balance, AI, or rule changes.
