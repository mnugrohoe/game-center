"use client";

import {
  CellRenderProps,
  GridInputCell,
  GridWrapper,
} from "@/shared/components/ui/Grid";
// import { cellKey } from "@/shared/hooks/useGrid";
import useResponsiveCellSize from "@/shared/hooks/useResponsiveCellSize";

export default function ShikakuSolverGrid() {
  const puzzle = { rows: 10, cols: 12 };
  const GAP = 2;

  const CELL_SIZE = useResponsiveCellSize({
    rows: puzzle.rows,
    cols: puzzle.cols,
    containerId: "gridArea",
  });

  return (
    <GridWrapper
      rows={puzzle.rows}
      cols={puzzle.cols}
      cellSize={CELL_SIZE}
      gap={GAP}
      disabled
      renderCell={({ coord, cellSize }: CellRenderProps) => {
        // const k = cellKey(coord);
        return (
          <GridInputCell
            coord={coord}
            cellSize={cellSize}
            // value={inputBoard[k] ?? ""}
            max={999}
            type="number"
            // onCellChange={handleInputChange}
            onFocus={(e) => e.target.select()}
            className="border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 focus:bg-zinc-800"
            style={{ borderRadius: 3, caretColor: "transparent" }}
          />
        );
      }}
    />
  );
}
