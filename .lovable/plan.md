# UX Refinement Pass — Information Clarity

Goal: cut clutter and ambiguity across the four touched surfaces. No new gameplay; every change is presentation, hierarchy, or copy. Each item lists the exact friction it removes.

## 1. Onboarding / Family Selection

- **Sticky confirmation bar.** The "Start as [Family]" CTA + seed + map size collapse into a thin bar pinned to the bottom of the viewport so the user always sees the full commitment without scrolling. Removes the disconnect between picking a family at the top and confirming at the bottom.
- **Stat normalization on family cards.** Today each family card mixes labels ($, soldiers, loyalty, racketeering, ability). Group into 3 fixed rows: *Resources*, *Strengths*, *Signature Power*. Same row order on every card so eyes can compare across columns.
- **Recommended badge demoted.** Replace the green "RECOMMENDED" highlight on Easy/Wiseguy with a small "👋 New player?" hint pinned to the difficulty selector instead — it shouldn't bias family choice.
- **Map seed row collapsed by default** behind a "⚙ Advanced" disclosure. Most players never touch it; hiding it removes 1 row of visual weight.
- **Difficulty + map size labeled section header.** Add a small "STEP 1 · CHOOSE YOUR GAME" → "STEP 2 · CHOOSE YOUR FAMILY" rhythm so the page reads top-to-bottom.

## 2. In-game HUD & sidebars

- **Top status HUD: one-line resource strip.** Money / Soldiers / Respect / Influence / Heat get equal-width slots with: big number, tiny delta-this-turn under it (`+$420`, `-2`). Removes the need to open the turn summary to know if your last turn made or lost money.
- **Phase chip absorbs the phase banner.** Today phase info lives in two places (banner + top chip). Drop the banner; the chip in the HUD becomes the single source ("PHASE 2 · ACTION · 2/3 used") with click-to-expand requirements list.
- **Left action menu: collapse-by-default with badges.** Each section header shows the count of available actions ("Tactical · 3", "Strategic · 1 new"). Expanded section auto-collapses others. Reduces vertical noise from always-open accordions.
- **Right sidebar rival cards: comparable bars.** Each rival shows Territory / Soldiers / Heat as 3 thin progress bars normalized to the leader, not raw numbers. At-a-glance "who's ahead" without math.
- **Sitdowns panel: state-grouped, not flat list.** Headers `⏳ Awaiting you (2)` / `✓ Ready (1)` / `📨 Incoming (1)` with a single primary action per item.
- **Boss/HQ panel: split tabs.** Today the panel mixes loyalty, businesses, supply, recruitment. Tab it into *Roster · Businesses · Supply* so each view fits the panel without scrolling.

## 3. Map interaction

- **Bottom-left hex card is the single source of hex truth.** Today some info lives on hover tooltip, some in the card, some on the action menu. Move all per-hex info (owner, business, units, fortify, safehouse, supply status, district control %) into the pinned card; hover gives only owner + business name.
- **Selected-unit dock above the hex card.** When a unit is selected, a small dock shows portrait, name, toughness, loyalty, move budget left, and a strip of legal actions for this turn. Eliminates hunting for action buttons inside the action menu when a unit is selected.
- **Legend becomes one collapsible hex.** A single corner button "❓ Legend" opens an overlay panel grouping outlines, badges, and supply icons in 3 columns with short captions. Replaces the always-visible legend strip.
- **Highlight rules simplified.** Movement = solid amber ring, attack range = dashed rose ring, supply = dotted grey ring. Document in the new legend.
- **Zoom % indicator + 1-click reset** near the zoom button so players know they're zoomed in and can snap back.

## 4. Turn flow, modals & feedback

- **Turn step indicator in HUD.** `DEPLOY ▸ TACTICAL ▸ ACTION ▸ END` with the current step lit and click-to-skip on completed prior steps. Replaces scattered "skip" buttons.
- **End-of-turn summary modal restructure.** Three tabs: *Money & Heat* (delta breakdown), *Combat* (log), *Diplomacy & Events* (sitdowns, random events). Today everything is one long scroll.
- **Inline confirmations replace modals for routine actions.** Claim, extort, fortify, scout: confirm via a 2-button popover anchored to the hex menu instead of a full modal. Modals stay for destructive/irreversible actions (Plan Hit, HQ Assault, Declare War, Abandon Territory).
- **Risk preview standardization.** Every action with risk shows the same 4-line block: *Cost · Success odds · Heat · Tension*. Replaces today's mix of paragraphs and stat lists per action.
- **Notification toast grouping.** Multiple same-turn notifications of the same type collapse ("3 territories shifted") with click-to-expand. Stops the post-AI-turn toast flood.
- **Wounded / low-loyalty units surface a persistent badge** in the right sidebar "Roster" tab so users don't lose track between turns.

## Out of scope

- Gameplay rules, balance, AI behavior — none changed.
- New mechanics or screens.
- Audio, art, animation overhauls beyond what naturally falls out of layout changes.

## Suggested order (each ships independently)

1. Turn step indicator + inline confirmations (biggest friction win, low risk)
2. Top resource strip with deltas + phase chip merge
3. Bottom-left hex card consolidation + unit dock
4. Right sidebar grouping (sitdowns, rivals, roster tabs)
5. Family selection sticky bar + section steps
6. End-of-turn modal tabs + notification grouping
7. Legend overlay + highlight rule pass

Tell me which slice to ship first — or whether you want me to bundle 1-3 as one "in-game clarity" PR.
