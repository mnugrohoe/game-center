import { GapCoord } from "@/shared/components/ui/Grid";
import { MamboConstraint } from "../types";

export function constraintToGapCoord(c: MamboConstraint): GapCoord | null {
  const { r1, c1, r2, c2 } = c;

  if (r1 === r2 && Math.abs(c1 - c2) === 1) {
    // horizontal neighbors -> gap vertikal (di antara kolom)
    const x = Math.min(c1, c2);
    return { x, y: r1, edge: "v" };
  }

  if (c1 === c2 && Math.abs(r1 - r2) === 1) {
    // vertical neighbors -> gap horizontal (di antara baris)
    const y = Math.min(r1, r2);
    return { x: c1, y, edge: "h" };
  }

  return null; // non-adjacent, invalid constraint
}
