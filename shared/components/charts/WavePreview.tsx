"use client";

interface WavePreviewProps {
  level: number;
  scorer?: (level: number) => number;
  halfWindow?: number;
  color?: string;
}

import { levelToDiffScore } from "@/shared/algorithms/difficulty";
import { T } from "../ui/tokens";

export function WavePreview({
  level,
  scorer = levelToDiffScore,
  halfWindow = 20,
  color,
}: WavePreviewProps) {
  const W = 100; // normalized coordinate system
  const H = 52;

  const total = halfWindow * 2;
  const points: string[] = [];

  for (let i = 0; i <= total; i++) {
    const lvl = Math.max(1, level - halfWindow + i);
    const score = scorer(lvl);

    const x = (i / total) * W;
    const y = H - 4 - ((score - 1) / 8) * (H - 8);

    points.push(`${x},${y}`);
  }

  const curScore = scorer(level);
  const curX = W / 2;
  const curY = H - 4 - ((curScore - 1) / 8) * (H - 8);

  const col = color ?? T.accent;

  return (
    <div className="w-full">
      {/* Y-axis labels */}

      <div className="pe-4 relative">
        <div
          className="absolute right-1 top-0 h-full flex flex-col justify-between text-[0.5rem]"
          style={{ color: col }}
        >
          <span>9</span>
          <span>5</span>
          <span>1</span>
        </div>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-full block"
          aria-label={`Difficulty wave centered on level ${level}`}
        >
          {/* Grid lines */}
          {[1, 3, 5, 7, 9].map((s) => {
            const y = H - 4 - ((s - 1) / 8) * (H - 8);
            return (
              <line
                key={s}
                x1={0}
                y1={y}
                x2={W}
                y2={y}
                stroke={`${col}70`}
                strokeWidth={0.5}
              />
            );
          })}

          {/* Area fill */}
          <polyline
            points={`0,${H} ${points.join(" ")} ${W},${H}`}
            fill={`${col}20`}
            stroke="none"
          />

          {/* Line */}
          <polyline
            points={points.join(" ")}
            fill="none"
            stroke={`${col}90`}
            strokeWidth={1}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Current marker */}
          <line
            x1={curX}
            y1={0}
            x2={curX}
            y2={H}
            stroke={`${col}90`}
            strokeWidth={0.8}
            strokeDasharray="2,2"
          />
          <circle
            cx={curX}
            cy={curY}
            r={1.5}
            fill={`${col}`}
            stroke="var(--color-bg)"
            strokeWidth={0.5}
          />
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1 font-mono text-[0.55rem] text-muted pe-4">
        <span style={{ color: `${col}90` }}>
          lvl {Math.max(1, level - halfWindow)}
        </span>
        <span style={{ color: col }}>← now →</span>
        <span style={{ color: `${col}90` }}>lvl {level + halfWindow}</span>
      </div>
    </div>
  );
}
