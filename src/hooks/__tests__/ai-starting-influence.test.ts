import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createInitialGameState } from "@/hooks/useEnhancedMafiaGameState";

// AI starting influence is intentionally a flat random range (8 + random(0..7) → 8..15)
// for ALL families, regardless of family identity. This differs from the player ladder
// (Gambino 20 > Genovese 15 > Lucchese 12 > Colombo 10 > Bonanno 8) by design — AI
// opponents are randomized per game to keep replays varied. These tests lock in the
// random range and document the intentional divergence from the player ladder.

const AI_INFLUENCE_MIN = 8;
const AI_INFLUENCE_MAX = 15; // 8 + (0..7)

describe("AI opponents starting influence", () => {
  beforeEach(() => {
    // Deterministic seed for reproducibility — Math.random still varies, so we
    // don't rely on it for ladder ordering, only range bounds.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("every AI opponent's influence falls within the documented random range", () => {
    // Run many trials to cover Math.random spread.
    for (let trial = 0; trial < 25; trial++) {
      const state = createInitialGameState("gambino", undefined, "normal", 12345 + trial, "medium");
      expect(state.aiOpponents.length).toBeGreaterThan(0);
      for (const opp of state.aiOpponents) {
        expect(opp.resources.influence).toBeGreaterThanOrEqual(AI_INFLUENCE_MIN);
        expect(opp.resources.influence).toBeLessThanOrEqual(AI_INFLUENCE_MAX);
      }
    }
  });

  it("AI influence range is family-agnostic (same bounds regardless of family)", () => {
    // Force Math.random to its extremes and verify every AI lands at the bound,
    // proving no per-family multiplier is silently applied.
    const families = ["gambino", "genovese", "lucchese", "bonanno", "colombo"] as const;

    vi.spyOn(Math, "random").mockReturnValue(0); // floor of every range
    for (const f of families) {
      const state = createInitialGameState(f, undefined, "normal", 1, "medium");
      for (const opp of state.aiOpponents) {
        expect(opp.resources.influence).toBe(AI_INFLUENCE_MIN);
      }
    }

    vi.spyOn(Math, "random").mockReturnValue(0.9999); // ceiling of every range
    for (const f of families) {
      const state = createInitialGameState(f, undefined, "normal", 1, "medium");
      for (const opp of state.aiOpponents) {
        expect(opp.resources.influence).toBe(AI_INFLUENCE_MAX);
      }
    }
  });

  it("AI influence intentionally diverges from the player per-family ladder", () => {
    // Document the design intent: AI uses a flat random range, not the player ladder.
    // If a future change introduces per-family AI influence, this test (and the AI
    // initialization logic) must be revisited together.
    const PLAYER_LADDER = { gambino: 20, genovese: 15, lucchese: 12, colombo: 10, bonanno: 8 };
    expect(AI_INFLUENCE_MAX).toBeLessThan(PLAYER_LADDER.gambino);
    expect(AI_INFLUENCE_MIN).toBe(PLAYER_LADDER.bonanno);
  });
});
