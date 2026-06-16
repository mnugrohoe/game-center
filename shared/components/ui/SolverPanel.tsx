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
import { GenerateBtn, GenerateBtnProps } from "./GeneratorPanel";

// ---------------------------------------------------------------------------
// Tipe & Interface Modul SolverPanel
// ---------------------------------------------------------------------------

/** Representasi struktur data baris metrik atau statistik pada panel. */
export interface StatItem {
  label: string;
  value: React.ReactNode;
}

/** Definisi konfigurasi untuk tombol aksi interaktif di bagian bawah panel. */
export interface ActionDef {
  label: string;
  icon?: ReactNode;
  color?: ColorType;
  disabled?: boolean;
  hidden?: boolean;
  onClick: () => void;
}

/** Properti untuk komponen kontainer utama `SolverPanel`. */
interface SolverPanelProps {
  panelLabel?: string;
  placedCount?: number;
  totalCount?: number;
  isSolving?: boolean;
  stats?: StatItem[];
  actions?: ActionDef[];
  children?: ReactNode;
}

/**
 * Komponen pembungkus panel solver yang menampung daftar item terpasang,
 * tombol aksi interaktif dinamis, serta grid statistik performa penyelesaian teka-teki.
 */
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
      <PanelHeader
        label={panelLabel}
        right={`${placedCount} / ${totalCount}`}
      />

      <PanelBody style={{ flex: 1 }}>{children}</PanelBody>

      <Divider />

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

      {stats.length > 0 && <StatsGrid stats={stats} />}

      <Divider />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tipe & Interface Modul SolverPanelGenerator
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

/** Record penampung nilai parameter aktif; diidentifikasi berdasarkan konfigurasi key parameter. */
export type ParamValuesType = number | string | boolean;
export type ParamValues = Record<string, ParamValuesType>;

/** Properti untuk komponen generator parameter `SolverPanelGenerator`. */
export type SolverPanelGeneratorProps = {
  color?: ColorType;
  paramsConfig: SolverGeneratorParamConfig[];
  onGenerate: (values: ParamValues) => void;
  /** * Fungsi Render Props untuk menyuntikkan UI builder elemen kustom (seperti dropdown kartu Game SETS).
   */
  customElement?: (
    values: ParamValues,
    onChange: (key: string, value: ParamValuesType) => void,
  ) => React.ReactNode;
  generateLabel?: GenerateBtnProps["label"];
  initialValues?: Partial<ParamValues>;
};

export function SolverPanelGenerator({
  color,
  paramsConfig,
  onGenerate,
  customElement,
  generateLabel,
  initialValues,
}: SolverPanelGeneratorProps) {
  const [paramValues, setParamValues] = useState<ParamValues>(() => {
    const init: ParamValues = { ...initialValues } as ParamValues;
    paramsConfig.forEach((p) => {
      if (init[p.key] === undefined) {
        init[p.key] = p.defaultValue ?? (p.type === "number" ? 0 : "");
      }
    });

    return init;
  });

  const handleChange = (key: string, value: ParamValuesType) => {
    setParamValues((prev) => ({ ...prev, [key]: value }));
  };

  const SolverColorHex = (color ?? T.accent2) as ColorType;

  return (
    <>
      <PanelBody>
        {customElement
          ? customElement(paramValues, handleChange)
          : paramsConfig.map((param, idx) => {
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
                      color={SolverColorHex}
                    />
                  ) : (
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      style={{
                        fontFamily: T.font,
                        borderColor: SolverColorHex + "20",
                        color: SolverColorHex,
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
        <GenerateBtn
          onClick={() => onGenerate(paramValues)}
          color={SolverColorHex}
          label={generateLabel}
        />
      </div>
    </>
  );
}
