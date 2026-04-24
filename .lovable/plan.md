

# Sync docs to match in-game $600 local recruit cost

## Confirmation

In-game price = **$600** (from `LOCAL_SOLDIER_COST = 600` in `src/types/game-mechanics.ts`). That is the source of truth. The stale references are only in markdown docs.

## Fix

Update every `$300` local-recruit reference to `$600`:

- `README.md` — lines 101, 155
- `GAME_MECHANICS.md` — lines 143, 348
- `SOLDIER_RECRUITMENT_GUIDE.md` — lines 45, 189, 203

## Verification

`grep -n '\$300' README.md GAME_MECHANICS.md SOLDIER_RECRUITMENT_GUIDE.md` returns no local-recruit hits.

## What Doesn't Change

Game code, constants, UI, mechanics. Pure documentation sync.

