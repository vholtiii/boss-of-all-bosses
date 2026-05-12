## Change

In `src/components/FamilySelectionScreen.tsx`, swap the `icon` and `name` fields between the `easy` and `normal` entries of the difficulty meta object (~lines 435–458):

- `easy`: `icon: '🥃'`, `name: 'Wiseguy'`
- `normal`: `icon: '🎩'`, `name: 'Made Man'`

Everything else stays the same: chips remain `EASY` / `STANDARD`, taglines/quotes/colors/stats/tone all stay attached to their tier, and the underlying difficulty keys (`easy` / `normal` / `hard`) and gameplay modifiers are unchanged.

No other files need editing.