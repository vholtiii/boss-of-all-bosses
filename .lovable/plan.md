# Push Out — Hit empty rival territories

A new dedicated action for striking rival hexes that have no business on them. Distinct from Hit (heavy combat, business hexes) and Sabotage (business destruction). Push Out is a lower-heat, faster way to roll back a rival's empty footprint and gain a small respect/fear bump.

## When it appears

Push Out shows up on the hex action menu (and in the EnemyHexActionDialog when entering an empty rival hex) only when ALL of these are true:

- Target hex belongs to a rival family (not neutral, not player, not an HQ).
- Target hex has no business (built or extorted). Hexes with a business stay on the Hit / Sabotage path.
- Selected unit is a Soldier or Capo of the player's family, and adjacent to or on the target hex.
- Action phase, player has ≥ 1 action remaining.
- No ceasefire / alliance / safe-passage protecting that family (same gating as Hit).

If the hex has a business, Push Out is hidden and the normal Hit / Sabotage menu is shown unchanged.

## What it does

Push Out is a single-action territory shove. Behavior depends on whether the hex is defended and whether the player has scouted it.

```text
Empty rival hex, no defenders (scouted OR unscouted)
  -> Auto-success, hex flips to NEUTRAL (player still claims next turn,
     same convention as a successful Hit). +small respect, +small fear,
     +rival relationship hit, low heat (+2). No civilian-casualty path —
     the hex is rival-claimed turf, not innocent ground.

Empty rival hex WITH defenders, SCOUTED
  -> Player sees defender count in the dialog before committing.
     Light combat roll using Push Out modifiers (see Numbers).
     +5% scout intel bonus (fresh) or +2% (stale) on top of base.
     Success: defenders routed (soldiers killed, capos wounded per
     normal Hit rules), hex -> NEUTRAL, +respect/+fear, tension hit,
     moderate heat (+4). Outnumbered win still grants Bold Strike +2.
     Failure: attacker bounces back to origin hex (movesRemaining +1),
     no spoils, +2 heat, no unit loss.

Empty rival hex WITH defenders, UNSCOUTED
  -> Dialog warns "Unknown defenders — proceed at risk". Player can
     still commit. Combat roll uses base Push Out math with NO scout
     bonus (but also no blind-hit penalty — unlike Hit, Push Out
     never triggers the civilian branch because the hex is
     rival-owned and business-less).
     Success: same as scouted-success branch above.
     Failure: same bounce-back, plus the initiating soldier gains
     the "suspicious" flag for 1 turn (botched op draws police
     attention to that unit) and heat is +3 instead of +2 to
     reflect the messier operation.
```

Capo defenders follow the existing Hit rule: a Push Out victory wounds enemy capos (2-turn debuff) rather than killing them. Plan Hit / Hitman remain the only ways to kill capos outright.

## Numbers (first pass, tuneable)

