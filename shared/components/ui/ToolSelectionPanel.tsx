"use client";
import { useState } from "react";
import GeneratorPanel, { GeneratorPanelProps } from "./GeneratorPanel";
import { T } from "./tokens";
import { Divider } from "./primitive";
import { SolverPanelGenerator } from "./SolverPanel";
import { ToolSelectionMode } from "@/shared/types";

type ToolSelectionPanelProps = GeneratorPanelProps;

export default function ToolSelectionPanel({
  tiers,
  tierIdx,
  setTier,
  seed,
  onChangeSeed,
  onGenerate,
  params,
  mode,
  setMode,
  level,
  setLevel,
}: ToolSelectionPanelProps) {
  const [tool, setTool] = useState<ToolSelectionMode>("Generator");
  const color = tiers[tierIdx].color ?? T.accent;
  return (
    <>
      <div className="flex gap-2 p-2">
        {["Generator", "Solver"].map((t) => (
          <button
            key={t}
            onClick={() => setTool(t as "Generator" | "Solver")}
            className="flex-1 p-2 text-sm text-center rounded-sm border cursor-pointer"
            style={{
              color: tool === t ? color : T.text2,
              borderColor: tool === t ? color : T.border2,
              backgroundColor: tool === t ? color + "20" : "transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <Divider />
      {tool === "Generator" && (
        <GeneratorPanel
          {...{
            tiers,
            tierIdx,
            setTier,
            seed,
            onChangeSeed,
            onGenerate,
            params,
            mode,
            setMode,
            level,
            setLevel,
          }}
        />
      )}
      {tool === "Solver" && <SolverPanelGenerator />}
    </>
  );
}
