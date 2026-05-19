/**
 * Kings puzzle region metrics.
 * Measures shape and size complexity of generated regions.
 * Used to display difficulty indicators and tune generation.
 */

import { getRegionCells, getRegionIds } from "@/shared/algorithms/grid";
import type { Grid2D } from "@/shared/types";

export interface RegionMetrics {
  /** Smallest region by cell count. */
  minSize: number;
  /** Largest region by cell count. */
  maxSize: number;
  /**
   * Coefficient of variation of region sizes (stddev / mean).
   * 0 = all regions identical size; higher = more unequal.
   */
  sizeCV: number;
  /**
   * Average bounding-box compactness: (cells / bbox area) per region, averaged.
   * 1.0 = perfectly square; lower = spikier/more elongated.
   */
  compactnessScore: number;
}

/**
 * Computes shape and size metrics for a Kings region grid.
 * Used to show players why a puzzle is rated as it is.
 *
 * @param grid - N×N region grid (each cell = region ID).
 * @param N    - Grid size.
 */
export function measureRegions(grid: Grid2D, N: number): RegionMetrics {
  const regIds = getRegionIds(grid);
  const sizes: number[] = [];
  let compSum = 0;

  for (const reg of regIds) {
    const cells = getRegionCells(grid, reg);
    sizes.push(cells.length);

    // Bounding-box compactness: ratio of cells to bbox area
    const rows = cells.map(([r]) => r);
    const cols = cells.map(([, c]) => c);
    const rSpan = Math.max(...rows) - Math.min(...rows) + 1;
    const cSpan = Math.max(...cols) - Math.min(...cols) + 1;
    compSum += cells.length / (rSpan * cSpan);
  }

  const avg = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  const stddev = Math.sqrt(sizes.reduce((a, v) => a + (v - avg) ** 2, 0) / sizes.length);

  return {
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes),
    sizeCV: stddev / avg,
    compactnessScore: compSum / sizes.length,
  };
}
