import { ReactNode } from "react";

import { T } from "./tokens";
import {
  PanelHeader,
  PanelBody,
  Divider,
  StatsGrid,
  ActionBtn,
  ProgressRing,
} from "./primitive";
import { ColorType } from "@/shared/types";

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
  accentColor?: ColorType;

  isSolving?: boolean;
  hasSolution?: boolean;
  showSolution?: boolean;

  stats?: StatItem[];
  actions?: ActionDef[];

  children?: ReactNode;
}

export default function SolverPanel({
  panelLabel = "Items",
  placedCount = 0,
  totalCount = 0,
  accentColor = T.accent,
  isSolving = false,
  hasSolution = false,
  showSolution = false,
  stats = [],
  actions = [],
  children,
}: SolverPanelProps) {
  const pct = totalCount > 0 ? placedCount / totalCount : 0;

  return (
    <>
      {/* Header */}
      <PanelHeader
        label={panelLabel}
        right={`${placedCount} / ${totalCount}`}
      />

      {/* Item list */}
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
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                  }}
                >
                  …
                </span>
              )}
            </ActionBtn>
          ))}
      </div>

      <Divider />

      {/* Stats */}
      {stats.length > 0 && <StatsGrid stats={stats} />}

      <Divider />

      {/* Progress row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 12px 12px",
        }}
      >
        <ProgressRing pct={pct} color={accentColor} />

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.text2,
          }}
        >
          {placedCount}/{totalCount}
        </span>

        {isSolving && (
          <span
            style={{
              fontSize: 10,
              color: "#a78bfa",
              marginLeft: "auto",
            }}
          >
            Solving…
          </span>
        )}

        {hasSolution && !isSolving && !showSolution && (
          <span
            style={{
              fontSize: 10,
              color: T.green,
              marginLeft: "auto",
            }}
          >
            Ready
          </span>
        )}
      </div>
    </>
  );
}
