"use client";

import { useEffect, useState } from "react";

interface UseResponsiveCellSizeProps {
  rows?: number;
  cols?: number;
  containerId?: string;
  minSize?: number;
  maxSize?: number;
  padding?: number;
  mode?: "fill" | "default";
}

export default function useResponsiveCellSize({
  rows,
  cols,
  containerId = "game-container",
  minSize = 20,
  maxSize = 50,
  padding = 24,
  mode = "default",
}: UseResponsiveCellSizeProps) {
  const [cellSize, setCellSize] = useState(minSize);

  useEffect(() => {
    const container = document.getElementById(containerId);

    if (!container || !rows || !cols) return;

    const update = () => {
      const containerWidth = Math.max(0, container.clientWidth - padding);
      const containerHeight = Math.max(0, container.clientHeight - padding);

      const cellFromWidth = Math.floor(containerWidth / cols);
      const cellFromHeight = Math.floor(containerHeight / rows);
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
  }, [containerId, rows, cols, minSize, maxSize, padding, mode]);

  return cellSize;
}
