

# Revisit Starting Influence + Add Starting Balance Test

## Part 1 — Rebalance starting Influence

Current per-family Influence values feel arbitrary and don't strongly map to family identity. Influence gates diplomacy (sitdowns, pacts, Commission Vote progress) and feeds passive territory expansion in Phase 3+. Families with political/economic dominance should start higher; scrappy/military families lower.

### Current vs Proposed

| Family   | Current | Proposed | Rationale |
|----------|---------|----------|-----------|
| Gambino  | 15      | **20**   | Most politically connected, "controls the money" — should lead in influence |
| Genovese | 10      | **15**   | Hidden empire with deep front-business reach — moderate influence |
| Lucchese | 12      | **12**   | Unchanged — quiet, surgical, mid-tier political reach |
| Bonanno  | 8       | **8**    | Unchanged — old guard, insular, weakest political network (matches identity) |
| Colombo  | 18      | **10**   | Currently highest, but lore says "scrappy survivors with the least" — 18 contradicts identity. Drop to 10. |

**New ladder**: Gambino 20 > Genovese 15 > Lucchese 12 > Colombo 10 > Bonanno 8.

This makes Influence reflect political/economic clout (Gambino top, Bonanno bottom) and fixes the Colombo inconsistency where the "scrappy underdog" had the highest influence in the game.

## Part 2 — Add starting balance test

Add a Vitest unit test that locks in the per-family starting resources so future edits can't silently regress the carefully-tuned values.

### Test setup (project has none yet)

- Add `vitest`, `@testing-library/jest-dom`, `@testing-library/react`, `jsdom` to `package.json` devDependencies.
- Create `vitest.config.ts` (jsdom env, `@` alias, setup file).
- Create `src/test/setup.ts` (jest-dom + matchMedia stub).
- Add `"vitest/globals"` to `tsconfig.app.json` types.

### The test itself

`src/components/__tests__/FamilySelectionScreen.starting-balance.test.tsx` — imports the `FAMILIES` array and asserts each family's full `startingResources` object matches a frozen expected snapshot:

```ts
const EXPECTED = {
  gambino:  { money: 60000, soldiers: 4, influence: 20, politicalPower: 40, respect: 20 },
  genovese: { money: 45000, soldiers: 4, influence: 15, politicalPower: 25, respect: 25 },
  lucchese: { money: 70000, soldiers: 3, influence: 12, politicalPower: 20, respect: 10 },
  bonanno:  { money: 40000, soldiers: 2, influence: 8,  politicalPower: 15, respect: 25 },
  colombo:  { money: 35000, soldiers: 1, influence: 10, politicalPower: 10, respect: 15 },
};
```

Test cases:
1. All 5 families exist in `FAMILIES`.
2. Each family's `startingResources` deep-equals the expected object.
3. Influence ladder ordering check: `gambino > genovese > lucchese > colombo > bonanno`.
4. Respect floor: no family starts below 10.

`FAMILIES` is currently a module-local const — the test requires it to be exported. Add `export` to its declaration in `FamilySelectionScreen.tsx`.

## Files Touched

- `src/components/FamilySelectionScreen.tsx` — update `influence:` for Gambino (15→20), Genovese (10→15), Colombo (18→10); export `FAMILIES`.
- `package.json` — add 4 testing devDependencies.
- `vitest.config.ts` — new file.
- `src/test/setup.ts` — new file.
- `tsconfig.app.json` — add `"vitest/globals"` to `types`.
- `src/components/__tests__/FamilySelectionScreen.starting-balance.test.tsx` — new test file.
- `mem://gameplay/starting-balance` — record new influence ladder and rationale.

## Verification

- Pick Gambino → HUD shows **20** influence (was 15).
- Pick Colombo → HUD shows **10** influence (was 18).
- Bonanno/Lucchese influence unchanged.
- Run tests → starting-balance test passes; any future edit to `startingResources` fails the test until the expected snapshot is updated deliberately.

## What Doesn't Change

- Money, soldiers, politicalPower, respect for any family. Family bonuses, powers, AI starting values, Phase 1 dampener.

