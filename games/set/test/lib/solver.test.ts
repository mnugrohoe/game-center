// solver.test.ts

import { describe, expect, it } from "vitest";

import { completeSet, findAllSets } from "@/games/set/lib/solver";

import type { SetCard } from "@/games/set/lib/types";

import { isValidSet } from "@/games/set/lib/validator";

/*
───────────────────────────────────────
HELPERS
───────────────────────────────────────
*/

function makeCard(partial: Partial<SetCard>): SetCard {
  return {
    id: crypto.randomUUID(),

    symbol: "diamond",
    color: "red",
    texture: "solid",
    count: 1,

    ...partial,
  };
}

/*
───────────────────────────────────────
findAllSets
───────────────────────────────────────
*/

describe("findAllSets", () => {
  it("finds a simple valid set", () => {
    const a = makeCard({
      symbol: "diamond",
      color: "red",
      texture: "solid",
      count: 1,
    });

    const b = makeCard({
      symbol: "hourglass",
      color: "green",
      texture: "striped",
      count: 2,
    });

    const c = makeCard({
      symbol: "x",
      color: "purple",
      texture: "outline",
      count: 3,
    });

    const result = findAllSets([a, b, c]);

    expect(result).toHaveLength(1);

    expect(result[0]).toEqual([a, b, c]);
  });

  it("returns outline when no set exists", () => {
    const cards = [
      makeCard({
        symbol: "diamond",
        color: "red",
        texture: "solid",
        count: 1,
      }),

      makeCard({
        symbol: "diamond",
        color: "red",
        texture: "solid",
        count: 2,
      }),

      makeCard({
        symbol: "diamond",
        color: "purple",
        texture: "solid",
        count: 3,
      }),
    ];

    const result = findAllSets(cards);

    expect(result).toHaveLength(0);
  });

  it("finds multiple sets", () => {
    const a = makeCard({
      symbol: "diamond",
      color: "red",
      texture: "solid",
      count: 1,
    });

    const b = makeCard({
      symbol: "hourglass",
      color: "green",
      texture: "striped",
      count: 2,
    });

    const c = makeCard({
      symbol: "x",
      color: "purple",
      texture: "outline",
      count: 3,
    });

    const d = makeCard({
      symbol: "diamond",
      color: "green",
      texture: "outline",
      count: 1,
    });

    const e = makeCard({
      symbol: "hourglass",
      color: "purple",
      texture: "solid",
      count: 2,
    });

    const f = makeCard({
      symbol: "x",
      color: "red",
      texture: "striped",
      count: 3,
    });

    const result = findAllSets([a, b, c, d, e, f]);

    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

/*
───────────────────────────────────────
completeSet
───────────────────────────────────────
*/

describe("completeSet", () => {
  it("creates a valid completing card", () => {
    const a = makeCard({
      symbol: "diamond",
      color: "red",
      texture: "solid",
      count: 1,
    });

    const b = makeCard({
      symbol: "hourglass",
      color: "green",
      texture: "striped",
      count: 2,
    });

    const c = completeSet(a, b);

    expect(isValidSet([a, b, c])).toBeTruthy();
  });

  it("keeps same feature if equal", () => {
    const a = makeCard({
      symbol: "diamond",
      color: "red",
      texture: "solid",
      count: 1,
    });

    const b = makeCard({
      symbol: "diamond",
      color: "green",
      texture: "striped",
      count: 2,
    });

    const c = completeSet(a, b);

    expect(c.symbol).toBe("diamond");
  });

  it("chooses third distinct feature if different", () => {
    const a = makeCard({
      color: "red",
    });

    const b = makeCard({
      color: "green",
    });

    const c = completeSet(a, b);

    expect(c.color).toBe("purple");
  });

  it("always produces mathematically valid SET", () => {
    const cards: SetCard[] = [
      makeCard({
        symbol: "diamond",
        color: "red",
        texture: "solid",
        count: 1,
      }),

      makeCard({
        symbol: "hourglass",
        color: "green",
        texture: "striped",
        count: 2,
      }),

      makeCard({
        symbol: "x",
        color: "purple",
        texture: "outline",
        count: 3,
      }),
    ];

    for (let i = 0; i < cards.length; i++) {
      for (let j = 0; j < cards.length; j++) {
        if (i === j) continue;

        const c = completeSet(cards[i], cards[j]);

        expect(isValidSet([cards[i], cards[j], c])).toBe(true);
      }
    }
  });
});
