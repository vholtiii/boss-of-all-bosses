
# Fix: Soldier Dedupe + Double-Process Bug

## Problem

In `src/hooks/useEnhancedMafiaGameState.ts`:

1. **No dedupe on jail release** (lines 4233–4250 and 4506–4542): a soldier with the same `id` is pushed back into `deployedUnits` without checking whether one already exists. If anything ever fails to remove the unit on arrest, you get a true duplicate "spontaneous" soldier.
2. **Double-process / wrong handler wins**: the generic block at 4233 filters arrested soldiers by `returnTurn` only (no `source` filter) and removes all of them. The prosecution-specific block at 4506 then has nothing left to process — so prosecution releases never apply the −10 loyalty penalty or the "served their sentence" notification.

## Fix

### 1. Generic jail-release block (~line 4233)
- Skip arrests with `source === 'prosecution'` so the prosecution block can handle them.
- Before pushing the soldier, check `deployedUnits.some(u => u.id === a.unitId)` — if true, skip the push (mirror the existing capo dedupe at line 4255).
- Same dedupe for the capo loop is already correct; leave it.

### 2. Prosecution release block (~line 4506)
- Add the same `deployedUnits.some(u => u.id === a.unitId)` guard before pushing.
- Logic otherwise unchanged (it already filters by `source === 'prosecution'`).

## Files

- `src/hooks/useEnhancedMafiaGameState.ts` — two small edits in the post-turn release section.

## Verification

- Run `bunx vitest run` (existing 57 tests should still pass; no test currently asserts prosecution-release loyalty penalty, so behavior change is safe).
- Manual: trigger a prosecution arrest, advance turns past `returnTurn`, confirm the "⚖️ Soldier Released" toast fires and loyalty drops by 10.

No memory or doc updates needed — this is a pure bug fix matching documented behavior.
