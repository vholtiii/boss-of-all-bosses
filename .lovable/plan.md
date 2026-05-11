## Goal
Every Capo — starting Capos, player-promoted, AI-promoted, Persico-anointed, and jail-released — gets a realistic Italian-American name with a nickname in quotes (e.g., `Anthony "Marbles" Solerna`).

## Approach

### 1. New name generator utility
Create `src/lib/capo-names.ts`:
- Three pools: `firstNames` (~40 entries: Anthony, Vincent, Salvatore, Carmine, Dominic, Pasquale, Rocco, Gennaro, Giuseppe, Nicholas, Frank, Michael, Joseph, Sal, Tony, Angelo, Vito, Aniello, Nunzio, Silvio, Rudy, Paulie, Benny, Jimmy, Johnny, Eddie, Lou, Ralph, Tommy, Richie, Bobby, Larry, Phil, Gus, Sonny, Albert, Vinnie, Mickey, Joey, Petey…)
- `nicknames` (~60 entries: Marbles, The Chin, Big Pussy, Fat Tony, The Ant, Ice Pick, Three Fingers, The Snake, Sally Boy, Tough Tony, The Saint, Bones, Knuckles, Pretty Boy, The Hat, The Nose, Quack-Quack, Joe Bananas, The Bull, Lefty, Cigars, The Beast, Tiny, The Weasel, Curly, The Chief, Buckles, Cheech, The Wig, Meatball, Specs, The Whale, Don Cheech, Half-Nose, The Owl, Skinny, Junior, The Mooch, Vinny Gorgeous, Crazy Joe…)
- `lastNames` (~40 entries: Solerna, Gambino, Castellano, Gigante, Bonanno, Persico, Lucchese, Gravano, Aiello, Riina, Provenzano, Genovese, Magaddino, Anastasia, Galante, Gotti, Profaci, Massino, Casso, Amuso, Corallo, Salerno, Ruggiero, DeCavalcante, Scarpa, Burke, Vario, Cirillo, Ianniello, Lombardozzi, Tieri, Pagano, Migliore, Indelicato, Napolitano, Coppola, Marangello, Trafficante…)
- Export `generateCapoName(): string` returning `` `${first} "${nick}" ${last}` ``
- Use `usedNames` Set to avoid dupes within a single game session (passed in optionally) — simplest version just picks randomly each call; collisions are rare and cosmetic.

### 2. Wire it into every Capo creation site in `src/hooks/useEnhancedMafiaGameState.ts`

Replace these existing name strings with `generateCapoName()`:

| Line | Context | Current |
|------|---------|---------|
| 1056-1059 | Starting Capos (one per family at game init) | hardcoded `capoNames` map |
| 3483 | Player promotion (pendingPromotion → capo) | `Capo ${randInt}` |
| 4263 | Capo released from jail back to HQ | `Capo` |
| 6374 | AI promotes a soldier to Capo | `${fam} Capo` |
| 6394 | AI force-promotion fallback | `${fam} Capo` |
| 7900 | Colombo "Persico Succession" power | `Capo ${randInt} (Persico)` |

For the jail-release case (4263), reuse the unit's existing `name` if it already had one (it should, since it was a Capo before arrest); only generate a new name if missing.

### 3. Notifications
Notification messages already interpolate the `capoName` variable (e.g. line 3488, 7921), so they automatically pick up the new format — no extra changes.

## Out of scope
- Soldier names (only Capos requested).
- Persisted save migrations: existing saved Capos keep their old names; only newly created/promoted Capos get the new format.

## Files
- New: `src/lib/capo-names.ts`
- Edited: `src/hooks/useEnhancedMafiaGameState.ts` (6 small replacements)
