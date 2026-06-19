// app/debug/grid/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GridWrapper,
  GridCell,
  GridInputCell,
  SwapPathOverlay,
  type DragPayload,
  type CellCoord,
  type CellRenderProps,
  type GapRenderProps,
  type PathSegment,
} from "@/shared/components/ui/Grid";
import {
  useGrid,
  cellKey,
  type GridInteractionMode,
  type SwapEndpointPair,
} from "@/shared/hooks/useGrid";
import { clamp } from "@/shared/algorithms";
import useResponsiveCellSize from "@/shared/hooks/useResponsiveCellSize";

// ── Config ───────────────────────────────────────────────────────────────────

const PUZZLE = { rows: 10, cols: 12 };
const GAP = 2;

const SWAP_PAIRS: SwapEndpointPair[] = [
  { start: { x: 0, y: 0 }, end: { x: 7, y: 7 }, color: "#f87171" }, // red
  { start: { x: 7, y: 0 }, end: { x: 0, y: 7 }, color: "#60a5fa" }, // blue
  { start: { x: 3, y: 1 }, end: { x: 3, y: 6 }, color: "#34d399" }, // green
  { start: { x: 1, y: 4 }, end: { x: 6, y: 4 }, color: "#fbbf24" }, // yellow
];

const MODES: GridInteractionMode[] = [
  "cell",
  "rect",
  "pathForward",
  "pathBacktracable",
  "line",
  "paint",
  "erase",
  "none",
];

type TabId = "selection" | "swap" | "input" | "gaps";

const TABS: { id: TabId; label: string }[] = [
  { id: "selection", label: "selection" },
  { id: "swap", label: "swap" },
  { id: "input", label: "input" },
  { id: "gaps", label: "gaps + clicks" },
];

// ── Sudoku-style input board state ───────────────────────────────────────────

type InputBoard = Record<string, string | number>;

// ── Page component ───────────────────────────────────────────────────────────

