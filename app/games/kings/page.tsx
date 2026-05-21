"use client";

import { useState } from "react";
import { PageLayout } from "@/shared/components";
import { TabItem } from "@/shared/types";
import KingsGame from "@/games/kings/components/KingsGame";
import KingsSolver from "@/games/kings/components/KingsSolver";
import KingsGenerator from "@/games/kings/components/KingsGenerator";

const TABS: TabItem[] = [
  { id: "game", label: "Game", icon: "♛" },
  { id: "solver", label: "Solver", icon: "⚙" },
  { id: "generator", label: "Generator", icon: "✦" },
];

export default function KingsPage() {
  const [tab, setTab] = useState("game");

  return (
    <PageLayout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === "game" && <KingsGame />}
      {tab === "solver" && <KingsSolver />}
      {tab === "generator" && <KingsGenerator />}
    </PageLayout>
  );
}
