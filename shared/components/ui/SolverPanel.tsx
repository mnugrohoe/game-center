import { ReactNode } from "react";

import { T } from "./tokens";
import {
  PanelHeader,
  PanelBody,
  Divider,
  StatsGrid,
  ActionBtn,
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

  isSolving?: boolean;

  stats?: StatItem[];
  actions?: ActionDef[];

  children?: ReactNode;
}

export default function SolverPanel({
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
    </>
  );
}

export function SolverPanelGenerator() {
  return <Divider />;
}
