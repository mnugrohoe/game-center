// app/games/sets/page.tsx
"use client";

import { useState } from "react";
import { PageLayout } from "@/shared/components";
import { TabItem } from "@/shared/types";
import SetSolver from "@/games/set/components/SetSolver";
import SetGenerator from "@/games/set/components/SetGenerator";

const TABS: TabItem[] = [
  { id: "solver", label: "Solver", icon: "◈" },
  { id: "generator", label: "Generator", icon: "✦" },
];

export default function SetsPage() {
  const [tab, setTab] = useState("solver");

  return (
    <PageLayout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      {tab === "solver" && <SetSolver />}
      {tab === "generator" && <SetGenerator />}
    </PageLayout>
  );
}
