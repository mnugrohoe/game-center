/**
 * @module metrics
 * Generic measurement and analysis utilities for puzzle grids.
 *
 * Analyzes properties of grid regions: size distribution, shape compactness,
 * variability, etc. Game-agnostic — works on any labeled region grid.
 *
 * Used by: Kings (puzzle difficulty), Shikaku (region analysis), etc.
 *
 * Usage:
 *   import { measureRegions, analyzeRegionSizes } from "@/shared/algorithms";
 */

import { getRegionCells, getRegionIds } from "./grid";
import type { Grid2D } from "../types";

/**
 * Statistical metrics for a collection of region sizes.
 */
export interface SizeMetrics {
  /** Minimum region size (cells). */
  minSize: number;
  /** Maximum region size (cells). */
  maxSize: number;
  /** Average region size. */
  avgSize: number;
  /** Standard deviation of sizes. */
  stddev: number;
  /**
   * Coefficient of variation = stddev / mean.
   * 0 = all identical; higher = more varied.
   */
  cv: number;
}

/**
 * Measures shape and size metrics for a grid of labeled regions.
 *
 * @param grid - N×M grid where each cell contains a region ID.
 * @returns SizeMetrics for all regions.
 *
 * @example
 * const metrics = analyzeRegionSizes(grid);
 * console.log(metrics.avgSize, metrics.cv);
 */
export function analyzeRegionSizes(grid: Grid2D): SizeMetrics {
  const regionIds = getRegionIds(grid);
  const sizes: number[] = [];

  for (const regionId of regionIds) {
    const cells = getRegionCells(grid, regionId);
    sizes.push(cells.length);
  }

  const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const stddev = Math.sqrt(
    sizes.reduce((a, v) => a + (v - avg) ** 2, 0) / sizes.length,
  );

  return {
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes),
    avgSize: avg,
    stddev,
    cv: stddev / avg,
  };
}

/**
 * Measures shape compactness of regions.
 * Compactness = actual cells / bounding box area.
 * Higher = more square/compact; lower = more spread out.
 */
export interface ShapeMetrics {
  /** Average compactness across all regions (0 = sprawling, 1 = perfect square). */
  avgCompactness: number;
  /** Minimum region compactness. */
  minCompactness: number;
  /** Maximum region compactness. */
  maxCompactness: number;
  /** Standard deviation of compactness scores. */
  compactnessStddev: number;
}

/**
 * Analyzes shape properties (compactness) of regions in grid.
 *
 * Compactness = (cell count) / (bounding box area)
 * - 1.0 = perfect square (minimal perimeter)
 * - 0.5 = medium (2:1 ratio or similar)
 * - Lower = more sprawling/irregular shape
 *
 * @param grid - Region grid (cell value = region ID).
 * @returns Shape metrics including compactness.
 *
 * @example
 * const shape = analyzeShapes(grid);
 * if (shape.avgCompactness < 0.4) {
 *   console.log("Puzzle has irregular/spiky regions");
 * }
 */
export function analyzeShapes(grid: Grid2D): ShapeMetrics {
  const regionIds = getRegionIds(grid);
  const compactnesses: number[] = [];

  for (const regionId of regionIds) {
    const cells = getRegionCells(grid, regionId);
    if (cells.length === 0) continue;

    // Find bounding box
    const rows = cells.map(([r]) => r);
    const cols = cells.map(([, c]) => c);
    const rSpan = Math.max(...rows) - Math.min(...rows) + 1;
    const cSpan = Math.max(...cols) - Math.min(...cols) + 1;
    const bbox = rSpan * cSpan;

    // Compactness = cells / bbox
    const compactness = cells.length / bbox;
    compactnesses.push(compactness);
  }

  const avg = compactnesses.reduce((a, b) => a + b, 0) / compactnesses.length;
  const stddev = Math.sqrt(
    compactnesses.reduce((a, v) => a + (v - avg) ** 2, 0) /
      compactnesses.length,
  );

  return {
    avgCompactness: avg,
    minCompactness: Math.min(...compactnesses),
    maxCompactness: Math.max(...compactnesses),
    compactnessStddev: stddev,
  };
}

