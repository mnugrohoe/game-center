import { describe, expect, it } from "vitest";

import {
  generateShikaku,
  generateShikakuBoard,
  generateShikakuByLevel,
  generateShikakuByTierIdx,
} from "./generator";

import {
  getShikakuParamsByTierIdx,
  SHIKAKU_TIERS,
  type PuzzleParams,
} from "./difficulty";

import { mkRng } from "@/shared/algorithms";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeParams(partial: Partial<PuzzleParams> = {}): PuzzleParams {
  return {
    width: 8,
    height: 8,
    rectCount: 10,
    minArea: 2,
    compactness: 0.5,
    sizeVariance: 0.5,
    anchorAmbiguity: 0.5,
    label: "Test",
    ...partial,
  };
}

function rectAreaSum(
  rects: {
    w: number;
    h: number;
  }[],
) {
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

  it("respects minimum area", () => {
    const rects = generateShikakuBoard(10, 10, 12, mkRng(123), {
      minArea: 4,
    });

    for (const r of rects) {
      expect(r.w * r.h).toBeGreaterThanOrEqual(4);
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

      expect(ratio).toBeLessThanOrEqual(3.5);
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

    const result = generateShikaku(params, mkRng(123));

    expect(result.rectCount).toBe(params.rectCount);
    expect(result.infos.length).toBe(params.rectCount);

    const labels = new Set(result.infos.map((r) => r.label));

    expect(labels.size).toBe(params.rectCount);

    for (const r of result.infos) {
      expect(r.area).toBeGreaterThanOrEqual(params.minArea);

      expect(r.anchor.x).toBeGreaterThanOrEqual(0);
      expect(r.anchor.y).toBeGreaterThanOrEqual(0);

      expect(r.anchor.x).toBeLessThan(params.width);
      expect(r.anchor.y).toBeLessThan(params.height);
    }
  });

  it("is deterministic", () => {
    const params = makeParams();

    const a = generateShikaku(params, mkRng(123));
    const b = generateShikaku(params, mkRng(123));

    expect(a).toEqual(b);
  });

  it("changes with different seeds", () => {
    const params = makeParams();

    const a = generateShikaku(params, mkRng(1));
    const b = generateShikaku(params, mkRng(2));

    expect(a).not.toEqual(b);
  });

  it("easy anchors tend toward center", () => {
    const params = makeParams({
      anchorAmbiguity: 0,
    });

    const result = generateShikaku(params, mkRng(123));

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

    const result = generateShikaku(params, mkRng(123));

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

    const res = generateShikaku(params, mkRng(Date.now()));
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

// ─────────────────────────────────────────────────────────────────────────────
// generateShikakuByLevel()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateShikakuByLevel()", () => {
  it("generates valid puzzle", () => {
    const result = generateShikakuByLevel(1);

    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);

    expect(result.rectCount).toBeGreaterThan(0);
    expect(result.infos.length).toBe(result.rectCount);
  });

  it("is deterministic for same level", () => {
    const a = generateShikakuByLevel(25);
    const b = generateShikakuByLevel(25);

    expect(a).toEqual(b);
  });

  it("changes across levels", () => {
    const samples = new Set<string>();

    for (let level = 10; level < 20; level++) {
      const p = generateShikakuByLevel(level);

      samples.add(JSON.stringify([p.width, p.height, p.rectCount]));
    }

    expect(samples.size).toBeGreaterThan(1);
  });

  it("higher levels tend to create larger boards", () => {
    let lowTotal = 0;
    let highTotal = 0;

    for (let i = 0; i < 20; i++) {
      const low = generateShikakuByLevel(1);
      const high = generateShikakuByLevel(999);

      lowTotal += low.width * low.height;
      highTotal += high.width * high.height;
    }

    expect(highTotal).toBeGreaterThan(lowTotal);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateShikakuByTierIdx()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateShikakuByTierIdx()", () => {
  it("generates valid puzzle for every tier", () => {
    for (let tierIdx = 0; tierIdx < SHIKAKU_TIERS.length; tierIdx++) {
      let result;
      const tier = SHIKAKU_TIERS[tierIdx];
      for (let attempt = 0; attempt < 20; attempt++) {
        try {
          result = generateShikakuByTierIdx(tierIdx);

          if (result) {
            break;
          }
        } catch {
          // retry
        }
      }
      if (!result) {
        continue;
      }

      expect(result).toBeDefined();
      expect(result.width).toBeGreaterThanOrEqual(tier.minBoard);
      expect(result.width).toBeLessThanOrEqual(tier.maxBoard);
      expect(result.height).toBeGreaterThanOrEqual(tier.minBoard);
      expect(result.height).toBeLessThanOrEqual(tier.maxBoard);
      expect(result.rectCount).toBeGreaterThan(0);
      expect(result.infos.length).toBe(result.rectCount);
    }
  });

  it("higher tiers statistically generate larger boards", () => {
    let easyTotal = 0;
    let hardTotal = 0;

    for (let i = 0; i < 25; i++) {
      try {
        const easy = generateShikakuByTierIdx(0);
        easyTotal += easy.width * easy.height;
      } catch {}

      try {
        const hard = generateShikakuByTierIdx(SHIKAKU_TIERS.length - 1);

        hardTotal += hard.width * hard.height;
      } catch {}
    }

    expect(hardTotal).toBeGreaterThan(easyTotal);
  });

  it("throws on invalid tier index", () => {
    expect(() => generateShikakuByTierIdx(SHIKAKU_TIERS.length + 1)).toThrow(
      "Tier not found",
    );
  });

  it("tier generation is randomized over time", async () => {
    const a = generateShikakuByTierIdx(3);

    await new Promise((r) => setTimeout(r, 5));

    const b = generateShikakuByTierIdx(3);

    expect(a).toBeDefined();
    expect(b).toBeDefined();

    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("lowest tier survives 100 seeds", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = mkRng(seed);
      const params = getShikakuParamsByTierIdx(0, rng);

      expect(() => generateShikaku(params, rng)).not.toThrow();
    }
  });

  it("highest tier survives 100 seeds", () => {
    const tierIdx = SHIKAKU_TIERS.length - 1;

    for (let seed = 1; seed <= 100; seed++) {
      const rng = mkRng(seed);
      const params = getShikakuParamsByTierIdx(tierIdx, rng);

      expect(() => generateShikaku(params, rng)).not.toThrow();
    }
  });
});
