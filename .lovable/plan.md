

# Fix Family Selection Screen Discrepancies

## Summary
The family selection cards have 4 factual errors (wrong bonuses / misleading descriptions) and 2 soldier count mismatches versus the intended game balance. This plan corrects all of them.

## Changes

### File: `src/components/FamilySelectionScreen.tsx`

**1. Colombo bonuses (line 129)**
Change: `['+20% combat power', '-15% recruitment cost', '+15% fear generation']`
To: `['+20% income bonus', '-15% recruitment cost', '+15% fear generation']`

**2. Colombo description (line 121)**
Change: *"The wildcards. Aggressive and unpredictable with the strongest military force — but you burn through resources quickly."*
To: *"The scrappy survivors. Start with the least but fight the hardest for every dollar. Low resources force creative play — recruitment discounts and fear keep you in the game."*

**3. Genovese description (line 61)**
Change: *"The most secretive family. Expert infiltrators with unmatched intelligence networks. Hard to pin down and harder to defeat."*
To: *"The shadow empire. Masters of legitimate business fronts and money laundering. Their economic engine funds everything while staying hidden in plain sight."*

**4. Lucchese description (line 81)**
Change: *"The traders and smugglers. Control the supply chains and laundering operations. Excellent at turning dirty money clean."*
To: *"The silent killers. Superior intelligence networks and surgical precision make them deadly. Lower heat and higher hit rates let them strike without consequences."*

**5. Bonanno starting soldiers (line 115)**
Change: `soldiers: 3` to `soldiers: 2` — matches the guide and `familySoldierCount` default.

**6. Colombo starting soldiers (line 135)**
Change: `soldiers: 3` to `soldiers: 1` — matches the guide and `familySoldierCount` default. Reinforces "Hard" difficulty.

### File: `SOLDIER_RECRUITMENT_GUIDE.md`
Update the Starting Conditions money table to reflect the actual per-family amounts used in the cards (no longer $50K flat).

## What stays the same
- All `FAMILY_BONUSES` in `game-mechanics.ts` (the code bonuses are correct)
- Family power descriptions (all accurate)
- Trait stat bars (remain as-is — they represent relative identity, not literal bonus mapping)
- Starting money on cards (the varied amounts are better for balance than flat $50K)

## Result
Every card will accurately reflect what the player actually gets in-game. No more "combat power" listed for a family with 0% combat bonus.

