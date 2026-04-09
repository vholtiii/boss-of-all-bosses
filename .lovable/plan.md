

# Improve Supply Lines Panel Clarity

## What "Buffer" Means
"Buffer" is a **2-turn grace period** after a supply line gets severed. During those 2 turns, your businesses keep running at full revenue from stored stockpile. After the buffer expires, revenue starts decaying (-10%/turn down to 20% floor). The label "Buffer (1t)" means "1 turn of stockpile remaining."

The problem: this isn't explained anywhere in the UI — it's jargon.

## Changes to `src/components/GameSidePanels.tsx`

### 1. Rename "Buffer" to something clearer
Change the badge text from `Buffer (1t)` to `Stockpile: 1 turn left` — immediately understandable without game knowledge.

### 2. Add a brief legend/header below "Supply Lines" title
Add a small muted-text explanation line: *"Connect HQ to nodes via territory to supply your businesses"*

### 3. Improve status badge labels across all states
| Current | New |
|---------|-----|
| `Connected` | `✓ Active` |
| `Buffer (Nt)` | `Stockpile: N turns left` |
| `Severed` | `✗ Severed` |
| `No Route` | `— No Route` |

### 4. Add a tooltip-style line for Buffer/Severed states
- Buffer: show *"Businesses running on stored supplies"* in yellow text
- Severed: keep existing revenue % warning but prefix with *"Supply cut — "*

### 5. Show dependency info more prominently
Move the "Supplies: store front, store, restaurant" line to use a slightly bolder style so users understand *why* the node matters.

## Files Modified
- `src/components/GameSidePanels.tsx` — badge labels, header text, status descriptions

