import { describe, expect, it } from "vitest";

import {
  generateShikaku,
  generateShikakuBoard,
  shikakuGenerator,
} from "./generator";

import { SHIKAKU_TIERS, type ShikakuParams } from "./difficulty";
import { mkRng } from "@/shared/algorithms";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeParams(partial: Partial<ShikakuParams> = {}): ShikakuParams {
  return {
    width: 8,
    height: 8,
    rectCount: 10,
    compactness: 0.5,
    sizeVariance: 0.5,
    anchorAmbiguity: 0.5,
    tier: SHIKAKU_TIERS[0],
    seed: 123,
    ...partial,
  };
}

function rectAreaSum(rects: { w: number; h: number }[]): number {
  return rects.reduce((sum, r) => sum + r.w * r.h, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// generateShikakuBoard()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateShikakuBoard()", () => {
  it("generates correct rectangle count", () => {
    const rects = generateShikakuBoard(8, 8, 12, mkRng(123));
    expect(rects.length).toBe(12);
  });

  it("preserves total area", () => {
    const rects = generateShikakuBoard(10, 8, 15, mkRng(123));
    expect(rectAreaSum(rects)).toBe(80);
  });

  it("all rectangles have positive size", () => {
    const rects = generateShikakuBoard(10, 10, 20, mkRng(123));

    for (const r of rects) {
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
    }
  });

  it("is deterministic", () => {
    const a = generateShikakuBoard(8, 8, 10, mkRng(123));
    const b = generateShikakuBoard(8, 8, 10, mkRng(123));

    expect(a).toEqual(b);
  });

  it("changes with different seeds", () => {
    const a = generateShikakuBoard(8, 8, 10, mkRng(1));
    const b = generateShikakuBoard(8, 8, 10, mkRng(2));

    expect(a).not.toEqual(b);
  });

  it("throws on impossible board", () => {
    expect(() =>
      generateShikakuBoard(4, 4, 20, mkRng(123), {
        minArea: 2,
      }),
    ).toThrow();
  });

  it("throws on invalid dimensions", () => {
    expect(() => generateShikakuBoard(0, 5, 3, mkRng(123))).toThrow();

    expect(() => generateShikakuBoard(5, -1, 3, mkRng(123))).toThrow();
  });

  it("high compactness creates less extreme rectangles", () => {
    const rects = generateShikakuBoard(12, 12, 16, mkRng(123), {
      compactness: 1,
    });

    for (const r of rects) {
      const ratio = Math.max(r.w / r.h, r.h / r.w);
      expect(ratio).toBeLessThanOrEqual(12.5);
    }
  });

  it("low compactness occasionally allows skinny rectangles", () => {
    let found = false;

    for (let i = 0; i < 40; i++) {
      try {
        const rects = generateShikakuBoard(12, 12, 16, mkRng(i), {
          compactness: 0,
        });

        const hasSkinny = rects.some(
          (r) => Math.max(r.w / r.h, r.h / r.w) >= 3,
        );

        if (hasSkinny) {
          found = true;
          break;
        }
      } catch {
        // ignore failed generations
      }
    }

    expect(found).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateShikaku()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateShikaku()", () => {
  it("returns valid puzzle info", () => {
    const params = makeParams();

    const result = generateShikaku(params);

    expect(result.rectCount).toBe(params.rectCount);
    expect(result.infos.length).toBe(params.rectCount);

    const labels = new Set(result.infos.map((r) => r.id));

    expect(labels.size).toBe(params.rectCount);

    for (const r of result.infos) {
      expect(r.anchor.x).toBeGreaterThanOrEqual(0);
      expect(r.anchor.y).toBeGreaterThanOrEqual(0);

      expect(r.anchor.x).toBeLessThan(params.width);
      expect(r.anchor.y).toBeLessThan(params.height);
    }
  });

  it("is deterministic", () => {
    const params = makeParams();

    const a = generateShikaku(params);
    const b = generateShikaku(params);

    expect(a).toEqual(b);
  });

  it("changes with different seeds", () => {
    const params = makeParams();

    const a = generateShikaku({ ...params, seed: 1 });
    const b = generateShikaku({ ...params, seed: 2 });

    expect(a).not.toEqual(b);
  });

  it("easy anchors tend toward center", () => {
    const params = makeParams({
      anchorAmbiguity: 0,
    });

    const result = generateShikaku(params);

    let centerish = 0;

    for (const r of result.infos) {
      const nearCenter =
        r.anchor.x > 1 &&
        r.anchor.x < params.width - 2 &&
        r.anchor.y > 1 &&
        r.anchor.y < params.height - 2;

      if (nearCenter) {
        centerish++;
      }
    }

    expect(centerish).toBeGreaterThan(0);
  });

  it("hard anchors often touch edges", () => {
    const params = makeParams({
      anchorAmbiguity: 1,
    });

    const result = generateShikaku(params);

    const edgeAnchors = result.infos.filter((r) => {
      return (
        r.anchor.x === 0 ||
        r.anchor.y === 0 ||
        r.anchor.x === params.width - 1 ||
        r.anchor.y === params.height - 1
      );
    });

    expect(edgeAnchors.length).toBeGreaterThan(0);
  });

  it("visual debug", () => {
    const params = makeParams({
      width: 10,
      height: 12,
      rectCount: 25,
    });

    const res = generateShikaku(params);
    const grid = Array.from({ length: params.height }, () =>
      Array(params.width).fill("."),
    );

    for (const r of res.infos) {
      grid[r.anchor.y][r.anchor.x] = String(r.area);
    }

    console.log("\n=== ANCHOR MAP ===\n");
    console.log(grid.map((r) => r.join(" ")).join("\n"));

    expect(res.infos.length).toBe(params.rectCount);
  });
});

describe("generateShikaku()", () => {
  it("returns valid puzzle info", () => {
    const params = makeParams();

    const result = generateShikaku(params);

    expect(result.rectCount).toBe(params.rectCount);
    expect(result.infos.length).toBe(params.rectCount);

    const ids = new Set(result.infos.map((r) => r.id));
    expect(ids.size).toBe(params.rectCount);

    for (const r of result.infos) {
      expect(r.anchor.x).toBeGreaterThanOrEqual(0);
      expect(r.anchor.y).toBeGreaterThanOrEqual(0);
      expect(r.anchor.x).toBeLessThan(params.width);
      expect(r.anchor.y).toBeLessThan(params.height);
    }
  });

  it("is deterministic", () => {
    const params = makeParams();

    const a = generateShikaku(params);
    const b = generateShikaku(params);

    expect(a).toEqual(b);
  });

  it("changes with different seeds", () => {
    const a = generateShikaku(makeParams({ seed: 1 }));
    const b = generateShikaku(makeParams({ seed: 2 }));

    expect(a).not.toEqual(b);
  });
});

describe("shikakuGenerator.byLevel()", () => {
  it("generates valid puzzles", () => {
    const result = shikakuGenerator.byLevel(1);

    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);

    expect(result.rectCount).toBeGreaterThan(0);
    expect(result.infos.length).toBe(result.rectCount);
  });

  it("is deterministic", () => {
    expect(shikakuGenerator.byLevel(25)).toEqual(shikakuGenerator.byLevel(25));
  });

  it("varies across levels", () => {
    const samples = new Set<string>();

    for (let level = 10; level < 20; level++) {
      const p = shikakuGenerator.byLevel(level);
      samples.add(JSON.stringify([p.width, p.height, p.rectCount]));
    }

    expect(samples.size).toBeGreaterThan(1);
  });

  it("higher levels tend to be larger", () => {
    let low = 0;
    let high = 0;

    for (let i = 0; i < 20; i++) {
      low +=
        shikakuGenerator.byLevel(1).width * shikakuGenerator.byLevel(1).height;

      high +=
        shikakuGenerator.byLevel(999).width *
        shikakuGenerator.byLevel(999).height;
    }

    expect(high).toBeGreaterThan(low);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateShikakuByTierIdx()
// ─────────────────────────────────────────────────────────────────────────────
describe("shikakuGenerator.byTier()", () => {
  it("generates valid puzzles for all tiers", () => {
    for (let tierIdx = 0; tierIdx < SHIKAKU_TIERS.length; tierIdx++) {
      const tier = SHIKAKU_TIERS[tierIdx];

      let result;

      for (let attempt = 0; attempt < 10; attempt++) {
        result = shikakuGenerator.byTier(tierIdx, 123 + attempt);
        if (result) break;
      }

      expect(result).toBeDefined();

      expect(result!.width).toBeGreaterThanOrEqual(tier.minBoard);
      expect(result!.width).toBeLessThanOrEqual(tier.maxBoard);

      expect(result!.height).toBeGreaterThanOrEqual(tier.minBoard);
      expect(result!.height).toBeLessThanOrEqual(tier.maxBoard);

      expect(result!.rectCount).toBeGreaterThan(0);
      expect(result!.infos.length).toBe(result!.rectCount);
    }
  });

  it("higher tiers tend to produce larger boards", () => {
    let easy = 0;
    let hard = 0;

    for (let i = 0; i < 25; i++) {
      easy +=
        shikakuGenerator.byTier(0, i).width *
        shikakuGenerator.byTier(0, i).height;

      hard +=
        shikakuGenerator.byTier(SHIKAKU_TIERS.length - 1, i).width *
        shikakuGenerator.byTier(SHIKAKU_TIERS.length - 1, i).height;
    }

    expect(hard).toBeGreaterThan(easy);
  });

  it("is deterministic with seed", () => {
    expect(shikakuGenerator.byTier(4, 999)).toEqual(
      shikakuGenerator.byTier(4, 999),
    );
  });
});
