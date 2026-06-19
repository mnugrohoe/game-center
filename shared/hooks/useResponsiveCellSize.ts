"use client";

import { useEffect, useState } from "react";
import { clamp } from "../algorithms";

/**
 * Interface untuk konfigurasi kalkulasi ukuran grid responsif.
 */
interface UseResponsiveCellSizeProps {
  rows?: number | null;
  cols?: number | null;
  containerId?: string;
  minSize?: number;
  maxSize?: number;
  padding?: number;
  gap?: number;
  gapRatio?: number;
  mode?: "fill" | "fit-container";
  scrollbarGuard?: number;
}

interface ResponsiveCellSizeResult {
  cellSize: number;
  gap: number;
}

/**
 * Hook untuk menghitung ukuran cell dan gap secara dinamis.
 * Jika rows/cols belum tersedia (null/undefined), hook akan mengembalikan nilai default/minSize.
 */
export default function useResponsiveCellSize({
  rows,
  cols,
  containerId = "game-container",
  minSize = 20,
  maxSize = 50,
  padding = 24,
  gap,
  gapRatio = 0,
  mode = "fit-container",
  scrollbarGuard = 2,
}: UseResponsiveCellSizeProps): ResponsiveCellSizeResult {
  const [layout, setLayout] = useState<ResponsiveCellSizeResult>({
    cellSize: minSize,
    gap: gap ?? 0,
  });

  useEffect(() => {
    if (rows == null || cols == null || rows <= 0 || cols <= 0) {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    const update = () => {
      const containerWidth = Math.max(
        0,
        container.clientWidth - padding - scrollbarGuard,
      );
      const containerHeight = Math.max(
        0,
        container.clientHeight - padding - scrollbarGuard,
      );

      let finalCellSize: number;
      let finalGap: number;

      if (gap !== undefined) {
        finalGap = gap;
        const totalGapWidth = Math.max(0, cols - 1) * finalGap;
        const totalGapHeight = Math.max(0, rows - 1) * finalGap;

        const cellFromWidth = (containerWidth - totalGapWidth) / cols;
        const cellFromHeight = (containerHeight - totalGapHeight) / rows;
        const idealSize = Math.min(cellFromWidth, cellFromHeight);

        finalCellSize =
          mode === "fill"
            ? Math.max(minSize, idealSize)
            : Math.max(minSize, Math.min(idealSize, maxSize));
      } else {
        const ratio = clamp(gapRatio, 0, 100);
        const rawCell = Math.min(
          containerWidth / (cols + ratio * (cols - 1)),
          containerHeight / (rows + ratio * (rows - 1)),
        );

        finalCellSize =
          mode === "fill"
            ? Math.max(minSize, rawCell)
            : Math.max(minSize, Math.min(rawCell, maxSize));

        finalGap = finalCellSize * ratio;
      }

      setLayout({
        cellSize: Math.floor(finalCellSize),
        gap: Math.floor(finalGap),
      });
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [
    containerId,
    rows,
    cols,
    minSize,
    maxSize,
    padding,
    gap,
    gapRatio,
    mode,
    scrollbarGuard,
  ]);

  return layout;
}
