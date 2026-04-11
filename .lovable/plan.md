

# Make Capo Icon 20% Smaller

**File: `src/components/CapoIcon.tsx`**

Change `const size = 32` to `const size = 26` (32 × 0.8 = 25.6, rounded to 26). All dependent measurements (image position, glow radius, rings) already derive from `size`, so they'll scale automatically.

