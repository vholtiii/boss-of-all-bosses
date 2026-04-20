

# Alerts System Overhaul — Coverage + Persistent Alerts Log (Revised Retention)

Two parts: (1) a new persistent **Alerts Log** menu that captures every alert, and (2) filling **coverage gaps** for important gameplay events that currently fire silently.

---

## Part 1 — Alerts Log

### What you get
A new top-bar bell icon (next to the Sound/Settings gear) with an unread-count badge. Clicking it opens a dropdown panel listing recent alerts from the current game session, grouped by turn (newest first).

```
🔔 Alerts (3 new)
─────────────────
▼ Turn 14 (current)
  🟥 War declared by Genovese        2m ago  [Pan to HQ]
  🟧 Supply line to Docks severed    just now [View]
  🟦 Phase 3 reached                  just now
▼ Turn 13
  🟩 Capo Bruno promoted             — 
  🟧 Soldier loyalty critical (32)   — [Pan to unit]
─────────────────
[Filter ▾ All | Critical | Combat | Diplomacy | Economy]
```

### Behavior
- **Source of truth**: every `pendingNotifications` push is also appended to a new `alertsLog` array on game state (each entry: `{ id, turn, type, category, title, message, hexRef?, unitRef?, read, timestamp }`).
- **Per-turn grouping**: collapsible turn sections. Current turn auto-expanded; previous turn collapsed.
- **Unread tracking**: opening the log marks visible items as read. Bell badge shows count of unread `error`/`warning` alerts only.
- **Categories**: Combat, Diplomacy, Economy, Territory, Intel, Phase, System — derived at emission time from a new `category` field.
- **Click-to-pan**: alerts referencing a hex/unit get a "Pan to" action (reuses existing `selectUnit` callback).
- **Filter chips**: All / Critical (errors+warnings) / each category.
- **Retention**: **alerts persist for 2 turns after the turn they were emitted, then auto-expire from the log.** At the start of each turn, prune entries older than `currentTurn - 2`. Critical unread alerts (errors/warnings) get a 1-turn grace extension so they aren't pruned the same turn the player might first see them.
- **Persists in saves**: the (pruned) log is included in `useGameSaveLoad` payload so reloading mid-game keeps the recent window.
- **Toasts unchanged**: existing transient toasts still fire. The log is *additional* — a 2-turn rolling record so missed toasts can be reviewed before they age out.

---

## Part 2 — Coverage Gaps to Fill

Audit found these important events currently fire **no alert** (or only push to the silent `combatLog`). Adding emissions for:

### Phase & Progression
- 🆙 **Phase advancement** (1→2, 2→3, 3→4) summarizing what just unlocked.
- 👑 **Commission Vote called by an AI**.

### Combat & Threats
- 🎯 **Rival declares war on you** (AI-initiated).
- 🔪 **Hitman contract resolved against you** (success or failure).
- 💣 **Bounty placed on your family** by a rival.
- 🏚️ **Your safehouse captured / destroyed**.
- 💀 **Your capo wounded** (promote from combatLog to alert).
- 💚 **Your capo recovered** from wounds.

### Diplomacy
- ⏳ **Ceasefire / alliance / safe-passage expiring next turn** (fires once at exactly 1 turn left).
- 🤝 **AI accepts/rejects your sitdown** (verify — emit if missing).
- 📜 **Pact signed/broken by AI**.

### Territory (Phase 3+)
- 🌊 **A player hex flipped to neutral via erosion** (the actual flip).
- 📈 **A neutral hex expanded into rival control adjacent to you**.
- 🏆 **Reached 60% district control** / **lost 60% district control**.

### Economy & Heat
- 💸 **Supply line severed** (your business affected).
- 🚨 **Heat tier crossed upward** (Tier 1→2, 2→3, 3→4).
- ⏱️ **RICO timer tick** (each turn at 90+ heat: "RICO 2/5").
- 💰 **Bankruptcy warning** (cash + projected income < 0 next turn).

### Loyalty & Internal
- ⚠️ **Soldier loyalty crosses below 40** (first time only).
- 🐀 **Rat suspected** (promote existing espionage events to alerts).

### Intel
- 🕵️ **Bribe / intel source expired**.
- 👁️ **Scout intel on a critical target went stale** (rival capo you had eyes on).

Each gap is a one-line `pendingNotifications.push({...})` at the existing event site, plus the new `category` tag. No mechanic changes.

---

## Files Touched

1. **`src/types/game-mechanics.ts`** — extend pending notification type with optional `category`, `hexRef`, `unitRef`, `id`.
2. **`src/hooks/useEnhancedMafiaGameState.ts`** — add `alertsLog` to state; append on every notification push; add ~20 new emission sites; **prune entries older than 2 turns at turn start** (with 1-turn grace for unread critical alerts); clear log on new game.
3. **`src/pages/UltimateMafiaGame.tsx`** — render new `<AlertsLogButton />` in top bar; pass `selectUnit` for click-to-pan.
4. **`src/components/AlertsLogPanel.tsx`** *(new)* — bell button + dropdown popover with grouped/filterable list, unread tracking, click-to-pan rows. Reuses ThreatBoard row visual language.
5. **`src/hooks/useGameSaveLoad.ts`** — include pruned `alertsLog` in save/load payload.

No new dependencies.

