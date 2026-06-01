/**
 * shared/ui/GameShell.jsx
 *
 * Reusable 3-panel game shell — identical chrome for every game.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │               TopBar (full width)            │
 *   ├──────────┬───────────────────────┬───────────┤
 *   │  Left    │       Center          │  Right    │
 *   │ (220px)  │      (1fr)            │  (260px)  │
 *   └──────────┴───────────────────────┴───────────┘
 *
 * Props:
 *   gameName    string          — displayed in topbar logo
 *   logoIcon    ReactNode       — small icon next to name (optional)
 *   accentColor string          — hex, drives tier badge + topbar highlight
 *   tierLabel   string          — e.g. "Expert"
 *   tierIcon    string          — e.g. "▦"
 *   seed        number
 *   elapsed     number          — ms
 *   placedCount number
 *   totalCount  number
 *   isSolved    boolean
 *   leftPanel   ReactNode       — full contents of the left column
 *   centerPanel ReactNode       — full contents of the center column
 *   rightPanel  ReactNode       — full contents of the right column
 */

import { T, formatTime } from "../ui/tokens";
import ProgressRing from "../ui/ProgressRing";
import { ColorType, DiffTier } from "@/shared/types";

export interface GameShellProps {
  gameName: string;
  logoIcon: React.ReactNode;
  accentColor: ColorType;
  tierLabel: DiffTier["name"];
  tierIcon: DiffTier["icon"];
  seed: number;
  elapsed: number;
  placedCount: number;
  totalCount: number;
  isSolved: boolean;
  inforPanel?: React.ReactNode;
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function GameShell({
  gameName = "PUZZLE",
  logoIcon,
  accentColor = T.accent,
  tierLabel = "",
  tierIcon = "",
  seed = 0,
  elapsed = 0,
  placedCount = 0,
  totalCount = 0,
  isSolved = false,
  inforPanel,
  leftPanel,
  centerPanel,
  rightPanel,
}: GameShellProps) {
  const pct = totalCount > 0 ? placedCount / totalCount : 0;

  return (
    <div
      style={{
        height: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: T.font,
        display: "grid",
        gridTemplateColumns: "220px 1fr 260px",
        gridTemplateRows: "52px 1fr",
        overflow: "hidden",
      }}
    >
      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          alignItems: "center",
          borderBottom: `1px solid ${T.border}`,
          background: T.bg2,
        }}
      >
        {/* Logo slot — same width as left panel */}
        <div
          style={{
            width: 220,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 18px",
            borderRight: `1px solid ${T.border}`,
            flexShrink: 0,
          }}
        >
          {logoIcon}
          <h1
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#fff",
              fontFamily: T.font,
            }}
          >
            {gameName}
          </h1>
        </div>

        {/* Centre info strip */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 20px",
          }}
        >
          {/* Tier badge */}
          {tierLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 6,
                border: `1px solid ${accentColor}55`,
                background: `${accentColor}18`,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                color: accentColor,
              }}
            >
              {tierIcon && <span>{tierIcon}</span>}
              <span>{tierLabel}</span>
            </div>
          )}

          <Sep />

          {/* Seed */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              border: `1px solid ${T.border}`,
              background: T.bg3,
              fontSize: 11,
              color: T.text2,
            }}
          >
            <span style={{ fontSize: 12 }}>◈</span>
            <span>{seed}</span>
          </div>

          <Sep />

          {/* Timer */}
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: T.text,
              letterSpacing: 2,
              fontVariantNumeric: "tabular-nums",
              minWidth: 68,
            }}
          >
            {formatTime(elapsed)}
          </span>
          <Sep />
          {/* Information panel */}
          <div className="flex-1 justify-end">{inforPanel}</div>
        </div>

        {/* Progress — same width as right panel */}
        <div
          style={{
            width: 260,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 16px",
            borderLeft: `1px solid ${T.border}`,
            flexShrink: 0,
          }}
        >
          <ProgressRing pct={pct} color={isSolved ? T.green : accentColor} />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.text2 }}>
            {placedCount}/{totalCount}
          </span>
          {isSolved && (
            <span
              style={{
                fontSize: 12,
                color: T.green,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              ✓ SOLVED
            </span>
          )}
        </div>
      </div>

      {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
      <PanelColumn borderRight>{leftPanel}</PanelColumn>

      {/* ── CENTER ───────────────────────────────────────────────────────── */}
      <div
        id="game-container"
        className="grid place-items-center relative"
        style={{
          background: T.bg,
          overflowY: "auto",
        }}
      >
        {centerPanel}
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <PanelColumn borderLeft>{rightPanel}</PanelColumn>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function Sep() {
  return <div style={{ width: 1, height: 20, background: T.border }} />;
}

function PanelColumn({
  children,
  borderRight,
  borderLeft,
}: {
  children: React.ReactNode;
  borderRight?: boolean;
  borderLeft?: boolean;
}) {
  return (
    <div
      style={{
        background: T.bg2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: borderRight ? `1px solid ${T.border}` : undefined,
        borderLeft: borderLeft ? `1px solid ${T.border}` : undefined,
      }}
    >
      {children}
    </div>
  );
}
