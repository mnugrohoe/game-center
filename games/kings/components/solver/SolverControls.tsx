"use client";

import type { StatusType } from "../../hooks/useSolver";
import HowToPlay from "../HowToPlay";

const STATUS_STYLE: Record<
  StatusType,
  { bg: string; border: string; color: string }
> = {
  edit: {
    bg: "rgba(212,152,15,0.08)",
    border: "rgba(212,152,15,0.3)",
    color: "#c8a840",
  },
  ok: {
    bg: "rgba(40,120,60,0.15)",
    border: "rgba(40,180,80,0.4)",
    color: "#6fcf97",
  },
  err: {
    bg: "rgba(180,50,50,0.15)",
    border: "rgba(220,80,80,0.4)",
    color: "#e07070",
  },
  solve: {
    bg: "rgba(80,80,200,0.15)",
    border: "rgba(120,120,255,0.4)",
    color: "#9090ff",
  },
};

const BTN = {
  fontFamily: "'Cinzel',serif",
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  padding: "7px 18px",
  borderRadius: "2px",
  cursor: "pointer",
} as const;

interface SolverControlsProps {
  status: { type: StatusType; msg: string };
  solveLog: string;
  winDetail: string;
  showWin: boolean;
  hasSolution: boolean;
  use3x3: boolean;
  setUse3x3: (v: boolean) => void;
  solving: boolean;
  exportText: string;
  onSolve: () => void;
  onClearSolution: () => void;
  onValidate: () => void;
  onExportJSON: () => void;
  onCopyCode: () => void;
}

export function SolverControls({
  status,
  solveLog,
  winDetail,
  showWin,
  hasSolution,
  use3x3,
  setUse3x3,
  solving,
  exportText,
  onSolve,
  onClearSolution,
  onValidate,
  onExportJSON,
  onCopyCode,
}: SolverControlsProps) {
  const ss = STATUS_STYLE[status.type];

  return (
    <div className="flex flex-col gap-4">
      {/* Status chip */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          style={{
            fontSize: "0.72rem",
            letterSpacing: "0.06em",
            padding: "4px 12px",
            borderRadius: "2px",
            border: `1px solid ${ss.border}`,
            background: ss.bg,
            color: ss.color,
          }}
        >
          {status.msg}
        </div>
        {showWin && (
          <div
            className="text-center px-6 py-2 rounded-sm"
            style={{
              background: "rgba(212,152,15,0.12)",
              border: "1px solid rgba(212,152,15,0.4)",
            }}
          >
            <div
              style={{
                fontFamily: "'Cinzel',serif",
                fontSize: "0.875rem",
                color: "#e4b43a",
              }}
            >
              ⚜ SOLUTION FOUND ⚜
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                marginTop: 2,
                color: "rgba(200,168,64,0.6)",
              }}
            >
              {winDetail}
            </div>
          </div>
        )}
        {solveLog && (
          <div
            style={{
              fontSize: "0.68rem",
              color: "rgba(200,168,64,0.55)",
              textAlign: "center",
              letterSpacing: "0.04em",
            }}
          >
            {solveLog}
          </div>
        )}
      </div>

      {/* Step 3 */}
      <div
        className="w-full p-4 rounded-sm"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "0.5px solid rgba(212,152,15,0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            color: "rgba(200,168,64,0.5)",
            letterSpacing: "0.12em",
            marginBottom: 12,
          }}
        >
          STEP 3 — SOLVE
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={onSolve}
            disabled={solving}
            style={{
              ...BTN,
              border: "1px solid rgba(212,152,15,0.7)",
              background: "rgba(212,152,15,0.22)",
              color: "#e4b43a",
              opacity: solving ? 0.5 : 1,
              cursor: solving ? "not-allowed" : "pointer",
            }}
          >
            {solving ? "Solving…" : "♛ Solve puzzle"}
          </button>
          <button
            onClick={onClearSolution}
            disabled={!hasSolution}
            style={{
              ...BTN,
              border: "1px solid rgba(212,152,15,0.35)",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
              opacity: !hasSolution ? 0.35 : 1,
              cursor: !hasSolution ? "not-allowed" : "pointer",
            }}
          >
            Clear solution
          </button>
          <button
            onClick={onValidate}
            style={{
              ...BTN,
              border: "1px solid rgba(212,152,15,0.35)",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
            }}
          >
            Validate regions
          </button>
          <label
            className="flex items-center gap-1.5 cursor-pointer"
            style={{ fontSize: "0.75rem", color: "rgba(200,168,64,0.6)" }}
          >
            <input
              type="checkbox"
              checked={use3x3}
              onChange={(e) => setUse3x3(e.target.checked)}
              style={{ accentColor: "#d4980f" }}
            />
            3×3 territory rule
          </label>
        </div>
        <HowToPlay />
      </div>

      {/* Export */}
      <div
        className="w-full p-4 rounded-sm"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "0.5px solid rgba(212,152,15,0.15)",
        }}
      >
        <div
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.65rem",
            color: "rgba(200,168,64,0.5)",
            letterSpacing: "0.12em",
            marginBottom: 12,
          }}
        >
          EXPORT
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onExportJSON}
            style={{
              ...BTN,
              border: "1px solid rgba(212,152,15,0.35)",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
            }}
          >
            Export JSON
          </button>
          <button
            onClick={onCopyCode}
            style={{
              ...BTN,
              border: "1px solid rgba(212,152,15,0.35)",
              background: "rgba(212,152,15,0.07)",
              color: "#c8a840",
            }}
          >
            Copy region array
          </button>
        </div>
        {exportText && (
          <pre
            className="mt-2 p-2 rounded overflow-x-auto"
            style={{
              background: "rgba(0,0,0,0.5)",
              color: "#9090cc",
              border: "0.5px solid rgba(100,100,200,0.2)",
              maxHeight: 120,
              fontSize: "0.68rem",
            }}
          >
            {exportText}
          </pre>
        )}
      </div>
    </div>
  );
}
