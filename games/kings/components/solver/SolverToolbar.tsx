"use client";

import { REGION_FILL_SOLVER, REGION_BORDER_SOLVER } from "../../lib/utils";

interface SolverToolbarProps {
  N: number;
  sizeInput: number;
  setSizeInput: (n: number) => void;
  activeRegion: number;
  setActiveRegion: (r: number) => void;
  onBuildGrid: (n: number) => void;
  onLoadExample: () => void;
  onClearAll: () => void;
  onFillFlood: () => void;
  onResetGrid: () => void;
}

const BTN = {
  fontFamily: "'Cinzel',serif",
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  padding: "7px 18px",
  borderRadius: "2px",
  cursor: "pointer",
} as const;

export function SolverToolbar({
  N, sizeInput, setSizeInput, activeRegion, setActiveRegion,
  onBuildGrid, onLoadExample, onClearAll, onFillFlood, onResetGrid,
}: SolverToolbarProps) {
  const maxRegions = Math.min(N, 12);

  return (
    <div className="flex flex-col gap-5">
      {/* Step 1 — Grid size */}
      <div className="w-full p-4 rounded-sm"
        style={{ background: "rgba(0,0,0,0.3)", border: "0.5px solid rgba(212,152,15,0.15)" }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.65rem", color: "rgba(200,168,64,0.5)", letterSpacing: "0.12em", marginBottom: 12 }}>
          STEP 1 — SET GRID SIZE
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label style={{ fontSize: "0.75rem", color: "rgba(200,168,64,0.6)" }}>Size</label>
            <input
              type="range" min={3} max={12} step={1} value={sizeInput}
              style={{ width: 120, accentColor: "#d4980f" }}
              onChange={e => setSizeInput(+e.target.value)}
            />
            <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "#e4b43a", minWidth: 28 }}>{sizeInput}</span>
            <span style={{ fontSize: "0.75rem", color: "rgba(200,168,64,0.4)" }}>× {sizeInput}</span>
          </div>
          <button
            onClick={() => onBuildGrid(sizeInput)}
            style={{ ...BTN, border: "1px solid rgba(212,152,15,0.7)", background: "rgba(212,152,15,0.22)", color: "#e4b43a" }}
          >Build Grid</button>
          <button
            onClick={onLoadExample}
            style={{ ...BTN, border: "1px solid rgba(212,152,15,0.35)", background: "rgba(212,152,15,0.07)", color: "#c8a840" }}
          >Load Example</button>
        </div>
      </div>

      {/* Step 2 — Paint regions */}
      <div className="w-full p-4 rounded-sm"
        style={{ background: "rgba(0,0,0,0.3)", border: "0.5px solid rgba(212,152,15,0.15)" }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: "0.65rem", color: "rgba(200,168,64,0.5)", letterSpacing: "0.12em", marginBottom: 12 }}>
          STEP 2 — PAINT REGIONS
        </div>

        {/* Region palette */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span style={{ fontSize: "0.75rem", color: "rgba(200,168,64,0.5)" }}>Active:</span>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: maxRegions }, (_, i) => (
              <div
                key={i}
                onClick={() => setActiveRegion(i)}
                title={`Region ${i + 1}`}
                style={{
                  width: 28, height: 28, borderRadius: 3, cursor: "pointer",
                  transition: "transform 0.1s",
                  background: REGION_FILL_SOLVER[i % 12],
                  border: `2px solid ${i === activeRegion ? "#d4980f" : REGION_BORDER_SOLVER[i % 12]}`,
                  transform: i === activeRegion ? "scale(1.12)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.55)",
                }}
              >{i + 1}</div>
            ))}
          </div>
        </div>

        {/* Grid tools */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onClearAll}
            style={{ ...BTN, border: "1px solid rgba(212,152,15,0.35)", background: "rgba(212,152,15,0.07)", color: "#c8a840" }}
          >Clear all</button>
          <button
            onClick={onFillFlood}
            style={{ ...BTN, border: "1px solid rgba(212,152,15,0.35)", background: "rgba(212,152,15,0.07)", color: "#c8a840" }}
          >Auto-fill unassigned</button>
          <button
            onClick={onResetGrid}
            style={{ ...BTN, border: "1px solid rgba(180,60,60,0.5)", background: "rgba(180,60,60,0.08)", color: "#e07070" }}
          >Reset grid</button>
        </div>
        <div className="mt-2" style={{ fontSize: "0.7rem", color: "rgba(200,168,64,0.35)" }}>
          Click or drag to paint · Right-click to erase · Each region = 1 king
        </div>
      </div>
    </div>
  );
}
