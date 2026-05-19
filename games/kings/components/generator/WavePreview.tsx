"use client";

import { levelToDiffScore } from "../../lib/difficulty";

interface WavePreviewProps {
  level: number;
  windowSize?: number;
}

export function WavePreview({ level, windowSize = 40 }: WavePreviewProps) {
  const W = 320;
  const H = 52;
  const half = Math.floor(windowSize / 2);
  const points: string[] = [];

  for (let i = 0; i <= windowSize; i++) {
    const lvl = Math.max(1, level - half + i);
    const score = levelToDiffScore(lvl);
    const x = (i / windowSize) * W;
    const y = H - 4 - ((score - 1) / 8) * (H - 8);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const curScore = levelToDiffScore(level);
  const curX = W / 2;
  const curY = H - 4 - ((curScore - 1) / 8) * (H - 8);

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-full"
        style={{ display: "block", overflow: "visible" }}
      >
        {[1, 3, 5, 7, 9].map((s) => {
          const y = H - 4 - ((s - 1) / 8) * (H - 8);
          return (
            <line
              key={s}
              x1={0}
              y1={y}
              x2={W}
              y2={y}
              stroke="rgba(201,168,76,0.08)"
              strokeWidth={1}
            />
          );
        })}
        <polyline
          points={[`0,${H}`, ...points, `${W},${H}`].join(" ")}
          fill="rgba(201,168,76,0.06)"
          stroke="none"
        />
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="rgba(201,168,76,0.45)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={curX}
          cy={curY}
          r={4}
          fill="#c9a84c"
          stroke="#1a1608"
          strokeWidth={1.5}
        />
        <line
          x1={curX}
          y1={0}
          x2={curX}
          y2={H}
          stroke="rgba(201,168,76,0.25)"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          right: -28,
          top: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontSize: "0.55rem",
          color: "rgba(201,168,76,0.3)",
          fontFamily: "'Cinzel',serif",
        }}
      >
        <span>9</span>
        <span>5</span>
        <span>1</span>
      </div>
    </div>
  );
}
