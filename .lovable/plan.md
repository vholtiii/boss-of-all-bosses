## Remove Weather Display

Delete the weather card from the right sidebar in `src/components/GameSidePanels.tsx` (lines 1576–1591).

Leave the underlying `weather` state and `processWeather` logic in `useEnhancedMafiaGameState.ts` untouched — it's not currently affecting gameplay UI elsewhere, and removing state could break saves. Only the visible display is removed.