export default function GridDebugPage() {
  const [activeTab, setActiveTab] = useState<TabId>("selection");

  // ── shared grid hook ───────────────────────────────────────────────────
  // One hook instance reused across tabs keeps the debug panel consistent;
  // `changeMode` resets the generic selection slice whenever we leave a tab.
  const {
    rows,
    cols,
    interactionMode,
    gridState,
    selectedCellKeys,
    pathOrder,
    dragPreview,
    swapPaths,
    initSwapPaths,
    swapPointerDown,
    swapDrag,
    swapPointerUp,
    changeMode,
    reset,
    processCellInteraction,
    persistRectSelection,
    setDragCoords,
    handleClick,
    handleDoubleClick,
    handleContextMenu,
  } = useGrid({ rows: PUZZLE.rows, cols: PUZZLE.cols });

  // ── input-board state ───────────────────────────────────────────────────
  const [inputBoard, setInputBoard] = useState<InputBoard>({});

  // ── gaps-tab state: track which gaps have been toggled ───────────────────
  const [activeGaps, setActiveGaps] = useState<Set<string>>(new Set());
  const gapKey = (x: number, y: number, edge: "h" | "v") => `${edge}-${x}-${y}`;

  const { cellSize: CELL_SIZE } = useResponsiveCellSize({
    rows: PUZZLE.rows,
    cols: PUZZLE.cols,
    containerId: "gridArea",
  });
  const gridWidth = cols * CELL_SIZE + (cols - 1) * GAP;
  const gridHeight = rows * CELL_SIZE + (rows - 1) * GAP;

  // Register swap pairs once on mount.
  useEffect(() => {
    initSwapPaths(SWAP_PAIRS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switching tabs should put the shared hook into a sane mode for that tab,
  // and clear any leftover drag/selection state from the previous tab.
  function handleTabChange(tab: TabId) {
    setActiveTab(tab);
    reset();
    if (tab === "swap") changeMode("swap");
    else if (tab === "selection") changeMode("cell");
    else changeMode("none");
  }

  // ── input cell change ────────────────────────────────────────────────────
  const handleInputChange = (coord: CellCoord, value: string) => {
    setInputBoard((prev) => {
      const next = { ...prev };

      if (value === "") {
        delete next[cellKey(coord)];
      } else {
        const nextVal = clamp(Number(value), 1, PUZZLE.rows * PUZZLE.cols);
        next[cellKey(coord)] = nextVal;
      }

      return next;
    });
  };

  // ── drag coord extractor ────────────────────────────────────────────────
  const getCoords = (payload: DragPayload) => {
    const start =
      payload.mode === "rect" ? payload.startCoord : payload.currentCoord;
    return { start, current: payload.currentCoord };
  };

  // ── Swap endpoint lookup ────────────────────────────────────────────────
  const swapEndpointColors = new Map<string, string>();
  for (const p of SWAP_PAIRS) {
    swapEndpointColors.set(cellKey(p.start), p.color);
    swapEndpointColors.set(cellKey(p.end), p.color);
  }

  // ── renderCell: selection tab ────────────────────────────────────────────
  function renderSelectionCell({ coord, cellSize }: CellRenderProps) {
    const k = cellKey(coord);
    const isSelected = selectedCellKeys.has(k);
    const orderIndex = pathOrder.indexOf(k);
    const isHead = orderIndex === pathOrder.length - 1 && pathOrder.length > 0;

    return (
      <GridCell
        coord={coord}
        cellSize={cellSize}
        className="border border-zinc-700/60 transition-colors duration-75"
        style={{
          backgroundColor: isHead
            ? "rgba(251,191,36,0.7)"
            : isSelected
              ? "rgba(59,130,246,0.35)"
              : undefined,
          borderRadius: 3,
        }}
      >
        {isSelected && (
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
            }}
          >
            {orderIndex >= 0 ? orderIndex : ""}
          </span>
        )}
      </GridCell>
    );
  }

  // ── renderCell: swap tab ─────────────────────────────────────────────────
  function renderSwapCell({ coord, cellSize }: CellRenderProps) {
    const k = cellKey(coord);
    const epColor = swapEndpointColors.get(k);
    const isEndpoint = !!epColor;

    return (
      <GridCell
        coord={coord}
        cellSize={cellSize}
        className="border border-zinc-800/50"
        style={{ borderRadius: 3, backgroundColor: "#111" }}
      >
        {isEndpoint && (
          <div
            style={{
              width: "60%",
              height: "60%",
              borderRadius: "50%",
              backgroundColor: epColor,
              margin: "auto",
              marginTop: "20%",
              boxShadow: `0 0 8px ${epColor}`,
            }}
          />
        )}
      </GridCell>
    );
  }

  // ── renderCell: input tab ────────────────────────────────────────────────
  function renderInputCell({ coord, cellSize }: CellRenderProps) {
    const k = cellKey(coord);
    return (
      <GridInputCell
        coord={coord}
        cellSize={cellSize}
        value={inputBoard[k] ?? ""}
        max={999}
        type="number"
        onCellChange={handleInputChange}
        onFocus={(e) => e.target.select()}
        className="border border-zinc-700 bg-zinc-900 text-white text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 focus:bg-zinc-800"
        style={{ borderRadius: 3, caretColor: "transparent" }}
      />
    );
  }

  // ── renderCell + renderGap: gaps/clicks tab ──────────────────────────────
  // Demonstrates click / double-click / right-click acting on the same
  // generic activeCellKeys slice, plus gap overlays rendered between cells.
  function renderGapDemoCell({ coord, cellSize }: CellRenderProps) {
    const k = cellKey(coord);
    const isMarked = selectedCellKeys.has(k);

    return (
      <GridCell
        coord={coord}
        cellSize={cellSize}
        className="border border-zinc-700/50 flex items-center justify-center text-[10px] transition-colors"
        style={{
          backgroundColor: isMarked ? "rgba(168,85,247,0.35)" : "#0c0c0e",
          borderRadius: 3,
        }}
      >
        {isMarked ? "✕" : ""}
      </GridCell>
    );
  }

  function renderGapDemoGap({ gap, gapSize }: GapRenderProps) {
    const k = gapKey(gap.x, gap.y, gap.edge);
    const isActive = activeGaps.has(k);

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActiveGaps((prev) => {
            const next = new Set(prev);
            if (next.has(k)) next.delete(k);
            else next.add(k);
            return next;
          });
        }}
        className="w-full h-full transition-colors"
        style={{
          backgroundColor: isActive ? "#fbbf24" : "rgba(255,255,255,0.06)",
          borderRadius: gapSize > 2 ? 2 : 0,
        }}
        aria-label={`toggle gap ${k}`}
      />
    );
  }

  // ── Swap segments for SVG overlay ────────────────────────────────────────
  // `fullLength` is the Manhattan distance between each pair's fixed
  // endpoints + 1 — used as the denominator for the gradient's `pct`, so the
  // color ramp stays anchored to the eventual full path as it grows instead
  // of being re-stretched across whatever length is currently drawn.
  // const swapSegments: PathSegment[] = [...swapPaths.values()].map((p) => {
  //   const fullLength =
  //     Math.abs(p.endPoint.x - p.startPoint.x) +
  //     Math.abs(p.endPoint.y - p.startPoint.y) +
  //     1;

  //   return {
  //     order: p.order,
  //     colorMode: {
  //       type: "gradient",
  //       startColor: `${p.color}55`, // light tint at the start
  //       endColor: p.color, // full saturation at the (eventual) end
  //       pct: Math.min(1, p.order.length / fullLength),
  //     },
  //     showEndpoints: true,
  //   };
  // });
  const swapSegments: PathSegment[] = useMemo(
    () =>
      [...swapPaths.values()].map((p) => {
        const fullLength =
          Math.abs(p.endPoint.x - p.startPoint.x) +
          Math.abs(p.endPoint.y - p.startPoint.y) +
          1;
        // const fullLength = PUZZLE.cols * PUZZLE.rows;

        return {
          order: p.order,
          colorMode: {
            type: "gradient",
            startColor: p.color,
            endColor: p.color + "50",
            pct: Math.min(1, p.order.length / fullLength),
          },
          showEndpoints: true,
        };
      }),
    [swapPaths],
  );

  // ── shared pointer handlers (selection / swap tabs) ──────────────────────
  const pointerHandlers = {
    onPointerDown: (coord: CellCoord) => {
      if (interactionMode === "swap") {
        swapPointerDown(coord);
        return;
      }
      reset();
      setDragCoords(coord, coord);
      processCellInteraction(coord, coord);
    },
    onDragStart: (payload: DragPayload) => {
      if (interactionMode === "swap") {
        swapDrag(payload.currentCoord);
        return;
      }
      const { start, current } = getCoords(payload);
      setDragCoords(start, current);
      processCellInteraction(current, start);
    },
    onDrag: (payload: DragPayload) => {
      if (interactionMode === "swap") {
        swapDrag(payload.currentCoord);
        return;
      }
      const { start, current } = getCoords(payload);
      setDragCoords(start, current);
      processCellInteraction(current, start);
    },
    onDragEnd: (payload: DragPayload) => {
      if (interactionMode === "swap") {
        swapPointerUp();
        return;
      }
      const { start, current } = getCoords(payload);
      processCellInteraction(current, start);
      if (interactionMode === "rect") persistRectSelection();
      else setDragCoords(null, null);
    },
  };

  // ── UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-mono text-sm">
      {/* ── Left: grid area ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center w-full h-full justify-center gap-6 p-8">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === id
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div
          className="relative flex-1 w-full h-full overflow-hidden"
          id="gridArea"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative"
              style={{ width: gridWidth, height: gridHeight }}
            >
              {activeTab === "selection" && (
                <GridWrapper
                  rows={rows}
                  cols={cols}
                  cellSize={CELL_SIZE}
                  gap={GAP}
                  dragMode="rect"
                  renderCell={renderSelectionCell}
                  {...pointerHandlers}
                />
              )}

              {activeTab === "swap" && (
                <>
                  <GridWrapper
                    rows={rows}
                    cols={cols}
                    cellSize={CELL_SIZE}
                    gap={GAP}
                    dragMode="cell"
                    renderCell={renderSwapCell}
                    {...pointerHandlers}
                  />
                  <SwapPathOverlay
                    segments={swapSegments}
                    cellSize={CELL_SIZE}
                    gap={GAP}
                    thickness={0.4}
                  />
                </>
              )}

              {activeTab === "input" && (
                <GridWrapper
                  rows={rows}
                  cols={cols}
                  cellSize={CELL_SIZE}
                  gap={GAP}
                  disabled
                  renderCell={renderInputCell}
                />
              )}

              {activeTab === "gaps" && (
                <GridWrapper
                  rows={rows}
                  cols={cols}
                  cellSize={CELL_SIZE}
                  gap={14}
                  dragMode="cell"
                  disabled={false}
                  renderCell={renderGapDemoCell}
                  renderGap={renderGapDemoGap}
                  onClick={handleClick}
                  onDoubleClick={handleDoubleClick}
                  onContextMenu={handleContextMenu}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mode switcher — only for selection tab */}
        {activeTab === "selection" && (
          <div className="flex gap-1.5 flex-wrap justify-center">
            {MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => changeMode(mode)}
                className={`px-3 py-1 rounded text-xs border transition-colors ${
                  interactionMode === mode
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
                }`}
              >
                {mode}
              </button>
            ))}
            <button
              onClick={reset}
              className="px-3 py-1 rounded text-xs border border-zinc-700 text-zinc-400 hover:border-red-700 hover:text-red-400"
            >
              reset
            </button>
          </div>
        )}

        {/* Gaps tab hint */}
        {activeTab === "gaps" && (
          <div className="flex flex-col items-center gap-1 text-[11px] text-zinc-500 text-center max-w-md">
            <p>
              <span className="text-zinc-300">click</span> a cell to mark it ·{" "}
              <span className="text-zinc-300">double-click</span> to toggle ·{" "}
              <span className="text-zinc-300">right-click</span> to clear it
            </p>
            <p>
              amber gutters are independently clickable gaps — they never
              trigger cell clicks
            </p>
          </div>
        )}

        {/* Swap completion status */}
        {activeTab === "swap" && (
          <div className="flex gap-3 flex-wrap justify-center">
            {[...swapPaths.values()].map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span
                  className={p.isComplete ? "text-green-400" : "text-zinc-400"}
                >
                  {p.isComplete ? "✓" : `${p.order.length} cells`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: debug panel ──────────────────────────────────────────── */}
      <div className="w-72 flex flex-col border-l border-zinc-800 overflow-hidden">
        <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-widest">
          Debug
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* State summary */}
          <Section title="State">
            <Row label="mode" value={interactionMode} />
            <Row label="tab" value={activeTab} />
            <Row
              label="start"
              value={JSON.stringify(gridState.dragStartCoord)}
            />
            <Row
              label="current"
              value={JSON.stringify(gridState.dragCurrentCoord)}
            />
            <Row label="selected" value={`${selectedCellKeys.size} cells`} />
          </Section>

          {/* Live rect preview box */}
          {dragPreview && (
            <Section title="dragPreview">
              <Row label="x,y" value={`${dragPreview.x}, ${dragPreview.y}`} />
              <Row label="w×h" value={`${dragPreview.w} × ${dragPreview.h}`} />
            </Section>
          )}

          {/* Selection details */}
          {interactionMode !== "swap" && selectedCellKeys.size > 0 && (
            <Section title="Selected keys">
              <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap break-all leading-4">
                {[...selectedCellKeys].join("  ")}
              </pre>
            </Section>
          )}

          {/* Path order */}
          {pathOrder.length > 0 && (
            <Section title={`Path (${pathOrder.length})`}>
              <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap break-all leading-4">
                {pathOrder.join(" → ")}
              </pre>
            </Section>
          )}

          {/* Swap paths */}
          {activeTab === "swap" && (
            <Section title="Swap paths">
              {[...swapPaths.values()].map((p) => (
                <div key={p.id} className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-zinc-300">{p.id}</span>
                    <span className="text-zinc-600 ml-auto">
                      {p.isComplete ? "complete" : `${p.order.length}c`}
                    </span>
                  </div>
                  <pre className="text-[10px] text-zinc-500 whitespace-pre-wrap break-all leading-4">
                    {p.order.join(" → ")}
                  </pre>
                </div>
              ))}
            </Section>
          )}

          {/* Active gaps */}
          {activeTab === "gaps" && activeGaps.size > 0 && (
            <Section title={`Active gaps (${activeGaps.size})`}>
              <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap break-all leading-4">
                {[...activeGaps].join("  ")}
              </pre>
            </Section>
          )}

          {/* Input board values */}
          {activeTab === "input" && Object.keys(inputBoard).length > 0 && (
            <Section title="Input values">
              <div className="flex flex-col gap-0.5">
                {Object.entries(inputBoard)
                  .filter(([, v]) => v !== "")
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[11px]">
                      <span className="text-zinc-500">{k}</span>
                      <span className="text-zinc-200">{v}</span>
                    </div>
                  ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Debug panel sub-components ────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-3 py-2 border-b border-zinc-800/60">
      <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline gap-2 text-[11px] leading-5">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span className="text-zinc-200 text-right break-all">{value}</span>
    </div>
  );
}