/**
 * Combined metrics for both size and shape.
 */
export interface RegionMetrics extends SizeMetrics, ShapeMetrics {}

/**
 * Comprehensive analysis: combines size AND shape metrics.
 *
 * @param grid - Region grid.
 * @returns Combined RegionMetrics.
 *
 * @example
 * const metrics = measureRegions(grid);
 * const difficulty = (
 *   metrics.cv * 0.3 +           // Size variation
 *   (1 - metrics.avgCompactness) // Shape irregularity
 * ) * 10;
 */
export function measureRegions(grid: Grid2D): RegionMetrics {
  return {
    ...analyzeRegionSizes(grid),
    ...analyzeShapes(grid),
  };
}

/**
 * Calculates how "balanced" region sizes are.
 * Used to score puzzle difficulty based on size distribution.
 *
 * @param grid - Region grid.
 * @returns Score 0-1 where 0 = perfectly balanced, 1 = very unbalanced.
 *
 * @example
 * const balance = sizeBalance(grid);
 * if (balance > 0.5) {
 *   console.log("Puzzle has unequal regions (harder)");
 * }
 */
export function sizeBalance(grid: Grid2D): number {
  const metrics = analyzeRegionSizes(grid);
  // Normalize CV to 0-1: CV of 0 → 0, CV > 1 → clamp to 1
  return Math.min(1, metrics.cv);
}

/**
 * Calculates how "irregular" region shapes are.
 * Used to score puzzle difficulty based on shape complexity.
 *
 * @param grid - Region grid.
 * @returns Score 0-1 where 0 = perfect squares, 1 = very irregular.
 *
 * @example
 * const irregularity = shapeIrregularity(grid);
 * if (irregularity > 0.6) {
 *   console.log("Puzzle has complex/spiky regions (harder)");
 * }
 */
export function shapeIrregularity(grid: Grid2D): number {
  const metrics = analyzeShapes(grid);
  // Return 1 - compactness: 1 = sprawling, 0 = compact
  return 1 - metrics.avgCompactness;
}

/**
 * Combined difficulty score based on region metrics.
 * Higher = more difficult.
 *
 * @param grid - Region grid.
 * @param sizeWeight - Weight for size variation (0-1).
 * @param shapeWeight - Weight for shape irregularity (0-1).
 * @returns Difficulty score 0-1.
 *
 * @example
 * const difficulty = regionDifficulty(grid, 0.4, 0.6);
 * // Emphasize shape more than size
 */
export function regionDifficulty(
  grid: Grid2D,
  sizeWeight = 0.5,
  shapeWeight = 0.5,
): number {
  const balance = sizeBalance(grid);
  const irregular = shapeIrregularity(grid);
  return balance * sizeWeight + irregular * shapeWeight;
}

/**
 * Analyzes perimeter complexity - how much boundary exists per cell.
 * More perimeter = more complex shapes.
 *
 * @param grid - Region grid.
 * @returns Average perimeter-to-area ratio for all regions.
 *
 * @example
 * const perimeterScore = perimeterComplexity(grid);
 */
export function perimeterComplexity(grid: Grid2D): number {
  const regionIds = getRegionIds(grid);
  let totalPerimeter = 0;
  let totalArea = 0;

  for (const regionId of regionIds) {
    const cells = getRegionCells(grid, regionId);
    const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));

    // Count perimeter edges: edges that border other regions or grid boundary
    let perim = 0;
    for (const [r, c] of cells) {
      const neighbors = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      for (const [nr, nc] of neighbors) {
        if (!cellSet.has(`${nr},${nc}`)) {
          perim++;
        }
      }
    }

    totalPerimeter += perim;
    totalArea += cells.length;
  }

  return totalPerimeter / (totalArea || 1);
}
