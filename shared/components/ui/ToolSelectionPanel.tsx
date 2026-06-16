"use client";

import { useState } from "react";
import { T } from "./tokens";
import { Divider } from "./primitive";
import GeneratorPanel, { GeneratorPanelProps } from "./GeneratorPanel";
import { SolverPanelGenerator, SolverPanelGeneratorProps } from "./SolverPanel";
import { ToolSelectionMode } from "@/shared/types";
import { StateProp } from "@/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToolSelectionPanelProps = {
  generator: GeneratorPanelProps;
  solver: SolverPanelGeneratorProps;
  mode: StateProp<ToolSelectionMode>;
};

// ---------------------------------------------------------------------------
// Tab Bar
// ---------------------------------------------------------------------------

function TabBar({
  active,
  color,
  onChange,
}: {
  active: ToolSelectionMode;
  color: string;
  onChange: (t: ToolSelectionMode) => void;
}) {
  const tabs: ToolSelectionMode[] = ["Generator", "Solver"];

  return (
    <div className="flex gap-2 p-2">
      {tabs.map((t) => {
        const isActive = active === t;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className="flex-1 p-2 text-sm text-center rounded-sm border cursor-pointer transition-colors duration-150"
            style={{
              fontFamily: T.font,
              color: isActive ? color : T.text2,
              borderColor: isActive ? color : T.border2,
              backgroundColor: isActive ? color + "20" : "transparent",
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ToolSelectionPanel({
  generator,
  solver,
  mode,
}: ToolSelectionPanelProps) {
  const [tab, setTab] = useState<ToolSelectionMode>("Generator");

  const { tiers, tier } = generator;
  const color = tiers[tier.value]?.color ?? T.accent;

  return (
    <>
      <TabBar active={tab} color={color} onChange={setTab} />
      <Divider />

      {tab === "Generator" && (
        <GeneratorPanel
          {...{
            ...generator,
            onGenerate: () => {
              mode.setValue("Generator");
              generator.onGenerate();
            },
          }}
        />
      )}

      {tab === "Solver" && (
        <SolverPanelGenerator
          {...{
            ...solver,
            onGenerate: (values) => {
              mode.setValue("Solver");
              solver.onGenerate(values);
            },
            color: solver.color ?? color,
          }}
        />
      )}
    </>
  );
}
