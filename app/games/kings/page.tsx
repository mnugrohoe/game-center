"use client";

import { useState } from "react";
import KingsGame from "../../../games/kings/components/KingsGame";
import KingsSolver from "../../../games/kings/components/KingsSolver";
import KingsGenerator from "../../../games/kings/components/KingsGenerator";

type Tab = "game" | "solver" | "generator";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "game",      label: "Game",      icon: "♛" },
  { id: "solver",    label: "Solver",    icon: "⚙" },
  { id: "generator", label: "Generator", icon: "✦" },
];

export default function KingsPage() {
  const [tab, setTab] = useState<Tab>("game");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0f0e0d" }}>
      {/* Tab bar */}
      <nav
        className="sticky top-0 z-50 flex justify-center"
        style={{
          background: "rgba(15,14,13,0.95)",
          borderBottom: "1px solid rgba(212,152,15,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.7rem",
              letterSpacing: "0.1em",
              padding: "12px 28px",
              border: "none",
              borderBottom: tab === id ? "2px solid #d4980f" : "2px solid transparent",
              background: "transparent",
              color: tab === id ? "#d4980f" : "rgba(200,168,64,0.35)",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: "0.85rem" }}>{icon}</span>
            {label.toUpperCase()}
          </button>
        ))}
      </nav>

      <div className="flex-1">
        {tab === "game"      && <KingsGame />}
        {tab === "solver"    && <KingsSolver />}
        {tab === "generator" && <KingsGenerator />}
      </div>
    </div>
  );
}
