import { describe, it, expect } from "vitest";
import { FAMILIES } from "../FamilySelectionScreen";

const EXPECTED = {
  gambino: { money: 60000, soldiers: 4, influence: 20, politicalPower: 40, respect: 20 },
  genovese: { money: 45000, soldiers: 4, influence: 15, politicalPower: 25, respect: 25 },
  lucchese: { money: 70000, soldiers: 3, influence: 12, politicalPower: 20, respect: 10 },
  bonanno: { money: 40000, soldiers: 2, influence: 8, politicalPower: 15, respect: 25 },
  colombo: { money: 35000, soldiers: 1, influence: 10, politicalPower: 10, respect: 15 },
} as const;

describe("FamilySelectionScreen starting balance", () => {
  it("includes all 5 families", () => {
    const ids = FAMILIES.map((f) => f.id).sort();
    expect(ids).toEqual(["bonanno", "colombo", "gambino", "genovese", "lucchese"]);
  });

  it.each(Object.entries(EXPECTED))(
    "%s starting resources match expected snapshot",
    (id, expected) => {
      const family = FAMILIES.find((f) => f.id === id);
      expect(family).toBeDefined();
      expect(family!.startingResources).toEqual(expected);
    }
  );

  it("influence ladder: gambino > genovese > lucchese > colombo > bonanno", () => {
    const inf = (id: string) =>
      FAMILIES.find((f) => f.id === id)!.startingResources.influence;
    expect(inf("gambino")).toBeGreaterThan(inf("genovese"));
    expect(inf("genovese")).toBeGreaterThan(inf("lucchese"));
    expect(inf("lucchese")).toBeGreaterThan(inf("colombo"));
    expect(inf("colombo")).toBeGreaterThan(inf("bonanno"));
  });

  it("respect floor: no family starts below 10", () => {
    for (const f of FAMILIES) {
      expect(f.startingResources.respect).toBeGreaterThanOrEqual(10);
    }
  });
});
