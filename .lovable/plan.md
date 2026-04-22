

# Dock HQ Info Panel to Left Side — With Scroll + Collapsible Sections

Move the Headquarters info panel from its floating top-right position to a fixed left-side dock between the map controls and the Legend button. Make it fully scrollable and convert long content blocks into collapsible dropdown sections to economize space.

## Placement

- Fixed to the left edge: `left-4`, `top-52` (clears zoom + Units + Supply Lines toggles), `bottom-12` (clears Legend button), `w-96`, `z-40`.
- Slide-in animation flipped to enter from the left (`x: -80`).
- Dragging removed (panel is docked). Click-outside-to-close preserved.

## Scroll Behavior

- Outer wrapper: `overflow-hidden` with `h-full` so it fills the docked vertical slot exactly.
- Inner `<Card>` uses a flex column: fixed header + `flex-1 overflow-y-auto` content region.
- Custom thin scrollbar styling consistent with the rest of the app.
- Long content (financial breakdown, full unit roster, business list) scrolls inside the panel — never pushes the layout.

## Collapsible Sections (space economy)

Each major content block becomes a `<Collapsible>` (using existing `src/components/ui/collapsible.tsx`) with a clickable header showing a chevron + summary chip. Default open/closed states tuned for at-a-glance use:

| Section | Default | Header summary chip |
|---|---|---|
| Financial Overview | **Open** | net profit (e.g. "+$4,200/turn") |
| Unit Status | **Open** | "5 soldiers · 2 capos" |
| Boss Overview (businesses + loyalty) | Collapsed | "12 businesses · 8 loyal" |
| Threats & Intel | Collapsed | unread threat count badge |
| Strategic Actions (Sitdown / Mattresses / War Summit / Purge) | Collapsed | "4 actions" |
| Diplomacy Status (pacts, cooldowns) | Collapsed | active pact count |

Multiple sections can be expanded simultaneously (matches existing right-sidebar action menu pattern). Open/closed state is local component state (resets when panel closes).

For the rival HQ variant, the same docked slot is used with a reduced section set (Intel summary open, others collapsed).

## Files Touched

1. **`src/components/HeadquartersInfoPanel.tsx`**
   - Replace floating/draggable wrapper with docked classes: `fixed left-4 top-52 bottom-12 z-40 w-96 overflow-hidden`.
   - Strip `drag`, `dragMomentum`, `dragConstraints`, `onDragStart`, `onDragEnd`, `whileDrag`, `cursor: grab`, and the `isDraggingRef` guard in click-outside handler.
   - Flip enter/exit animation to `x: -80 → 0 → -80`.
   - Convert inner card to flex column: header (fixed) + scrollable content region (`flex-1 overflow-y-auto pr-1`).
   - Wrap each major content block in `<Collapsible>` with a header row (title + summary chip + chevron). Use `lucide-react` `ChevronDown` rotating on open.
   - Local `useState` map for section open states with the defaults above.

2. **Memory** — update `mem://ui/hq-panel-interaction` to reflect: docked left between controls and Legend, no longer draggable, internal scroll, collapsible subsections.

## What Doesn't Change

- All existing HQ panel content, props, and parent wiring.
- Map controls, Legend, and right sidebar.
- Click-outside dismissal logic (minus the drag guard).

