import { describe, it, expect, afterEach, vi } from "vitest";
import { createInitialGameState } from "@/hooks/useEnhancedMafiaGameState";

// AI starting resources have intentional bands documented in
// mem://gameplay/starting-balance. This suite locks in the soldier range
// (with difficulty scaling) and the money band.

describe("AI opponents starting resources", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AI starting soldiers fall in [2, 4] across many trials (covers Hard +1)", () => {
    for (let trial = 0; trial < 30; trial++) {
      const difficulty = (["easy", "normal", "hard"] as const)[trial % 3];
      const state = createInitialGameState("gambino", undefined, difficulty, 4242 + trial, "medium");
      for (const opp of state.aiOpponents) {
        expect(opp.resources.soldiers).toBeGreaterThanOrEqual(2);
        expect(opp.resources.soldiers).toBeLessThanOrEqual(4);
      }
    }
  });

  it("on Hard difficulty, every AI starts with at least 3 soldiers", () => {
    // Force Math.random to 0 → base roll yields 2; Hard adds +1 → 3 minimum.
    vi.spyOn(Math, "random").mockReturnValue(0);
    const state = createInitialGameState("gambino", undefined, "hard", 1, "medium");
    for (const opp of state.aiOpponents) {
      expect(opp.resources.soldiers).toBeGreaterThanOrEqual(3);
    }
  });

  it("on Normal/Easy difficulty, AI soldiers cap at 3", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9999); // ceiling roll → +1
    for (const diff of ["easy", "normal"] as const) {
      const state = createInitialGameState("gambino", undefined, diff, 1, "medium");
      for (const opp of state.aiOpponents) {
        expect(opp.resources.soldiers).toBeLessThanOrEqual(3);
      }
    }
  });

  it("AI starting money stays within [35000, 50000]", () => {
    for (let trial = 0; trial < 20; trial++) {
      const state = createInitialGameState("gambino", undefined, "normal", 9000 + trial, "medium");
      for (const opp of state.aiOpponents) {
        expect(opp.resources.money).toBeGreaterThanOrEqual(35000);
        expect(opp.resources.money).toBeLessThan(50000);
      }
    }
  });
});
