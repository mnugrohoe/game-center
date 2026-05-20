"use client";

import { useState } from "react";
import KingsGame from "@/games/kings/components/KingsGame";
import KingsSolver from "@/games/kings/components/KingsSolver";
import KingsGenerator from "@/games/kings/components/KingsGenerator";
import { TabType, TabsProps } from "@/shared/types";
import PageLayout from "@/shared/component/PageLayout";

const TABS: TabsProps[] = [
  { id: "game", label: "Game", icon: "♛" },
  { id: "solver", label: "Solver", icon: "⚙" },
  { id: "generator", label: "Generator", icon: "✦" },
];

export default function KingsPage() {
  const [tab, setTab] = useState<TabType>("game");

  return (
    <PageLayout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === "game" && <KingsGame />}
      {tab === "solver" && <KingsSolver />}
      {tab === "generator" && <KingsGenerator />}
    </PageLayout>
  );
}
