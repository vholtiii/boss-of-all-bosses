

# Right Panel: All Sections Collapsed by Default

## Problem
The right panel initializes with `useState<string>('rivals')`, which opens the "Rival Families" section by default.

## Fix

**File: `src/components/GameSidePanels.tsx`** (line 644)

Change the default state from `'rivals'` to `''` (empty string), so no section is expanded on load:

```ts
// Before
const [openSection, setOpenSection] = useState<string>('rivals');

// After
const [openSection, setOpenSection] = useState<string>('');
```

Single line change. All right-panel sections will remain collapsed until manually expanded.

