"use client";

import { ReactNode, useState, Fragment } from "react";
import { T } from "./tokens";
import {
  PanelHeader,
  PanelBody,
  Divider,
  StatsGrid,
  ActionBtn,
  SectionLabel,
  InputNumberRow,
} from "./primitive";
import { ColorType, InputType } from "@/shared/types";
import { GenerateBtn } from "./GeneratorPanel";

// ---------------------------------------------------------------------------
// SolverPanel — item list + action buttons + stats
// ---------------------------------------------------------------------------

export interface StatItem {
  label: string;
  value: React.ReactNode;
}

export interface ActionDef {
  label: string;
  icon?: ReactNode;
  color?: ColorType;
  disabled?: boolean;
  hidden?: boolean;
  onClick: () => void;
}

interface SolverPanelProps {
  panelLabel?: string;
  placedCount?: number;
  totalCount?: number;
  isSolving?: boolean;
  stats?: StatItem[];
  actions?: ActionDef[];
  children?: ReactNode;
}

export function SolverPanel({
  panelLabel = "Items",
  placedCount = 0,
  totalCount = 0,
  isSolving = false,
  stats = [],
  actions = [],
  children,
}: SolverPanelProps) {
  return (
    <>
      {/* Header: label + counter */}
      <PanelHeader
        label={panelLabel}
        right={`${placedCount} / ${totalCount}`}
      />

      {/* Scrollable item list */}
      <PanelBody style={{ flex: 1 }}>{children}</PanelBody>

      <Divider />

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
          padding: 12,
        }}
      >
        {actions
          .filter((a) => !a.hidden)
          .map((a, i) => (
            <ActionBtn
              key={i}
              color={a.color ?? T.text2}
              icon={a.icon}
              disabled={a.disabled ?? false}
              onClick={a.onClick}
            >
              {a.label}
              {a.label === "Auto-Solve" && isSolving && (
                <span style={{ marginLeft: "auto", fontSize: 10 }}>…</span>
              )}
            </ActionBtn>
          ))}
      </div>

      <Divider />

      {/* Stats grid */}
      {stats.length > 0 && <StatsGrid stats={stats} />}

      <Divider />
    </>
  );
}

// ---------------------------------------------------------------------------
// SolverPanelGenerator — form params + generate button
// ---------------------------------------------------------------------------

export type ParamType = "number" | "string";

export interface BaseParamConfig extends InputType {
  key: string;
  label: string;
  type: ParamType;
}

export interface NumberParamConfig extends BaseParamConfig {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface StringParamConfig extends BaseParamConfig {
  type: "string";
  defaultValue?: string;
}

export type SolverGeneratorParamConfig = NumberParamConfig | StringParamConfig;

/** Record nilai params saat ini; key = ParamConfig.key */
export type ParamValues = Record<string, number | string>;

export type SolverPanelGeneratorProps = {
  color?: ColorType;
  paramsConfig: SolverGeneratorParamConfig[];
  onGenerate: (values: ParamValues) => void;
};

export function SolverPanelGenerator({
  color,
  paramsConfig,
  onGenerate,
}: SolverPanelGeneratorProps) {
  // Inisialisasi state dari defaultValue config
  const [paramValues, setParamValues] = useState<ParamValues>(() => {
    const init: ParamValues = {};
    paramsConfig.forEach((p) => {
      init[p.key] = p.defaultValue ?? (p.type === "number" ? 0 : "");
    });
    return init;
  });

  const handleChange = (key: string, value: number | string) => {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <PanelBody>
        {paramsConfig.map((param, idx) => {
          const isNumber = param.type === "number";
          const current = paramValues[param.key];

          return (
            <Fragment key={param.key}>
              {idx > 0 && (
                <Divider style={{ marginTop: 20, marginBottom: 10 }} />
              )}

              <SectionLabel>{param.label}</SectionLabel>

              {isNumber ? (
                <InputNumberRow
                  value={current as number}
                  setValue={(val) => handleChange(param.key, val)}
                  min={(param as NumberParamConfig).min}
                  max={(param as NumberParamConfig).max}
                  step={(param as NumberParamConfig).step}
                  color={color}
                />
              ) : (
                <input
                  type="text"
                  className="w-full p-2 border rounded text-sm"
                  style={{
                    fontFamily: T.font,
                    borderColor: T.border2,
                    color: T.text,
                  }}
                  value={current as string}
                  onChange={(e) => handleChange(param.key, e.target.value)}
                />
              )}
            </Fragment>
          );
        })}
      </PanelBody>

      <div className="p-4">
        <GenerateBtn onClick={() => onGenerate(paramValues)} color={color} />
      </div>
    </>
  );
}
