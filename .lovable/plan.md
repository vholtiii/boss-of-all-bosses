

# Refine Capo & Boss Negotiations

Three improvements: clearer alerts for AI sitdowns, smoother execution UX, and Respect/Influence factored into Boss-level negotiation success.

---

## 1. Stronger Alerts When AI Sends Word

**Problem**: Incoming sitdowns appear as a small badge in the top bar that's easy to miss. No sound, no toast, no center-screen prompt.

**Changes** in `useEnhancedMafiaGameState.ts` (the `pushSitdown` block ~line 5623):
- Push a `pendingNotification` with type `info`, title `"📩 {Family} Wants to Talk"`, message describing the proposed deal + turns to respond
- Add a `combatLog` entry so it appears in the turn summary modal

**Changes** in `UltimateMafiaGame.tsx` top-bar incoming sitdown chips:
- Increase visibility: larger pill, gold pulsing border (currently muted primary), "📩 NEW" sparkle when first received
- Add turn-count warning color when `turnsLeft <= 1` (red pulse — about to expire and cost tension)

---

## 2. Clearer Execution UX for Both Capo & Boss Negotiations

**Capo Send Word ready-state**:
- When a `pendingNegotiation` flips from `pending` → `ready` at turn start, fire a notification: `"🤝 Sitdown Ready — {Family} territory at ({q},{r})"` with a "Locate" action that pans the map to the hex
- Add a top-bar pulsing chip mirroring the Incoming Sitdowns chip pattern but for outgoing-ready ones (currently only shown deeper in panels)

**Boss negotiation entry point**:
- Add a persistent "🏛️ Boss Diplomacy" button to the top bar (next to incoming sitdowns) that opens `NegotiationDialog` with `scope='family'`, letting players initiate ceasefires/alliances/supply deals without hunting through menus
- Disable + tooltip when `bossNegotiationCooldown > 0`

---

## 3. Respect & Influence Factor Into Boss Negotiation Success

**Current**: `getSuccessChance` in `NegotiationDialog.tsx` adds `floor(respect/5)` for ALL negotiations — but the variable is called `playerReputation`, and Influence is ignored entirely.

**New formula for `scope='family'` (Boss) negotiations**:
```
chance = baseSuccess
       + floor(respect / 4)        // up to +25 at cap
       + floor(influence / 5)      // up to +20 at cap
       + successBonus              // AI-requested sitdown bonus
       - treacheryDebuff          // -20 if active
```

For `scope='territory'` (Capo) negotiations, keep current behavior (capo personality + small respect contribution) — those are about the capo's local clout, not family reputation.

**Wire-up**:
- `NegotiationDialog` already receives `playerReputation`. Add a new `playerInfluence` prop
- Update `UltimateMafiaGame.tsx` to pass `gameState.resources.influence` (or equivalent field — verify exact name)
- Update the success chance breakdown shown to player: add a line `"⭐ +{x}% from Respect ({respect})"` and `"🏛️ +{y}% from Influence ({inf})"` for boss negotiations

---

## Files Touched

1. **`src/hooks/useEnhancedMafiaGameState.ts`** — toast/log on `pushSitdown`, ready-flip notification for outgoing pending negotiations
2. **`src/pages/UltimateMafiaGame.tsx`** — visual upgrade for incoming chips, new "Boss Diplomacy" top-bar button, pass `playerInfluence` prop
3. **`src/components/NegotiationDialog.tsx`** — accept `playerInfluence`, update boss-scope success formula, show influence/respect breakdown lines
4. **`src/components/GameGuide.tsx`** — note that Respect & Influence boost Boss negotiation success

