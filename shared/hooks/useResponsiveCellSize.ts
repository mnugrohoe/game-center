"use client";

import { useEffect, useState } from "react";

interface UseResponsiveCellSizeProps {
  rows?: number;
  cols?: number;
  containerId?: string;
  minSize?: number;
  maxSize?: number;
  padding?: number;
  gap?: number;
  mode?: "fill" | "fit-container";
  scrollbarGuard?: number;
}

export default function useResponsiveCellSize({
  rows,
  cols,
  containerId = "game-container",
  minSize = 20,
  maxSize = 50,
  padding = 24,
  gap = 0,
  mode = "fit-container",
  scrollbarGuard = 2,
}: UseResponsiveCellSizeProps) {
  const [cellSize, setCellSize] = useState(minSize);

  useEffect(() => {
    const container = document.getElementById(containerId);

    if (!container || !rows || !cols) return;

    const update = () => {
      const containerWidth = Math.max(
        0,
        container.clientWidth - padding - scrollbarGuard,
      );
      const containerHeight = Math.max(
        0,
        container.clientHeight - padding - scrollbarGuard,
      );

      const totalGapWidth = Math.ceil(Math.max(0, cols - 1) * (gap * 1.1));
      const totalGapHeight = Math.ceil(Math.max(0, rows - 1) * (gap * 1.1));

      const cellFromWidth = Math.floor((containerWidth - totalGapWidth) / cols);
      const cellFromHeight = Math.floor(
        (containerHeight - totalGapHeight) / rows,
      );
      const idealSize = Math.min(cellFromWidth, cellFromHeight);

      if (mode === "fill") {
        setCellSize(Math.max(minSize, idealSize));
      } else {
        setCellSize(Math.max(minSize, Math.min(idealSize, maxSize)));
      }
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
    mode,
    scrollbarGuard,
  ]);

  return cellSize;
}
