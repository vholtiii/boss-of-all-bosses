import { describe, it, expect } from "vitest";
import {
  createInitialGameState,
  tickPassiveRacketeering,
  PASSIVE_RACKET_TURNS_REQUIRED,
} from "@/hooks/useEnhancedMafiaGameState";

// See mem://gameplay/unit-attributes-and-promotion — passive racketeering path.
//
// Rules under test:
// - Soldier (not capo) on a same-family extorted-business hex ticks extortedHexTurns +1/turn.
// - At 5 turns, racketeering +1 (cap 5), loyalty +1 (cap 80), counter resets.
// - Counter resets to 0 the moment the soldier is no longer eligible.
// - Player-built businesses (isExtorted=false) don't qualify.
// - Capos don't qualify.
// - Works for AI families too.

const makeState = () => createInitialGameState("gambino", undefined, "normal", 1, "medium");

const findPlayerSoldier = (s: ReturnType<typeof makeState>) =>
  s.deployedUnits.find((u) => u.family === s.playerFamily && u.type === "soldier")!;

const placeSoldierOnExtortedHex = (
  s: ReturnType<typeof makeState>,
  opts: { isExtorted?: boolean; sameFamily?: boolean } = {}
) => {
  const isExtorted = opts.isExtorted ?? true;
  const sameFamily = opts.sameFamily ?? true;
  const tile = s.hexMap.find((t) => t.business && !t.isHeadquarters)!;
  expect(tile).toBeDefined();
  tile.controllingFamily = sameFamily ? s.playerFamily : ("genovese" as any);
  tile.business!.isExtorted = isExtorted;
  const soldier = findPlayerSoldier(s);
  soldier.q = tile.q;
  soldier.r = tile.r;
  soldier.s = tile.s;
  return { tile, soldier };
};

