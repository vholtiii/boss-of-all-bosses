import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { BLIND_HIT_RESPECT } from "@/types/game-mechanics";

const src = fs.readFileSync(
  path.resolve(__dirname, "../useEnhancedMafiaGameState.ts"),
  "utf-8"
);

describe("Respect — harder passive, bigger bold-move payouts", () => {
  it("Blind Hit grants +30 respect (50% boost over the previous 20)", () => {
    expect(BLIND_HIT_RESPECT).toBe(30);
  });

  it("passive respect uses the harder divisors (income cap 2 / 10000, biz hexes / 10)", () => {
    expect(src).toMatch(/Math\.min\(2,\s*newState\.finances\.totalIncome\s*\/\s*10000\)/);
    expect(src).toMatch(/hexesWithBusinesses\s*\/\s*10/);
    expect(src).toMatch(/rawRespectGain\s*\*=\s*0\.4/);
  });

  it("diminishing returns kick in earlier (50/70/85 thresholds, steeper top tier)", () => {
    expect(src).toMatch(/current\s*>=\s*85\s*\?\s*0\.12\s*:\s*current\s*>=\s*70\s*\?\s*0\.30\s*:\s*current\s*>=\s*50\s*\?\s*0\.55/);
  });

  it("outnumbered combat victory awards +2 'Bold Strike' respect", () => {
    expect(src).toMatch(/attackers\s*<\s*defenders[\s\S]{0,200}awardBoldRespect\(state,\s*state\.playerFamily,\s*2,\s*'outnumbered_strike'/);
  });

  it("'Send a Message' (sabotage + hit on same enemy hex same turn) awards +4 respect", () => {
    expect(src).toMatch(/awardBoldRespect\(state,\s*state\.playerFamily,\s*4,\s*'send_a_message'/);
    expect(src).toMatch(/_sabotagedThisTurn/);
  });

  it("safehouse capture awards +3 respect via bold-move helper", () => {
    expect(src).toMatch(/awardBoldRespect\(state,\s*state\.playerFamily,\s*3,\s*'safehouse_capture'/);
  });

  it("bold-action helper bypasses diminishing returns and logs to turnReport", () => {
    expect(src).toMatch(/const awardBoldRespect\s*=/);
    expect(src).toMatch(/tr\.boldActions\.push/);
  });
});
