

# Hide Capo Level Badge When Solo

**Problem**: The capo icon always shows a "level" number badge (showing "1"), but it should match soldier behavior — only display a count when 2+ units share the same hex.

**Fix — `src/components/CapoIcon.tsx`**:

- The "Level badge" block (lines 69-79) currently always renders showing `level`. This should be conditional: only render when `level >= 2`, matching SoldierIcon's `{count > 1 && (...)}` pattern.

Wrap lines 70-79 with `{level > 1 && ( ... )}`.

One-line wrapper change.

