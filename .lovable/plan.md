

# Revisit Genovese Starting Respect

You're right to push back. Let me make the case both ways, then recommend.

## Why Genovese is currently low (10)

The original logic was "Genovese = shadow empire, hidden boss, low public profile → low *respect* (public reputation)." Treating respect as **fame/notoriety**, a family that hides its boss and operates in shadows would naturally be less famous.

## Why that's actually wrong

In this game, **respect is not fame — it's underworld credibility and fear**. Look at how it's used:
- Gates diplomacy leverage (sitdowns, pacts).
- Influences AI willingness to back down.
- Feeds into the Commission Vote victory path.
- Combat spikes grant respect (you earn it by being feared, not famous).

By that definition, the **historical Genovese family was the most respected of the Five Families** — called "the Ivy League of organized crime," the most powerful and feared, precisely *because* of their discipline and secrecy. Other bosses deferred to them. That's high respect, not low.

Lucchese fits the "quiet/low-profile" identity better — surgical, under-the-radar, not seeking the spotlight.

## Recommended new ladder

| Family   | Respect | Rationale |
|----------|---------|-----------|
| Bonanno  | 25      | Proud, "respect must be earned" — outwardly demands it |
| **Genovese** | **25**  | Ivy League of the mob, most feared, deferred to by other bosses |
| Gambino  | 20      | Powerful, public, target on back |
| Colombo  | 15      | Scrappy underdog, still proving themselves |
| Lucchese | 15      | Quiet, surgical, low-profile by design |

Genovese 10 → **25**. Ties Bonanno at the top, which is thematically correct: Bonanno *demands* respect, Genovese *commands* it. Two different flavors of "highly respected."

Phase 1 dampener (×0.5 passive) still applies, so the early-game pacing intent is preserved — just from a higher floor for Genovese.

## Files Touched

- `src/components/FamilySelectionScreen.tsx` — Genovese `respect: 10` → `respect: 25`.
- `mem://gameplay/starting-balance` — update Genovese entry and rationale.

## Verification

- Pick Genovese → HUD shows **25%** respect at Turn 1.
- All other families unchanged (Gambino 20, Lucchese 15, Bonanno 25, Colombo 15).
- AI Genovese opponents unchanged (still roll 15–24 random).
- Phase 1 ×0.5 passive multiplier still applies.

## What Doesn't Change

- AI starting respect, other families' starting respect, Phase 1 dampener, combat spikes, claim rewards, Genovese family bonuses/powers.

