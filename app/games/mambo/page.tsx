"use client";

import { useState } from "react";
import { PageLayout } from "@/shared/components";
import { TabItem } from "@/shared/types";
import MamboGame from "@/games/mambo/components/game/MamboGame";
import MamboSolver from "@/games/mambo/components/solver/MamboSolver";
import MamboGenerator from "@/games/mambo/components/generator/MamboGenerator";

const TABS: TabItem[] = [
  { id: "game", label: "Game", icon: "☀" },
  { id: "solver", label: "Solver", icon: "⚙" },
  { id: "generator", label: "Generator", icon: "✦" },
];

export default function MamboPage() {
  const [tab, setTab] = useState("game");

  return (
    <PageLayout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === "game" && <MamboGame />}
      {tab === "solver" && <MamboSolver />}
      {tab === "generator" && <MamboGenerator />}
    </PageLayout>
  );
}
