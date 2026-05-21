/**
 * games/mambo/components/shared/MamboTitle.tsx
 * Thin wrapper around shared GameTitle — keeps Mambo's icon/name consistent.
 */
import { ReactNode } from "react";
import { GameTitle } from "@/shared/components";

export function MamboTitle({ children }: { children?: ReactNode }) {
  return <GameTitle title="mambo">{children}</GameTitle>;
}
