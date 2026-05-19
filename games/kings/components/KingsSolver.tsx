"use client";

import { useSolver } from "../hooks/useSolver";
import { SolverToolbar } from "./solver/SolverToolbar";
import { SolverGrid } from "./solver/SolverGrid";
import { SolverControls } from "./solver/SolverControls";
import KingsTitle from "./shared/KingsTitle";

export default function KingsSolver() {
  const s = useSolver();

  return (
    <div
      className="min-h-screen flex flex-col items-center py-8 px-4 gap-5"
      style={{ background: "#0f0e0d", color: "#e8dcc8" }}
    >
      {/* Header */}
      <KingsTitle>DESIGN · PAINT · SOLVE</KingsTitle>

      {/* Step 1 + Step 2: toolbar (size picker + region painter) */}
      <div className="w-full max-w-xl">
        <SolverToolbar
          N={s.N}
          sizeInput={s.sizeInput}
          setSizeInput={s.setSizeInput}
          activeRegion={s.activeRegion}
          setActiveRegion={s.setActiveRegion}
          onBuildGrid={(n) => s.buildGrid(n)}
          onLoadExample={s.loadExample}
          onClearAll={() => s.buildGrid(s.N, false)}
          onFillFlood={s.fillFlood}
          onResetGrid={() => s.buildGrid(s.N, false)}
        />
      </div>

      {/* Paintable grid */}
      <SolverGrid
        N={s.N}
        grid={s.grid}
        solution={s.solution}
        painting={s.painting}
        erasing={s.erasing}
        setPainting={s.setPainting}
        setErasing={s.setErasing}
        onPaint={s.paintCell}
        onErase={s.eraseCell}
      />

      {/* Step 3 + export: controls */}
      <div className="w-full max-w-xl">
        <SolverControls
          status={s.status}
          solveLog={s.solveLog}
          winDetail={s.winDetail}
          showWin={s.showWin}
          hasSolution={s.hasSolution}
          use3x3={s.use3x3}
          setUse3x3={s.setUse3x3}
          solving={s.solving}
          exportText={s.exportText}
          onSolve={s.solve}
          onClearSolution={s.clearSolution}
          onValidate={s.validateRegions}
          onExportJSON={s.exportJSON}
          onCopyCode={s.copyCode}
        />
      </div>
    </div>
  );
}
