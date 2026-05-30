/**
 * shared/ui/ProgressRing.jsx
 *
 * SVG circular progress indicator.
 *
 * Props:
 *   pct    0–1    fill fraction
 *   color  hex    stroke colour
 *   size   px     diameter (default 28)
 *   stroke px     stroke width (default 2.5)
 */
import { T } from "./tokens";

export default function ProgressRing({
  pct = 0,
  color = T.accent,
  size = 28,
  stroke = 2.5,
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, pct)));
  const cx = size / 2,
    cy = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={T.border2}
        strokeWidth={stroke}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dashoffset .4s, stroke .3s" }}
      />
    </svg>
  );
}
