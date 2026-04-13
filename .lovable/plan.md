

# Add Family Power Info to Detail Panel

## Overview
Add a "Family Power" section to the detail panel that appears when a family is selected. Cards remain unchanged.

## What Changes

**`src/components/FamilySelectionScreen.tsx`** — single file change:

1. **Extend `FamilyInfo` interface** with `powerName`, `powerLore`, `powerEffect`, `powerCost`, and `powerCooldown` fields.

2. **Add power data to each family object**:
   - **Gambino** — "The Dellacroce Network" | *Underboss Aniello Dellacroce ran an unrivaled intelligence network through enforcers like Roy DeMeo's "Murder Machine" crew — their eyes and ears stretched further than any rival family.* | Scout target hex + all 6 adjacent hexes | 2 Tactical | 3 turns
   - **Genovese** — "The Front Boss" | *Vincent "The Chin" Gigante feigned insanity in a bathrobe for 30 years, hiding the family's true operations in plain sight while the FBI chased shadows.* | Hide hex as neutral 3 turns; unscoutable, -30% hit/sabotage, zero heat | 1 Tactical | 2 turns
   - **Lucchese** — "Garment District Shakedown" | *For decades the Lucchese family strangled NYC's Garment District, extracting tribute from every manufacturer on Seventh Avenue.* | +50% district income, extract $1k/hex rival tribute | 1 Tactical | 3 turns
   - **Bonanno** — "The Donnie Brasco Purge" | *After FBI agent Joe Pistone infiltrated the family as "Donnie Brasco," the Bonannos launched a brutal internal purge of suspected informants.* | Remove soldiers <50 loyalty; survivors +15 loyalty, 2-turn flip immunity | 1 Tactical | 4 turns
   - **Colombo** — "The Persico Succession" | *When Joe Colombo was shot at the 1971 Unity Day Rally, Carmine Persico seized control and reorganized — a pattern repeated through decades of assassinations and internal wars.* | Instant soldier-to-capo promotion when a capo dies | 1 Tactical | Once per game

3. **Insert a new section in the detail panel** between the description paragraph (line ~458) and the bonuses/resources grid (line ~460). It will display:
   - A header: "⚡ FAMILY POWER" in the family's accent color
   - Power name as a bold subtitle
   - Historical lore in italic muted text
   - Effect description in normal text
   - Cost and cooldown as small badges (e.g., "2 Tactical Actions" / "Cooldown: 3 turns" or "Once per game")

The section will be styled with a subtle border-left in the family color and slightly darker background to visually separate it from the rest of the panel.

