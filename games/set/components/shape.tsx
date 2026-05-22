// games/set/components/shape.tsx

import type { SVGProps } from "react";
import { COLOR_MAP } from "../lib/constants";
import { SetColor, SetSymbol, SetTexture } from "../lib/types";

interface ShapeProps extends SVGProps<SVGSVGElement> {
  symbol: SetSymbol;
  fill: string;
  stroke: string;
  stripeId: string;
  striped: boolean;
}

interface SymbolRendererProps extends SVGProps<SVGSVGElement> {
  symbol: SetSymbol;
  color: SetColor;
  texture: SetTexture;
  count?: 1 | 2 | 3;
}

/* -----------------------------
   DESIGN TOKENS
------------------------------ */

const STROKE = 4.5;
const STRIPE_STROKE = 5.5;
const STRIPE_SPACING = 12;

/* -----------------------------
   PATHS
------------------------------ */

// const xPathD =
// "m25 15 25 25 25-25 10 10-25 25 25 25-10 10-25-25-25 25-10-10 25-25-25-25Z";
const xPathD =
  "m25 8 25 25 25-25 20 20-25 25 25 25-20 20-25-25-25 25-20-20 25-25-25-25Z";

const hourGlassPathD =
  "M18 18h64c-4 10-16 20-26 30 10 10 22 24 26 38H18c4-14 16-28 26-38-10-10-22-20-26-30";

const diamondPoint = "50,6 94,50 50,94 6,50";

/* -----------------------------
   STRIPE PATTERN
------------------------------ */

function StripeDefs(id: string, stroke: string) {
  return (
    <defs>
      <pattern
        id={id}
        patternUnits="userSpaceOnUse"
        width={STRIPE_SPACING}
        height={STRIPE_SPACING}
        patternTransform="rotate(45)"
      >
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={STRIPE_SPACING}
          stroke={stroke}
          strokeWidth={STRIPE_STROKE}
          opacity="0.75"
        />
      </pattern>
    </defs>
  );
}

/* -----------------------------
   SHAPE
------------------------------ */

function Shape({
  symbol,
  fill,
  stroke,
  className,
  stripeId,
  striped,
}: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      {striped && StripeDefs(stripeId, stroke)}

      {symbol === "diamond" && (
        <polygon
          points={diamondPoint}
          fill={fill}
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
      )}

      {symbol === "hourglass" && (
        <path
          d={hourGlassPathD}
          fill={fill}
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
      )}

      {symbol === "x" && (
        <path
          d={xPathD}
          fill={fill}
          stroke={stroke}
          strokeWidth={6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

/* -----------------------------
   MAIN RENDERER
------------------------------ */

export default function SymbolRenderer({
  symbol,
  color,
  texture,
  count = 1,
  className = "w-full h-full overflow-visible",
}: SymbolRendererProps) {
  const stroke = COLOR_MAP[color];

  const stripeId = `stripe-${symbol}-${color}`;

  const fill =
    texture === "solid"
      ? stroke
      : texture === "striped"
        ? `url(#${stripeId})`
        : "transparent";

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <Shape
          key={`${symbol}-${texture}-${color}-${i}`}
          symbol={symbol}
          fill={fill}
          stroke={stroke}
          className={className}
          stripeId={stripeId}
          striped={texture === "striped"}
        />
      ))}
    </div>
  );
}
