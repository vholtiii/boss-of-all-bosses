

# Make Family Power Button Distinct — Left Panel Placement

## Overview
Move the Family Power activation UI from the right panel's collapsible section to the **left panel** as a standalone, visually distinct block. It will sit between the phase guidance banner and the "Strategic Actions" collapsible, making it immediately discoverable.

## Changes — Single File: `src/components/GameSidePanels.tsx`

### 1. Remove Family Power from Right Panel
Cut the family power block (currently inside "Recruitment & Tactical" collapsible, ~lines 235-275) from the right-side content.

### 2. Add Family Power to Left Panel
Insert a new standalone block between the phase guidance banner (~line 123) and the "Strategic Actions" collapsible (~line 126). It will render only during the tactical phase.

### 3. Visual Distinction
- 4px left border in the player's family color
- Slightly elevated background (`bg-primary/10`) compared to surrounding sections
- "⚡ FAMILY POWER" small-caps header label
- Gradient-tinted activate button (family color based) instead of default styling
- Subtle border glow animation (`animate-pulse` on border opacity) when power is available
- Muted/dimmed styling when on cooldown or insufficient actions
- Cost and cooldown info shown as small badges below the button

## Result
The Family Power is always visible in the left panel during tactical phase — no collapsible hiding, distinct styling separates it from standard actions.

