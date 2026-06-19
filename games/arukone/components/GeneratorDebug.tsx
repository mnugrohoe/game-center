"use client";
import { useCallback, useMemo, useState } from "react";
import { arukoneGenerator } from "@/games/arukone/lib/generator";
import { ARUKONE_TIERS } from "@/games/arukone/lib/difficulty";
import { getRandomSeed } from "@/shared/algorithms";
import {
  CellKey,
  CellRenderProps,
  GapRenderProps,
  GridCell,
  GridWrapper,
} from "@/shared/components/ui/Grid";

const GAP = 12;
const CELLSIZE = 50;

export default function GeneratorDebug() {
  const [tier, setTier] = useState(0);
  const [seed, setSeed] = useState(99);

  const result = useMemo(
    () => arukoneGenerator.byTier(tier, seed),
    [tier, seed],
  );

  const { rows, cols, grid, solutionPath, walls } = result;

  const wallSet = useMemo(
    () =>
      new Set(
        walls.flatMap((w) => [
          `${w.r1}-${w.c1}-${w.r2}-${w.c2}`,
          `${w.r2}-${w.c2}-${w.r1}-${w.c1}`,
        ]),
      ),
    [walls],
  );

  const renderPuzzleCell = ({ coord, cellSize }: CellRenderProps) => {
    const key = `${coord.x}-${coord.y}`;
    const value = grid[key];

    const isClue = value !== "";

    return (
      <GridCell
        coord={coord}
        cellSize={cellSize}
        className={`
        rounded-lg
        border
        border-zinc-700
        overflow-hidden
        ${isClue ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-500"}
      `}
      >
        <div
          className="
          h-full
          w-full
          flex
          items-center
          justify-center
          font-bold
        "
          style={{
            fontSize: Math.floor(cellSize * 0.35),
          }}
        >
          {value}
        </div>
      </GridCell>
    );
  };

  const pathIndexMap = useMemo(
    () => new Map(solutionPath.map((p, i) => [p, i])),
    [solutionPath],
  );

  const renderSolutionCell = ({ coord, cellSize }: CellRenderProps) => {
    const key = `${coord.x}-${coord.y}` as CellKey;

    const step = pathIndexMap.get(key);

    return (
      <GridCell
        coord={coord}
        cellSize={cellSize}
        className="
        rounded-lg
        border
        border-zinc-700
        bg-emerald-700
        text-white
      "
      >
        <div
          className="
          h-full
          w-full
          flex
          items-center
          justify-center
          font-bold
        "
          style={{
            fontSize: Math.floor(cellSize * 0.28),
          }}
        >
          {step !== undefined ? step + 1 : ""}
        </div>
      </GridCell>
    );
  };

  const renderGap = useCallback(
    ({ gap, gapSize }: GapRenderProps) => {
      const r1 = gap.y;
      const c1 = gap.x;

      const r2 = gap.edge === "h" ? gap.y + 1 : gap.y;

      const c2 = gap.edge === "v" ? gap.x + 1 : gap.x;

      const hasWall = wallSet.has(`${r1}-${c1}-${r2}-${c2}`);

      return (
        <div
          className="rounded-full"
          style={{
            backgroundColor: hasWall ? "var(--color-amber-500)" : "transparent",
            width: gap.edge === "v" ? gapSize * 0.5 : "100%",
            height: gap.edge === "h" ? gapSize * 0.5 : "100%",
          }}
        />
      );
    },
    [wallSet],
  );

  return (
    <div className="p-8 bg-gray-950 min-h-screen text-gray-100">
      <h1 className="text-xl font-bold mb-6 text-blue-400">
        Arukone Generator Debugger
      </h1>

      {/* Kontrol UI */}
      <div className="flex flex-wrap gap-6 items-end mb-8 bg-gray-900 p-4 rounded-lg border border-gray-800">
        <div>
          <div className="text-xs text-gray-400 mb-2">Tier</div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTier((t) => Math.max(0, t - 1))}
              className="px-3 py-2 bg-gray-800 rounded"
            >
              −
            </button>

            <div className="w-40 text-center">
              <div className="font-bold">{ARUKONE_TIERS[tier].name}</div>

              <div className="text-xs text-gray-500">Tier {tier + 1}</div>
            </div>

            <button
              onClick={() =>
                setTier((t) => Math.min(ARUKONE_TIERS.length - 1, t + 1))
              }
              className="px-3 py-2 bg-gray-800 rounded"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-2">Seed</div>

          <div className="flex gap-2">
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="p-2 bg-gray-800 border border-gray-700 rounded w-32"
            />

            <button
              onClick={() => setSeed(getRandomSeed())}
              className="px-3 py-2 bg-blue-700 rounded"
            >
              Random
            </button>
          </div>
        </div>
      </div>

      {/* Grid Visualizer */}
      <h2 className="mb-2 text-lg font-bold">Puzzle Grid</h2>

      <GridWrapper
        rows={rows}
        cols={cols}
        gap={GAP}
        cellSize={CELLSIZE}
        renderCell={renderPuzzleCell}
        renderGap={renderGap}
      />
      <h2 className="mt-8 mb-2 text-lg font-bold">Solution Path</h2>

      <GridWrapper
        rows={rows}
        cols={cols}
        gap={GAP}
        cellSize={CELLSIZE}
        renderCell={renderSolutionCell}
        renderGap={renderGap}
      />
      <div className="mt-8 bg-gray-900 p-4 rounded border border-gray-800">
        <div className="font-bold mb-3">Puzzle Stats</div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            Size
            <div className="text-blue-400">
              {rows} × {cols}
            </div>
          </div>

          <div>
            Clues
            <div className="text-blue-400">{result.params.clueCount}</div>
          </div>

          <div>
            Walls
            <div className="text-blue-400">{walls.length}</div>
          </div>

          <div>
            Path Length
            <div className="text-blue-400">{solutionPath.length}</div>
          </div>
        </div>
      </div>

      {/* Raw Data */}
      <details className="mt-8 bg-gray-900 p-4 rounded border border-gray-800">
        <summary className="cursor-pointer font-semibold text-blue-300">
          Raw Data Output
        </summary>
        <pre className="mt-4 text-xs overflow-auto max-h-64 text-gray-400 bg-black p-4 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      </details>
    </div>
  );
}
