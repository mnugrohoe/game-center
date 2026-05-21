"use client";
/**
 * shared/components/charts/WavePreview.tsx
 *
 * SVG sparkline showing the difficulty wave around a given level.
 * Game-agnostic — accepts a scorer function so Kings and Mambo
 * can both use it with their own difficulty curves.
 */

interface WavePreviewProps {
  /** Current / center level */
  level: number;
  /** Function that returns a score 1–9 for a given level */
  scorer?: (level: number) => number;
  /** How many levels to show on each side */
  halfWindow?: number;
}

// Default scorer — imported lazily so tree-shaking keeps it out if unused.
import { levelToDiffScore } from "@/shared/algorithms/difficulty";

export function WavePreview({
  level,
  scorer = levelToDiffScore,
  halfWindow = 20,
}: WavePreviewProps) {
  const W = 320,
    H = 52;
  const total = halfWindow * 2;
  const points: string[] = [];

  for (let i = 0; i <= total; i++) {
    const lvl = Math.max(1, level - halfWindow + i);
    const score = scorer(lvl);
    const x = (i / total) * W;
    const y = H - 4 - ((score - 1) / 8) * (H - 8);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const curScore = scorer(level);
  const curX = W / 2;
  const curY = H - 4 - ((curScore - 1) / 8) * (H - 8);

  return (
    <div className="relative w-full">
      {/* Y-axis labels */}
      <div className="absolute -right-6 top-0 bottom-0 flex flex-col justify-between font-mono text-[0.5rem] text-gold-500">
        <span>9</span>
        <span>5</span>
        <span>1</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block overflow-visible"
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
              stroke="var(--color-gold-700)"
              strokeWidth={1}
            />
          );
        })}

        {/* Area fill */}
        <polyline
          points={[`0,${H}`, ...points, `${W},${H}`].join(" ")}
          fill="var(--color-gold-700)"
          stroke="none"
        />

        {/* Line */}
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke="var(--color-gold-500)"
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Current level marker */}
        <line
          x1={curX}
          y1={0}
          x2={curX}
          y2={H}
          stroke="var(--color-gold-600)"
          strokeWidth={1}
          strokeDasharray="3,3"
        />
        <circle
          cx={curX}
          cy={curY}
          r={4}
          fill="var(--color-gold-200)"
          stroke="var(--color-bg)"
          strokeWidth={1.5}
        />
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1 font-mono text-[0.55rem] text-muted">
        <span>lvl {Math.max(1, level - halfWindow)}</span>
        <span className="text-gold-300">← now →</span>
        <span>lvl {level + halfWindow}</span>
      </div>
    </div>
  );
}
