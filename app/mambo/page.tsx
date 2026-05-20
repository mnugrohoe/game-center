"use client";

import { useState } from "react";
import PageLayout from "@/shared/component/PageLayout";
import MamboGame from "@/games/mambo/components/game/MamboGame";
import MamboSolver from "@/games/mambo/components/solver/MamboSolver";
import MamboGenerator from "@/games/mambo/components/generator/MamboGenerator";

type Tab = "game" | "solver" | "generator";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "game", label: "Game", icon: "🎮" },
  { id: "solver", label: "Solver", icon: "🧠" },
  { id: "generator", label: "Generator", icon: "⚙" },
];

export default function MamboApp() {
  const [tab, setTab] = useState<Tab>("game");

  return (
    <PageLayout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === "game" && <MamboGame />}
      {tab === "solver" && <MamboSolver />}
      {tab === "generator" && <MamboGenerator />}
    </PageLayout>
  );
}
