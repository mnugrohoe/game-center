/**
 * shared/ui/primitives.jsx
 *
 * Small, composable primitives used by every game panel.
 * Each one is a pure presentational component — zero game logic.
 *
 * Exports:
 *   PanelHeader        — labelled header row for a panel column
 *   PanelBody          — scrollable body with styled scrollbar
 *   SectionLabel       — ALL CAPS micro-label divider
 *   Divider            — 1px horizontal rule
 *   StatCard           — single metric card (label + big value)
 *   StatsGrid          — 2-column grid of StatCards
 *   ActionBtn          — full-width action button with hover tint
 *   ParamRow           — labelled value row with fill-bar
 *   ProgressRing       — (re-exported from ProgressRing.jsx)
 *   SolverStatusBar    — animated status banner for async solver
 *   SolveBanner        — green "SOLVED!" celebration strip
 *   Spinner            — inline CSS spinner
 */

import { useState } from "react";
import { T } from "./tokens";
import ProgressRing from "./ProgressRing";
import { ColorType, StyleType } from "@/shared/types";
import { StatItem } from "./SolverPanel";

export { ProgressRing };

// ─────────────────────────────────────────────────────────────────────────────
// PanelHeader
// ─────────────────────────────────────────────────────────────────────────────
export function PanelHeader({
  label,
  right,
}: {
  label: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: "14px 16px 10px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 3,
          color: T.text3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {right && <span style={{ fontSize: 10, color: T.text3 }}>{right}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PanelBody
// ─────────────────────────────────────────────────────────────────────────────
export function PanelBody({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleType;
}) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: 12,
        ...style,
      }}
    >
      <style>{`
        .panel-scroll::-webkit-scrollbar { width: 3px }
        .panel-scroll::-webkit-scrollbar-thumb { background: ${T.border2}; border-radius: 2px }
      `}</style>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionLabel
// ─────────────────────────────────────────────────────────────────────────────
export function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleType;
}) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 2.5,
        color: T.text3,
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 4,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Divider
// ─────────────────────────────────────────────────────────────────────────────
export function Divider({ style }: { style?: StyleType }) {
  return (
    <div
      style={{
        height: 1,
        background: T.border,
        margin: "0 12px",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────────────────────────────────────────
export function StatCard({ label, value }: StatItem) {
  return (
    <div
      style={{
        background: T.bg3,
        borderRadius: T.radius,
        padding: "10px 10px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 2,
          color: T.text3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 800,
          color: T.text,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatsGrid
// ─────────────────────────────────────────────────────────────────────────────
/** stats = [{ label, value }, ...] */
export function StatsGrid({
  stats,
  style,
}: {
  stats: StatItem[];
  style?: StyleType;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        padding: 12,
        ...style,
      }}
    >
      {stats.map((s) => (
        <StatCard key={s.label} label={s.label} value={s.value} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ActionBtn
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Props:
 *   color    hex   — border + text colour
 *   icon     node  — leading icon/emoji
 *   disabled bool
 *   onClick  fn
 *   children label text
 */
export function ActionBtn({
  color = T.text2,
  icon,
  disabled,
  onClick,
  children,
  style,
}: {
  color: ColorType;
  icon?: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: StyleType;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        padding: "9px 12px",
        borderRadius: T.radius,
        border: `1px solid ${color}55`,
        background: hov && !disabled ? `${color}18` : "transparent",
        fontFamily: T.font,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 2,
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: disabled ? T.text3 : color,
        transition: "all .15s",
        opacity: disabled ? 0.45 : 1,
        ...style,
      }}
    >
      {icon && <span style={{ fontSize: 13 }}>{icon}</span>}
      {children}
    </button>
  );
}

export interface ParamRowProps {
  label: string;
  display: React.ReactNode;
  pct: number;
  color: ColorType;
}
// ─────────────────────────────────────────────────────────────────────────────
// ParamRow
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Props:
 *   label   string
 *   display string | number  — right-aligned value
 *   pct     0–1              — fill bar percentage
 *   color   hex              — fill bar colour
 */
export function ParamRow({
  label,
  display,
  pct,
  color = T.accent,
}: ParamRowProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "7px 0",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div>
        <div style={{ fontSize: 10, color: T.text2, letterSpacing: 1 }}>
          {label}
        </div>
        <div
          style={{
            width: 64,
            height: 4,
            background: T.bg4,
            borderRadius: 2,
            overflow: "hidden",
            marginTop: 3,
          }}
        >
          <div
            style={{
              width: `${Math.round(Math.max(0, Math.min(1, pct)) * 100)}%`,
              height: "100%",
              background: color,
              borderRadius: 2,
              transition: "width .3s",
            }}
          />
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────
export function Spinner({ color = T.accent }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 12,
        height: 12,
        border: `1.5px solid ${T.border2}`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SolverStatusBar
// ─────────────────────────────────────────────────────────────────────────────
/**
 * status: null | "solving" | "done" | "error"
 */
export function SolverStatusBar({
  status,
  message,
}: {
  status: null | "solving" | "done" | "error";
  message: string;
}) {
  if (!status) return null;
  const color =
    status === "done" ? T.green : status === "error" ? T.red : "#a78bfa";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        border: `1px solid ${color}44`,
        borderRadius: T.radius,
        fontSize: 11,
        color,
        width: "100%",
        maxWidth: 560,
        boxSizing: "border-box",
      }}
    >
      {status === "solving" && <Spinner color={color} />}
      {status === "done" && <span>✓</span>}
      {status === "error" && <span>✕</span>}
      <span>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SolveBanner
// ─────────────────────────────────────────────────────────────────────────────
export function SolveBanner({
  show,
  timeLabel,
  onNext,
}: {
  show: boolean;
  timeLabel?: string;
  onNext: () => void;
}) {
  if (!show) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        maxWidth: 560,
        boxSizing: "border-box",
        background: `${T.green}12`,
        border: `1px solid ${T.green}44`,
        borderRadius: T.radius2,
        padding: "12px 18px",
        color: T.green,
      }}
    >
      <span style={{ fontSize: 22 }}>🎉</span>
      <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: 2 }}>
        SOLVED!
      </span>
      {timeLabel && (
        <span style={{ fontSize: 13, opacity: 0.7 }}>{timeLabel}</span>
      )}
      {onNext && (
        <button
          onClick={onNext}
          style={{
            marginLeft: "auto",
            padding: "6px 14px",
            borderRadius: 6,
            border: `1px solid ${T.green}`,
            background: "transparent",
            color: T.green,
            fontFamily: T.font,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 2,
            cursor: "pointer",
          }}
        >
          Next →
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────
export function EmptyState({ icon = "◻", message = "Nothing here yet" }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: 180,
        gap: 10,
        color: T.text3,
      }}
    >
      <span style={{ fontSize: 36, opacity: 0.25 }}>{icon}</span>
      <span
        style={{
          fontSize: 11,
          letterSpacing: 1,
          opacity: 0.5,
          textAlign: "center",
        }}
      >
        {message}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SeedRow
// ─────────────────────────────────────────────────────────────────────────────
export function SeedRow({
  value,
  onChange,
  onRandom,
}: {
  value: number;
  onChange: (value: number) => void;
  onRandom: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        alignItems: "center",
        marginBottom: 14,
      }}
    >
      <input
        type="number"
        value={value}
        min={0}
        max={999999}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        style={{
          flex: 1,
          background: T.bg3,
          border: `1px solid ${T.border2}`,
          borderRadius: 6,
          color: T.text,
          padding: "6px 8px",
          fontSize: 12,
          fontFamily: T.font,
          outline: "none",
          minWidth: 0,
        }}
      />
      <button
        onClick={onRandom}
        title="Random seed"
        style={{
          width: 30,
          height: 30,
          borderRadius: 6,
          border: `1px solid ${T.border2}`,
          background: T.bg3,
          color: T.text2,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          flexShrink: 0,
          fontFamily: T.font,
        }}
      >
        ⟳
      </button>
    </div>
  );
}
