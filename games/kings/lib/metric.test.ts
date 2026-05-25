// metrics.test.ts
import { describe, it, expect } from "vitest";

import { measureRegions } from "./metrics";

describe("measureRegions", () => {
  it("computes metrics for balanced regions", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const result = measureRegions(grid, 4);

    expect(result.minSize).toBe(4);
    expect(result.maxSize).toBe(4);

    // all equal sizes
    expect(result.sizeCV).toBeCloseTo(0);

    // perfect rectangles
    expect(result.compactnessScore).toBeCloseTo(1);
  });

  it("computes varying region sizes", () => {
    const grid = [
      [0, 0, 0, 1],
      [0, 2, 2, 1],
      [0, 2, 3, 1],
      [0, 2, 3, 1],
    ];

    const result = measureRegions(grid, 4);

    expect(result.minSize).toBeGreaterThan(0);
    expect(result.maxSize).toBeGreaterThan(result.minSize);

    expect(result.sizeCV).toBeGreaterThan(0);
  });

  it("detects less compact regions", () => {
    const compactGrid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ];

    const spikyGrid = [
      [0, 1, 1, 1],
      [0, 1, 2, 2],
      [0, 3, 2, 2],
      [0, 3, 3, 3],
    ];

    const compact = measureRegions(compactGrid, 4);
    const spiky = measureRegions(spikyGrid, 4);

    expect(spiky.compactnessScore).toBeLessThan(compact.compactnessScore);
  });

  it("returns all expected metric fields", () => {
    const grid = [
      [0, 0],
      [1, 1],
    ];

    const result = measureRegions(grid, 2);

    expect(result).toEqual({
      minSize: expect.any(Number),
      maxSize: expect.any(Number),
      sizeCV: expect.any(Number),
      compactnessScore: expect.any(Number),
    });
  });

  it("handles single-cell-width regions", () => {
    const grid = [
      [0, 1, 2],
      [0, 1, 2],
      [0, 1, 2],
    ];

    const result = measureRegions(grid, 3);

    expect(result.minSize).toBe(3);
    expect(result.maxSize).toBe(3);

    expect(result.sizeCV).toBeCloseTo(0);

    expect(result.compactnessScore).toBeGreaterThan(0);
    expect(result.compactnessScore).toBeLessThanOrEqual(1);
  });

  it("produces deterministic results for same grid", () => {
    const grid = [
      [0, 0, 1],
      [0, 2, 1],
      [2, 2, 1],
    ];

    const a = measureRegions(grid, 3);
    const b = measureRegions(grid, 3);

    expect(a).toEqual(b);
  });

  it("compactness score never exceeds 1", () => {
    const grid = [
      [0, 0, 1],
      [0, 2, 1],
      [2, 2, 1],
    ];

    const result = measureRegions(grid, 3);

    expect(result.compactnessScore).toBeLessThanOrEqual(1);
  });

  it("compactness score is positive", () => {
    const grid = [
      [0, 0, 1],
      [0, 2, 1],
      [2, 2, 1],
    ];

    const result = measureRegions(grid, 3);

    expect(result.compactnessScore).toBeGreaterThan(0);
  });

  it("sizeCV is zero when all regions equal", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
    ];

    const result = measureRegions(grid, 2);

    expect(result.sizeCV).toBeCloseTo(0);
  });

  it("sizeCV increases with unequal regions", () => {
    const equalGrid = [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
    ];

    const unequalGrid = [
      [0, 0, 0, 1],
      [0, 0, 0, 1],
    ];

    const equal = measureRegions(equalGrid, 2);
    const unequal = measureRegions(unequalGrid, 2);

    expect(unequal.sizeCV).toBeGreaterThan(equal.sizeCV);
  });

  it("handles irregular region shapes", () => {
    const grid = [
      [0, 0, 1, 1],
      [0, 2, 2, 1],
      [0, 2, 3, 3],
      [0, 2, 3, 3],
    ];

    const result = measureRegions(grid, 4);

    expect(result.minSize).toBeGreaterThan(0);
    expect(result.maxSize).toBeGreaterThanOrEqual(result.minSize);
  });

  it("works with larger boards", () => {
    const grid = [
      [0, 0, 1, 1, 2, 2],
      [0, 0, 1, 1, 2, 2],
      [3, 3, 4, 4, 5, 5],
      [3, 3, 4, 4, 5, 5],
      [6, 6, 7, 7, 8, 8],
      [6, 6, 7, 7, 8, 8],
    ];

    const result = measureRegions(grid, 6);

    expect(result.minSize).toBe(4);
    expect(result.maxSize).toBe(4);

    expect(result.sizeCV).toBeCloseTo(0);
  });
});
