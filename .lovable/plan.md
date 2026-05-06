## Goal

Make the difficulty selector richer, more **informative**, and more **engaging** — currently three thin pills with hidden tooltips. Replace with three side-by-side themed cards that read like dossier entries.

## Current state

`src/components/FamilySelectionScreen.tsx` lines ~397–425. Three small flavored pills (Made Man / Wiseguy / The Don) with effect text hidden inside Radix Tooltip.

## New design

Three horizontal "dossier" cards. Each communicates the **vibe** (icon + flavor name + tagline + quote) AND the **mechanics** (4-stat row of concrete game effects). Inspired by board-game player-aid cards.

```
┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│ 🎩 MADE MAN              EASY   │  │ 🥃 WISEGUY            STANDARD  │  │ 🔫 THE DON               HARD   │
│ Learn the ropes                 │  │ A fair fight                    │  │ Earn your respect               │
│ "Welcome to the family, kid."   │  │ "No favors. No mercy."          │  │ "Only the strong survive."      │
│ ──────────────────────────────  │  │ ──────────────────────────────  │  │ ──────────────────────────────  │
│ 💰 Income      +50%             │  │ 💰 Income      Base             │  │ 💰 Income      −25%             │
│ ⚔️  AI Rivals   Hesitant         │  │ ⚔️  AI Rivals   Tactical         │  │ ⚔️  AI Rivals   Ruthless         │
│ 🚓 Police Heat Lenient          │  │ 🚓 Police Heat Standard         │  │ 🚓 Police Heat Aggressive       │
│ 🤝 Diplomacy   Forgiving        │  │ 🤝 Diplomacy   Cautious         │  │ 🤝 Diplomacy   Treacherous      │
└─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘
```

Per-tier content table:

| Tier               | Icon | Tagline             | Quote                          | Income | AI Rivals  | Police Heat | Diplomacy   |
|--------------------|------|---------------------|--------------------------------|--------|------------|-------------|-------------|
| Made Man (easy)    | 🎩   | Learn the ropes     | "Welcome to the family, kid."  | +50%   | Hesitant   | Lenient     | Forgiving   |
| Wiseguy (normal)   | 🥃   | A fair fight        | "No favors. No mercy."         | Base   | Tactical   | Standard    | Cautious    |
| The Don (hard)     | 🔫   | Earn your respect   | "Only the strong survive."     | −25%   | Ruthless   | Aggressive  | Treacherous |

Style:
- Row of 3 cards, `flex gap-3`, `max-w-4xl mx-auto mt-6`. Each card `flex-1 min-w-[220px] max-w-[280px]`, `text-left p-4 rounded-lg border-2`, `backdrop-blur-sm`, `relative overflow-hidden`.
- **Top row**: large emoji icon (`text-2xl`) + tier name in `font-playfair text-lg font-bold` + small uppercase chip on the right ("EASY" / "STANDARD" / "HARD") in the tier color.
- **Tagline**: `text-xs text-foreground/80 font-medium`.
- **Quote**: `text-[11px] italic text-muted-foreground` with a left thin colored bar (`border-l-2 pl-2`) in the tier color. Adds atmosphere.
- **Divider**: `border-t border-border/30 my-2`.
- **Stat rows**: 4 lines, each a flex row — small emoji + label on the left, value on the right in `font-bold`. `text-[11px]` with `py-0.5`. Values colored:
  - Buff value (e.g. +50%, Lenient, Forgiving) → emerald
  - Neutral (Base, Standard, Cautious, Tactical) → muted foreground
  - Debuff (−25%, Aggressive, Ruthless, Treacherous) → rose
- **Inactive state**: `border-border/40`, `bg-card/80`, slight desaturation (`opacity-80`).
- **Active state**:
  - `border-primary`, tinted background gradient in tier accent (emerald/amber/rose at ~10% alpha → transparent),
  - outer glow `box-shadow: 0 0 24px <tier-color-55>`,
  - emoji gets `drop-shadow` glow,
  - tiny "✓ SELECTED" ribbon in the top-right replacing the difficulty chip,
  - a faint diagonal noise/scratch overlay (`NOISE_BG`) for texture.
- **Motion (framer-motion)**:
  - `whileHover={{ y: -3 }}`, `whileTap={{ scale: 0.98 }}`, `transition duration: 200`.
  - On selection: emoji does a one-shot `scale: [1, 1.15, 1]` + `rotate: [0, -5, 5, 0]` flourish (~400ms).
  - Active card emoji has a continuous slow `filter: drop-shadow` pulse (1.6s loop) in the tier color, mirroring the family-card crest pulse.
- **A11y**: `role="radio"` group with `role="radiogroup"` wrapper, `aria-checked`, `aria-label="Difficulty: Made Man — Learn the ropes"`. Keyboard: ArrowLeft/ArrowRight cycles, Enter/Space activates.
- **Audio**: keep `playSound('click')` on selection. Add `playSound('success')` when picking The Don (commits-to-the-bit cue).

Replaces the current Tooltip pattern entirely (info is now on-card). Remove `Tooltip`/`TooltipTrigger`/`TooltipContent` imports if they aren't used elsewhere on this screen — check first; leave intact if they are.

Out of scope: gameplay balance numbers, map-size or seed controls, family cards, BEGIN button.

## File

- `src/components/FamilySelectionScreen.tsx` — single edit, lines ~397–425, plus a small handler for keyboard radiogroup navigation.
