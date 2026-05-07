import { describe, it, expect } from "vitest";

// These tests intentionally exercise the per-turn influence formula by reading
// the source weights, so they fail loudly if the formula drifts away from the
// "real-world drivers" design (built businesses, legal fronts, alliances,
// political bribes, district dominance, with hex count as a small floor).

import * as fs from "fs";
import * as path from "path";

const src = fs.readFileSync(
  path.resolve(__dirname, "../useEnhancedMafiaGameState.ts"),
  "utf-8"
);

describe("Influence — real-world drivers wiring", () => {
  it("formula uses built businesses with 0.4 weight (in-game constructions)", () => {
    expect(src).toMatch(/builtBusinessHexes\s*\*\s*0\.4/);
  });

  it("formula weights legal fronts (0.25), alliances (0.7), political bribes (0.5), districts60 (0.4)", () => {
    expect(src).toMatch(/legalBusinessHexes\s*\*\s*0\.25/);
    expect(src).toMatch(/activeAlliances\s*\*\s*0\.7/);
    expect(src).toMatch(/activePoliticalBribes\s*\*\s*0\.5/);
    expect(src).toMatch(/playerDistricts60\s*\*\s*0\.4/);
  });

  it("raw hex count is only a small floor (capped at 1.5)", () => {
    expect(src).toMatch(/Math\.min\(1\.5,\s*playerControlledHexes\s*\/\s*15\)/);
  });

  it("political bribes are limited to captain/chief/mayor (no patrol officer)", () => {
    const m = src.match(/activePoliticalBribes\s*=[\s\S]{0,400}\)\.length;/);
    expect(m).toBeTruthy();
    const block = m![0];
    expect(block).toMatch(/police_captain/);
    expect(block).toMatch(/police_chief/);
    expect(block).toMatch(/mayor/);
    expect(block).not.toMatch(/patrol_officer/);
  });

  it("construction completion grants a one-off influence spike (legal +3, illegal +2)", () => {
    expect(src).toMatch(/influenceSpike\s*=\s*tile\.business\.isLegal\s*\?\s*3\s*:\s*2/);
  });

  it("AI uses the same weighted formula (0.4 built / 0.25 legal / 0.7 alliance / 0.4 districts)", () => {
    expect(src).toMatch(/aiBuiltBiz\s*\*\s*0\.4/);
    expect(src).toMatch(/aiLegalBiz\s*\*\s*0\.25/);
    expect(src).toMatch(/aiAlliancesInvolving\s*\*\s*0\.7/);
    expect(src).toMatch(/aiDistricts60\s*\*\s*0\.4/);
  });
});
