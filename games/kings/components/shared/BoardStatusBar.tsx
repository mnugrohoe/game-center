"use client";
/**
 * games/kings/components/shared/BoardStatusBar.tsx
 * Uses shared StatusChip — no local chip definitions.
 */
import { StatusChip } from "@/shared/components";
import { useKingsBoardCtx } from "../../context/KingsBoardContext";
import { formatTime } from "@/games/kings/lib";
import type { RegionMetrics } from "@/games/kings/lib";

interface BoardStatusBarProps {
  metrics?: RegionMetrics | null;
}

export function BoardStatusBar({ metrics }: BoardStatusBarProps) {
  const { N, numKings, hasAnyConflict, elapsed } = useKingsBoardCtx();

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {/* King count */}
      <StatusChip variant="gold">
        {numKings} / {N}
      </StatusChip>

      {/* Conflict state */}
      {numKings > 0 && (
        <StatusChip variant={hasAnyConflict ? "err" : "ok"}>
          {hasAnyConflict ? "⚠ Conflict" : "✓ No conflict"}
        </StatusChip>
      )}

      {/* Timer */}
      <StatusChip variant="ghost" className="tabular-nums">
        {formatTime(elapsed)}
      </StatusChip>

      {/* Optional region metrics */}
      {metrics && (
        <>
          <StatusChip
            variant="ghost"
            title="Region size spread — higher = more unequal"
          >
            size σ {(metrics.sizeCV * 100).toFixed(0)}%
          </StatusChip>
          <StatusChip
            variant="ghost"
            title="Shape compactness — lower = spikier shapes"
          >
            shape {(metrics.compactnessScore * 100).toFixed(0)}%
          </StatusChip>
        </>
      )}
    </div>
  );
}