- Action cost: 1 action.
- Heat: +2 if uncontested, +4 on combat win, +2 on combat loss (scouted) / +3 on combat loss (unscouted). (Hit is +10–25 today.)
- Respect: +2 on success.
- Fear: +2 on the targeted family.
- Relationship / tension: same magnitude as a normal territory hit on that family — this is still aggression.
- Combat (defended case):
  - Base success = same `0.5 + (attackers - defenders) * 0.15` formula as Hit.
  - +5% Push Out modifier (it's a softer target than a defended business hex).
  - Fortify / safehouse defense bonuses still apply.
  - No scout bonus required, no blind-hit penalty.
- Bold-move respect: Outnumbered Push Out victory still grants the existing Bold Strike +2.
- Cannot Push Out an enemy HQ hex (those use HQ Assault, Phase 4).

## UX

- Hex action menu: when canPushOut is true and canHit would have been the only enemy option, show "👊 Push Out" instead of "⚔️ Hit". Tooltip: "Shove a rival off an empty hex. Low heat, no civilian risk."
- EnemyHexActionDialog (entering an empty rival hex in Phase 2+): the "Hit Territory" button is replaced by "Push Out" with the same visual weight; Sabotage is hidden (no business); Retreat stays.
- Action chip cost: 1 ⚔.
- On success, the existing combat-flash + floating-text feedback fires with a `push_out` variant ("PUSHED OUT").
- Turn summary: new line entry "Pushed Out — {District}".

## Phase gating

- Available from Phase 2 (same gate as today's enemy-hex entry dialog).
- Phase 3+ does NOT lock Push Out — manual claim is still locked at Phase 3, but combat-style actions remain enabled, matching how Hit behaves today.

## Technical section

Files to touch:

- `src/hooks/useEnhancedMafiaGameState.ts`
  - New action type `push_out_territory` registered in `actionPhaseActions`.
  - New `processPushOutTerritory(state, action)`:
    - Validates rival ownership, no business, no HQ, ceasefire/alliance/safe-passage checks (lift from `processTerritoryHit`).
    - Branches on `enemyUnits.length === 0`:
      - Zero defenders: skip combat, mark tile `controllingFamily = 'neutral'`, drop pendingClaim, run tension/relationship/heat/respect/fear deltas, push success notification.
      - With defenders: reuse the combat-resolution block from `processTerritoryHit` with `_isPushOut = true` to skip civilian-risk + plan-hit branches and use Push Out modifiers.
    - Calls `checkSupplySabotage` on success (a rival node may have been there).
    - Removes any fortification on the captured hex.
  - `resolveEnemyHexAction` gains a `'push_out'` action that calls the new processor, mirroring the `'hit'` branch.
- `src/components/EnemyHexActionDialog.tsx`
  - Add `canPushOut` derived from `!targetInfo.hasBusiness && !isHQ`.
  - When `canPushOut`, render the "Push Out" button in place of "Hit Territory". Hide Sabotage (no business). Plan Hit execute branch stays untouched.
- `src/components/EnhancedMafiaHexGrid.tsx`
  - Add `canPushOut = isEnemy && !tile.business && !tile.isHeadquarters && (isSoldier || isCapo)` and a matching disabled-reason entry.
  - Render a "👊 Push Out" button in the action menu, mutually exclusive with "Hit" (Hit is only shown when the hex has a business or defenders justify a heavier action — or always show both? See open question below).
  - Wire its onClick to `onAction({ type: 'push_out_territory', targetQ, targetR, targetS, selectedUnitId })`.
- `src/pages/UltimateMafiaGame.tsx`
  - Add a `'push_out'` case to the enemy-hex-dialog dispatcher that calls `resolveEnemyHexAction('push_out')`.
- `src/hooks/__tests__/push-out.test.ts` (new)
  - Empty rival hex, no defenders -> hex becomes neutral, +respect, +fear, action consumed, low heat.
  - Empty rival hex with defenders -> combat path; success neutralizes, failure bounces attacker.
  - Push Out on a business hex is rejected (action menu/dispatcher both block it).
  - Push Out on HQ is rejected.
  - Push Out respects ceasefire/alliance/safe-passage (no-op + warning).

Memory updates (after build): add `mem://gameplay/combat-mechanics/push-out` describing the rule, and reference it in `mem://index.md` under Memories.

## Open question worth flagging

When the target rival hex has defenders but still no business, should Push Out coexist with Hit (player picks the flavor), or should Push Out fully replace Hit for business-less hexes? The plan above assumes "Push Out replaces Hit on no-business hexes" — simplest UX, one obvious choice per hex. We can revisit during implementation if you'd rather keep both available.

## Out of scope

- No AI usage of Push Out in this pass. AI keeps using Hit; we can add AI Push Out behavior in a follow-up once the player-facing mechanic is tuned.
- No new bold-move respect category — uses existing Bold Strike when outnumbered.
- No changes to Hit, Sabotage, Plan Hit, or HQ Assault.
