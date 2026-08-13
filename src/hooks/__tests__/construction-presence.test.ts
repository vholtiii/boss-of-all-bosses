import { describe, expect, it } from "vitest";
import { BUILD_SPEED, buildCrewLabel, buildEtaTurns, buildProgressRate } from "@/types/game-mechanics";

describe("presence-gated construction progress", () => {
  it("fully pauses without a soldier, capo, or boss on site", () => {
    expect(BUILD_SPEED.unattended).toBe(0);
    expect(buildProgressRate(false, 0)).toBe(0);
    expect(buildEtaTurns(4, false, 0)).toBe(0);
    expect(buildCrewLabel(false, 0)).toBe("Paused — send a crew");
  });

  it("resumes at the existing crew rates when occupied", () => {
    expect(buildProgressRate(false, 1)).toBe(BUILD_SPEED.soldier);
    expect(buildProgressRate(true, 0)).toBe(BUILD_SPEED.capo);
    expect(buildEtaTurns(3, false, 1)).toBe(5);
    expect(buildEtaTurns(3, true, 0)).toBe(2);
  });
});