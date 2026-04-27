import { describe, it, expect, afterEach, vi } from "vitest";
import { createInitialGameState, applyPlayerHeat } from "@/hooks/useEnhancedMafiaGameState";

// Locks in the wiring of the 6 declared difficulty modifiers in
// DIFFICULTY_MODIFIERS. See mem://gameplay/difficulty-levels for the table.

describe("Difficulty modifiers — wiring", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("playerMoneyMult", () => {
    it("Easy player starts with 1.5× Normal money; Hard with 0.75×", () => {
      const normal = createInitialGameState("gambino", undefined, "normal", 1, "medium");
      const easy = createInitialGameState("gambino", undefined, "easy", 1, "medium");
      const hard = createInitialGameState("gambino", undefined, "hard", 1, "medium");

      expect(easy.resources.money).toBe(Math.floor(normal.resources.money * 1.5 / normal.resources.money * normal.resources.money));
      // Direct ratio assertions (avoid fp surprises by allowing ±1 from Math.floor)
      expect(easy.resources.money).toBeCloseTo(normal.resources.money * 1.5, -1);
      expect(hard.resources.money).toBeCloseTo(normal.resources.money * 0.75, -1);
    });
  });

  describe("AI starting soldiers (difficulty branch)", () => {
    it("Hard AI opponents always start with ≥3 soldiers", () => {
      vi.spyOn(Math, "random").mockReturnValue(0);
      const state = createInitialGameState("gambino", undefined, "hard", 7, "medium");
      for (const opp of state.aiOpponents) {
        expect(opp.resources.soldiers).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe("policeHeatMult", () => {
    it("Easy scales heat by 0.7×; Hard by 1.3×; Normal unchanged", () => {
      const mk = (diff: "easy" | "normal" | "hard") => {
        const s = createInitialGameState("gambino", undefined, diff, 11, "medium");
        s.policeHeat = { level: 0, reductionPerTurn: 2, bribedOfficials: [], arrests: [], rattingRisk: 5 };
        return s;
      };
      const easy = mk("easy");
      const normal = mk("normal");
      const hard = mk("hard");

      applyPlayerHeat(easy, 10);
      applyPlayerHeat(normal, 10);
      applyPlayerHeat(hard, 10);

      // applyPlayerHeat applies policeHeatMult × HEAT_GAIN_MULT (1.30):
      //   easy:   round(10 × 0.7 × 1.30) = 9
      //   normal: round(10 × 1.0 × 1.30) = 13
      //   hard:   round(10 × 1.3 × 1.30) = 17
      expect(easy.policeHeat.level).toBe(9);
      expect(normal.policeHeat.level).toBe(13);
      expect(hard.policeHeat.level).toBe(17);
    });

    it("clamps heat at 100 regardless of difficulty", () => {
      const s = createInitialGameState("gambino", undefined, "hard", 12, "medium");
      s.policeHeat = { level: 95, reductionPerTurn: 2, bribedOfficials: [], arrests: [], rattingRisk: 5 };
      applyPlayerHeat(s, 50);
      expect(s.policeHeat.level).toBe(100);
    });
  });

  describe("hitSuccessBonus", () => {
    it("Easy/Normal/Hard expose the documented bonus values on state.difficultyModifiers", () => {
      const easy = createInitialGameState("gambino", undefined, "easy", 1, "medium");
      const normal = createInitialGameState("gambino", undefined, "normal", 1, "medium");
      const hard = createInitialGameState("gambino", undefined, "hard", 1, "medium");
      expect(easy.difficultyModifiers.hitSuccessBonus).toBeCloseTo(0.10, 5);
      expect(normal.difficultyModifiers.hitSuccessBonus).toBe(0);
      expect(hard.difficultyModifiers.hitSuccessBonus).toBeCloseTo(-0.10, 5);
    });
  });

  describe("eventCostMult & aiIncomeMult & aiRecruitCapBonus exposure", () => {
    it("all 6 modifiers are present on initial state for every difficulty", () => {
      for (const diff of ["easy", "normal", "hard"] as const) {
        const s = createInitialGameState("gambino", undefined, diff, 1, "medium");
        const m = s.difficultyModifiers;
        expect(typeof m.playerMoneyMult).toBe("number");
        expect(typeof m.aiIncomeMult).toBe("number");
        expect(typeof m.aiRecruitCapBonus).toBe("number");
        expect(typeof m.policeHeatMult).toBe("number");
        expect(typeof m.hitSuccessBonus).toBe("number");
        expect(typeof m.eventCostMult).toBe("number");
      }
    });
  });
});
