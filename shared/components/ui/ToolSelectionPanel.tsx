"use client";

import { useState } from "react";
import { T } from "./tokens";
import { Divider } from "./primitive";
import GeneratorPanel, { Tier } from "./GeneratorPanel";
import {
  SolverPanelGenerator,
  ParamValues,
  SolverGeneratorParamConfig,
} from "./SolverPanel";
import { ToolSelectionMode } from "@/shared/types";
import { GeneratorMode, StateProp } from "@/shared/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props untuk mode Generator — diteruskan langsung ke GeneratorPanel */
export type GeneratorConfig = {
  tiers: Tier[];
  tier: StateProp<number>;
  mode: StateProp<GeneratorMode>;
  level: StateProp<number>;
  seed: StateProp<number>;
  onGenerate: () => void;
};

/**
 * Props untuk mode Solver — dua varian:
 *
 * - `"params"` → SolverPanelGenerator (form params + generate button)
 * - `"items"`  → SolverPanel klasik (item list, stats, action buttons)
 */
export type SolverConfig = {
  paramsConfig: SolverGeneratorParamConfig[];
  onGenerate: (values: ParamValues) => void;
};

export type ToolSelectionPanelProps = {
  generator: GeneratorConfig;
  solver: SolverConfig;
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
  const [tool, setTool] = useState<ToolSelectionMode>("Generator");

  const { tiers, tier } = generator;
  const color = tiers[tier.value]?.color ?? T.accent;

  return (
    <>
      <TabBar active={tool} color={color} onChange={setTool} />

      <Divider />

      {tool === "Generator" && (
        <GeneratorPanel
          tiers={generator.tiers}
          tier={generator.tier}
          mode={generator.mode}
          level={generator.level}
          seed={generator.seed}
          onGenerate={() => {
            mode.setValue("Generator");
            generator.onGenerate();
          }}
        />
      )}

      {tool === "Solver" && (
        <SolverPanelGenerator
          color={color}
          paramsConfig={solver.paramsConfig}
          onGenerate={(values) => {
            mode.setValue("Solver");
            solver.onGenerate(values);
          }}
        />
      )}
    </>
  );
}
