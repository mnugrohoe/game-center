"use client";

import { useKingsBoardCtx } from "../../context/KingsBoardContext";
import { formatTime } from "../../lib/utils";
import type { RegionMetrics } from "../../lib/utils";

interface BoardStatusBarProps {
  metrics?: RegionMetrics | null;
}

export function BoardStatusBar({ metrics }: BoardStatusBarProps) {
  const { N, numKings, hasAnyConflict, elapsed } = useKingsBoardCtx();

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      <span style={{
        fontFamily: "'Cinzel',serif", fontSize: "0.62rem",
        padding: "3px 10px", border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "2px", background: "rgba(201,168,76,0.07)", color: "#c9a84c",
      }}>
        {numKings} / {N}
      </span>

      {numKings > 0 && (
        <span style={{
          fontSize: "0.62rem", padding: "3px 10px",
          border: `1px solid ${hasAnyConflict ? "rgba(200,70,70,0.4)" : "rgba(70,180,100,0.4)"}`,
          borderRadius: "2px",
          background: hasAnyConflict ? "rgba(200,70,70,0.08)" : "rgba(70,180,100,0.08)",
          color: hasAnyConflict ? "#ee8888" : "#7ed4a0",
        }}>
          {hasAnyConflict ? "⚠ Conflict" : "✓ No conflict"}
        </span>
      )}

      <span style={{
        fontSize: "0.62rem", padding: "3px 10px",
        border: "1px solid rgba(201,168,76,0.15)",
        borderRadius: "2px", color: "#7a6840",
        fontVariantNumeric: "tabular-nums",
      }}>
        {formatTime(elapsed)}
      </span>

      {metrics && (
        <>
          <span
            title="Region size spread — higher = more unequal sizes"
            style={{ fontSize: "0.58rem", padding: "3px 8px", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "2px", color: "#5a4820", cursor: "help" }}
          >
            size σ {(metrics.sizeCV * 100).toFixed(0)}%
          </span>
          <span
            title="Shape compactness — lower = spikier shapes"
            style={{ fontSize: "0.58rem", padding: "3px 8px", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "2px", color: "#5a4820", cursor: "help" }}
          >
            shape {(metrics.compactnessScore * 100).toFixed(0)}%
          </span>
        </>
      )}
    </div>
  );
}
