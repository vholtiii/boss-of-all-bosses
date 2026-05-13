## Strip Cosmetic Weather Logic

Remove all weather state, types, and processing — nothing reads it for gameplay.

### Edits

**`src/hooks/useEnhancedMafiaGameState.ts`**
- Line 8: drop `WeatherSystem` from the type import.
- Line 313: drop the `weather:` clone field from the deep-clone helper.
- Line 487: drop `weather: WeatherSystem;` from the state interface.
- Lines 1212–1215: drop the `weather: {...}` initial-state block.
- Line 4005: drop the `processWeather(newState);` call in the turn pipeline.
- Lines 7560–7578: delete the `processWeather` function and its `// ============ WEATHER ============` banner.

**`src/types/enhanced-mechanics.ts`**
- Lines 288–308: delete the `WeatherSystem`, `WeatherCondition`, and `WeatherEffect` interfaces and their banner comment.
- Line 46: leave the `'weather'` literal in `CombatModifier.type` union as-is (it's a modifier category label, not tied to the deleted system); flag only if the user wants it gone too.

**`src/hooks/__tests__/simulation.test.ts`**
- Line 5: update the comment to drop "weather" from the pipeline list.

### Verification
- Run `bunx vitest run` to confirm all 57 tests still pass.
- No save-migration changes needed — `saveMigrations.ts` has no weather references, and old saves loading with an extra `weather` field will just be ignored.