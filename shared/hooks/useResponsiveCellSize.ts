"use client";

import { useEffect, useState } from "react";

interface UseResponsiveCellSizeProps {
  rows?: number;
  cols?: number;
  containerId?: string;
  minSize?: number;
  maxSize?: number;
  padding?: number;
}

export default function useResponsiveCellSize({
  rows,
  cols,
  containerId = "game-container",
  minSize = 20,
  maxSize = 50,
  padding = 24,
}: UseResponsiveCellSizeProps) {
  const [cellSize, setCellSize] = useState(minSize);

  useEffect(() => {
    const container = document.getElementById(containerId);

    if (!container || !rows || !cols) return;

    const update = () => {
      const containerWidth = container.clientWidth - padding;
      const containerHeight = container.clientHeight - padding;

      const cellFromWidth = Math.floor(containerWidth / cols);
      const cellFromHeight = Math.floor(containerHeight / rows);

      setCellSize(
        Math.max(minSize, Math.min(cellFromWidth, cellFromHeight, maxSize)),
      );
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);

    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerId, rows, cols, minSize, maxSize, padding]);

  return cellSize;
}
