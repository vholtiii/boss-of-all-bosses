

# In-Game Quick Reference Guide + Downloadable PDF Cheat Sheet

## Overview
Replace the current basic tutorial dialog with a comprehensive, searchable **Quick Reference Panel** accessible anytime during gameplay, plus generate a **downloadable PDF cheat sheet** covering all mechanics.

---

## Part 1: In-Game Quick Reference Panel

### Design
- Replace the existing `TutorialSystem.tsx` with a new `GameGuide.tsx` component
- Opens as a full-height side sheet (not a small dialog) for better readability
- Organized by category with collapsible accordion sections
- Each section has a short, scannable summary with key numbers highlighted
- Searchable via a text filter at the top

### Categories & Content

| Section | Key Info Covered |
|---------|-----------------|
| **Turn Structure** | 3 steps: Deploy → Tactical → Action, skip buttons, action budgets |
| **Resources** | Money, Soldiers, Respect, Influence — what each does |
| **Territory** | Claiming, extorting, abandoning, Phase 3 influence erosion/expansion |
| **Combat** | Blind hits, scouted hits, planned hits, success rates, heat tiers |
| **Units** | Soldiers vs Capos, movement, toughness, loyalty, promotion |
| **Economy** | Business types, income calc, maintenance, legal construction, supply lines |
| **Diplomacy** | Ceasefires, alliances, Send Word, supply deals, tension/war |
| **Tactical Actions** | Scout, fortify, safehouse, escort, recruitment — 3-action budget |
| **Police & Heat** | 4 heat tiers, corruption bribes, prosecution risk |
| **Phases** | Phase 1-4 milestones, what unlocks at each |
| **Special Actions** | Hitman contracts, HQ assault, boss sitdown, family powers |
| **Victory** | Territory %, Commission Vote, elimination |

### UI Details
- Triggered from the existing Info button in the top bar (replaces tutorial)
- Uses `Sheet` component (slides in from right)
- `ScrollArea` for content, `Accordion` for sections
- `Input` field at top for filtering sections by keyword
- Each section uses icons, bold key numbers, and compact formatting
- Phase-specific tips highlighted with colored badges

### Technical Changes
- **New file**: `src/components/GameGuide.tsx` — full reference panel
- **Edit**: `src/pages/UltimateMafiaGame.tsx` — swap `TutorialSystem` import for `GameGuide`, update state/props
- **Remove**: Old `TutorialSystem.tsx` (or keep as legacy)

---

## Part 2: Downloadable PDF Cheat Sheet

### Design
- 4-6 page PDF with all mechanics summarized in a compact, printable format
- Dark theme matching the game's noir aesthetic
- Two-column layout for density
- Generated via a Python script using reportlab

### Content Structure
1. **Page 1**: Turn flow diagram, resource overview, phase milestones
2. **Page 2**: Territory actions (claim, extort, abandon) + Phase 3 influence rules
3. **Page 3**: Combat matrix (blind/scouted/planned hit success rates & heat)
4. **Page 4**: Economy (income, maintenance, supply lines, businesses)
5. **Page 5**: Units (soldier stats, capo promotion, loyalty, toughness)
6. **Page 6**: Diplomacy, police heat tiers, corruption, victory conditions

### Delivery
- Generated to `/mnt/documents/` as a downloadable artifact
- Also add a "Download Guide" button in the in-game reference panel

---

## Implementation Order
1. Build `GameGuide.tsx` in-game reference panel
2. Wire it into `UltimateMafiaGame.tsx`
3. Generate the PDF cheat sheet

