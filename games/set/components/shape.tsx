import type { SVGProps } from "react";
import { COLORS } from "../lib/constants";
import { SetColor, SetSymbol, SetTexture } from "../lib/types";

interface ShapeProps extends SVGProps<SVGSVGElement> {
  fill: string;
  stroke: string;
}

interface SymbolRendererProps extends SVGProps<SVGSVGElement> {
  symbol: SetSymbol;
  color: SetColor;
  texture: SetTexture;
}

export function Diamond({ fill, stroke, className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <polygon
        points="50,5 95,50 50,95 5,50"
        fill={fill}
        stroke={stroke}
        strokeWidth="8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Hourglass({ fill, stroke, className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <path
        d="
          M15 10
          H85
          L60 35
          L50 50
          L60 65
          L85 90
          H15
          L40 65
          L50 50
          L40 35
          Z
        "
        fill={fill}
        stroke={stroke}
        strokeWidth="8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function XShape({ fill, stroke, className }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <path
        d="
          M20 10
          L50 40
          L80 10
          L92 22
          L62 50
          L92 78
          L80 90
          L50 60
          L20 90
          L8 78
          L38 50
          L8 22
          Z
        "
        fill={fill}
        stroke={stroke}
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SymbolRenderer({
  symbol,
  color,
  texture,
  className = "w-full h-full overflow-visible",
}: SymbolRendererProps) {
  const stroke = COLORS[color];

  const fill =
    texture === "solid"
      ? stroke
      : texture === "striped"
        ? "url(#set-striped)"
        : "transparent";

  const shapeProps = {
    fill,
    stroke,
    className,
  };

  switch (symbol) {
    case "diamond":
      return <Diamond {...shapeProps} />;

    case "hourglass":
      return <Hourglass {...shapeProps} />;

    case "x":
      return <XShape {...shapeProps} />;

    default:
      return null;
  }
}