describe("Passive racketeering — extorted hex occupancy", () => {
  it("ticks extortedHexTurns each turn the soldier sits on a same-family extorted hex", () => {
    const s = makeState();
    const { soldier } = placeSoldierOnExtortedHex(s);
    const stats = s.soldierStats[soldier.id];
    stats.extortedHexTurns = 0;
    stats.racketeering = 0;

    for (let i = 1; i < PASSIVE_RACKET_TURNS_REQUIRED; i++) {
      tickPassiveRacketeering(s);
      expect(stats.extortedHexTurns).toBe(i);
      expect(stats.racketeering).toBe(0);
    }
  });

  it("awards +1 racketeering and +1 loyalty (resetting counter) at 5 consecutive turns", () => {
    const s = makeState();
    const { soldier } = placeSoldierOnExtortedHex(s);
    const stats = s.soldierStats[soldier.id];
    stats.extortedHexTurns = 0;
    stats.racketeering = 1;
    stats.loyalty = 50;

    for (let i = 0; i < PASSIVE_RACKET_TURNS_REQUIRED; i++) {
      tickPassiveRacketeering(s);
    }
    expect(stats.racketeering).toBe(2);
    expect(stats.loyalty).toBe(51);
    expect(stats.extortedHexTurns).toBe(0);
  });

  it("resets the counter to 0 when the soldier moves off the hex", () => {
    const s = makeState();
    const { soldier } = placeSoldierOnExtortedHex(s);
    const stats = s.soldierStats[soldier.id];
    stats.extortedHexTurns = 0;

    tickPassiveRacketeering(s);
    tickPassiveRacketeering(s);
    expect(stats.extortedHexTurns).toBe(2);

    // Move soldier off
    soldier.q += 5;
    tickPassiveRacketeering(s);
    expect(stats.extortedHexTurns).toBe(0);
  });

  it("resets the counter when the hex is flipped to a rival family", () => {
    const s = makeState();
    const { tile, soldier } = placeSoldierOnExtortedHex(s);
    const stats = s.soldierStats[soldier.id];
    stats.extortedHexTurns = 3;

    tile.controllingFamily = "genovese" as any;
    tickPassiveRacketeering(s);
    expect(stats.extortedHexTurns).toBe(0);
  });

  it("does NOT tick on a player-built (non-extorted) business hex", () => {
    const s = makeState();
    const { soldier } = placeSoldierOnExtortedHex(s, { isExtorted: false });
    const stats = s.soldierStats[soldier.id];
    stats.extortedHexTurns = 0;

    tickPassiveRacketeering(s);
    expect(stats.extortedHexTurns).toBe(0);
  });

  it("does NOT tick for capos (they're already promoted)", () => {
    const s = makeState();
    const { tile } = placeSoldierOnExtortedHex(s);
    const capo = s.deployedUnits.find((u) => u.family === s.playerFamily && u.type === "capo");
    expect(capo).toBeDefined();
    capo!.q = tile.q;
    capo!.r = tile.r;
    capo!.s = tile.s;
    // Even if a stats record existed for the capo, type-gate skips it.
    s.soldierStats[capo!.id] = {
      ...(s.soldierStats[capo!.id] as any),
      loyalty: 60,
      racketeering: 0,
      extortedHexTurns: 0,
    } as any;

    tickPassiveRacketeering(s);
    const capoStats = s.soldierStats[capo!.id] as any;
    expect(capoStats?.extortedHexTurns ?? 0).toBe(0);
  });

  it("caps racketeering at 5 — already-maxed soldier still resets counter and bumps loyalty", () => {
    const s = makeState();
    const { soldier } = placeSoldierOnExtortedHex(s);
    const stats = s.soldierStats[soldier.id];
    stats.racketeering = 5;
    stats.loyalty = 50;
    stats.extortedHexTurns = 0;

    for (let i = 0; i < PASSIVE_RACKET_TURNS_REQUIRED; i++) {
      tickPassiveRacketeering(s);
    }
    expect(stats.racketeering).toBe(5);
    expect(stats.loyalty).toBe(51);
    expect(stats.extortedHexTurns).toBe(0);
  });

  it("loyalty cap at 80 is respected", () => {
    const s = makeState();
    const { soldier } = placeSoldierOnExtortedHex(s);
    const stats = s.soldierStats[soldier.id];
    stats.loyalty = 80;
    stats.racketeering = 2;
    stats.extortedHexTurns = 0;

    for (let i = 0; i < PASSIVE_RACKET_TURNS_REQUIRED; i++) {
      tickPassiveRacketeering(s);
    }
    expect(stats.loyalty).toBe(80);
  });

  it("AI family soldiers tick the same way (full parity)", () => {
    const s = makeState();
    const aiOpp = s.aiOpponents[0];
    const aiFamily = aiOpp.family;
    // Find or create an AI soldier
    let aiSoldier = s.deployedUnits.find((u) => u.family === aiFamily && u.type === "soldier");
    if (!aiSoldier) {
      aiSoldier = {
        id: `${aiFamily}-test-soldier`,
        type: "soldier",
        family: aiFamily as any,
        q: 0,
        r: 0,
        s: 0,
        movesRemaining: 2,
        maxMoves: 2,
        level: 1,
      } as any;
      s.deployedUnits.push(aiSoldier!);
      s.soldierStats[aiSoldier!.id] = {
        loyalty: 50,
        training: 0,
        hits: 0,
        extortions: 0,
        victories: 0,
        toughness: 0,
        racketeering: 0,
        turnsDeployed: 0,
        toughnessProgress: 0,
        turnsIdle: 0,
        isMercenary: false,
        actedThisTurn: false,
        suspiciousTurns: 0,
        suspicious: false,
        confirmedRat: false,
        extortedHexTurns: 0,
      } as any;
    }
    const tile = s.hexMap.find((t) => t.business && !t.isHeadquarters)!;
    tile.controllingFamily = aiFamily as any;
    tile.business!.isExtorted = true;
    aiSoldier!.q = tile.q;
    aiSoldier!.r = tile.r;
    aiSoldier!.s = tile.s;

    const aiStats = s.soldierStats[aiSoldier!.id];
    aiStats.extortedHexTurns = 0;
    aiStats.racketeering = 0;

    for (let i = 0; i < PASSIVE_RACKET_TURNS_REQUIRED; i++) {
      tickPassiveRacketeering(s);
    }
    expect(aiStats.racketeering).toBe(1);
    expect(aiStats.extortedHexTurns).toBe(0);
  });

  it("returns the count of player-only ticks for notification purposes", () => {
    const s = makeState();
    const { soldier } = placeSoldierOnExtortedHex(s);
    const stats = s.soldierStats[soldier.id];
    stats.extortedHexTurns = PASSIVE_RACKET_TURNS_REQUIRED - 1;
    stats.racketeering = 0;

    const ticks = tickPassiveRacketeering(s);
    expect(ticks).toBe(1);

    // Next tick (already reset) — no rewards yet
    const ticks2 = tickPassiveRacketeering(s);
    expect(ticks2).toBe(0);
  });
});
