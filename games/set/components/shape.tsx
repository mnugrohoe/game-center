// games/set/components/shape.tsx

import type { SVGProps } from "react";
import { COLOR_MAP } from "../lib/constants";
import {
  ColorToken,
  CountToken,
  SymbolToken,
  TextureToken,
} from "../lib/types";

// Menambahkan size ke interface props eksisting
interface ShapeProps extends SVGProps<SVGSVGElement> {
  symbol: SymbolToken;
  fill: string;
  stroke: string;
  stripeId: string;
  striped: boolean;
  size?: React.CSSProperties["width"];
}

interface SymbolRendererProps extends Omit<SVGProps<SVGSVGElement>, "size"> {
  symbol: SymbolToken;
  color: ColorToken;
  texture: TextureToken;
  count?: CountToken;
  size?: React.CSSProperties["width"];
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

const lovePathD =
  "M50 84.4 C45 80 12 52.5 12 33.5 C12 20 22 10 35 10 C42.5 10 47.5 14 50 17.5 C52.5 14 57.5 10 65 10 C78 10 88 20 88 33.5 C88 52.5 55 80 50 84.4 Z";

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
  size,
}: ShapeProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ width: size, height: size }} // Mengunci rasio box 1:1 berdasarkan size
    >
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

      {symbol === "love" && (
        <path
          d={lovePathD}
          fill={fill}
          stroke={stroke}
          strokeWidth={STROKE}
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
  size = 48, // Default ukuran 48px jika parent tidak mendefinisikannya
  className = "overflow-visible shrink-0",
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
    <div
      className="flex items-center justify-center gap-1 w-full h-full"
      style={{ minHeight: size }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Shape
          key={`${symbol}-${texture}-${color}-${i}`}
          symbol={symbol}
          fill={fill}
          stroke={stroke}
          className={className}
          stripeId={stripeId}
          striped={texture === "striped"}
          size={size}
        />
      ))}
    </div>
  );
}
