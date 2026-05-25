import { describe, expect, it } from "vitest";

import { generate, generateBoard } from "./generator";

import type { PuzzleParams } from "./difficulty";

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
// generateBoard()
// ─────────────────────────────────────────────────────────────────────────────

describe("generateBoard()", () => {
  it("generates correct rectangle count", () => {
    const rects = generateBoard(8, 8, 12, 123);

    expect(rects.length).toBe(12);
  });

  it("preserves total area", () => {
    const rects = generateBoard(10, 8, 15, 123);

    expect(rectAreaSum(rects)).toBe(80);
  });

  it("all rectangles have positive size", () => {
    const rects = generateBoard(10, 10, 20, 123);

    for (const r of rects) {
      expect(r.w).toBeGreaterThan(0);
      expect(r.h).toBeGreaterThan(0);
    }
  });

  it("respects minimum area", () => {
    const rects = generateBoard(10, 10, 12, 123, {
      minArea: 4,
    });

    for (const r of rects) {
      expect(r.w * r.h).toBeGreaterThanOrEqual(4);
    }
  });

  it("is deterministic", () => {
    const a = generateBoard(8, 8, 10, 123);

    const b = generateBoard(8, 8, 10, 123);

    expect(a).toEqual(b);
  });

  it("changes with different seeds", () => {
    const a = generateBoard(8, 8, 10, 1);

    const b = generateBoard(8, 8, 10, 2);

    expect(a).not.toEqual(b);
  });

  it("throws on impossible board", () => {
    expect(() =>
      generateBoard(4, 4, 20, 123, {
        minArea: 2,
      }),
    ).toThrow();
  });

  it("throws on invalid dimensions", () => {
    expect(() => generateBoard(0, 5, 3, 123)).toThrow();

    expect(() => generateBoard(5, -1, 3, 123)).toThrow();
  });

  it("high compactness creates less extreme rectangles", () => {
    const rects = generateBoard(12, 12, 16, 123, {
      compactness: 1,
    });

    for (const r of rects) {
      const ratio = Math.max(r.w / r.h, r.h / r.w);

      expect(ratio).toBeLessThanOrEqual(3);
    }
  });

  it("low compactness allows skinny rectangles", () => {
    const rects = generateBoard(12, 12, 16, 123, {
      compactness: 0,
    });

    const hasSkinny = rects.some((r) => Math.max(r.w / r.h, r.h / r.w) >= 4);

    expect(hasSkinny).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generate()
// ─────────────────────────────────────────────────────────────────────────────

describe("generate()", () => {
  it("returns valid puzzle info", () => {
    const params = makeParams();

    const result = generate(params, 123);

    expect(result.length).toBe(params.rectCount);

    const labels = new Set(result.map((r) => r.label));

    expect(labels.size).toBe(params.rectCount);

    for (const r of result) {
      expect(r.area).toBeGreaterThanOrEqual(params.minArea);

      expect(r.anchor.x).toBeGreaterThanOrEqual(0);

      expect(r.anchor.y).toBeGreaterThanOrEqual(0);

      expect(r.anchor.x).toBeLessThan(params.width);

      expect(r.anchor.y).toBeLessThan(params.height);
    }
  });

  it("is deterministic", () => {
    const params = makeParams();

    const a = generate(params, 123);

    const b = generate(params, 123);

    expect(a).toEqual(b);
  });

  it("changes with different seeds", () => {
    const params = makeParams();

    const a = generate(params, 1);

    const b = generate(params, 2);

    expect(a).not.toEqual(b);
  });

  it("easy anchors tend toward center", () => {
    const params = makeParams({
      anchorAmbiguity: 0,
    });

    const result = generate(params, 123);

    let centerish = 0;

    for (const r of result) {
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

    const result = generate(params, 123);

    const edgeAnchors = result.filter((r) => {
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
      width: 5,
      height: 5,
      rectCount: 6,
    });

    const res = generate(params, 123);
    console.log("result: ", res);
    const grid = Array.from({ length: params.height }, () =>
      Array(params.width).fill("."),
    );

    for (const r of res) {
      grid[r.anchor.y][r.anchor.x] = String(r.area);
    }

    console.log("\n=== ANCHOR MAP ===\n");

    console.log(grid.map((r) => r.join(" ")).join("\n"));

    expect(res.length).toBe(params.rectCount);
  });
});
