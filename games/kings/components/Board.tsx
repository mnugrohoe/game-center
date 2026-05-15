import { REG_FILL, DIFF_TIERS } from "../core/const";
import { formatTime } from "../core/utils";
import { ControlButton } from "./Button";
import { useKingGameContext } from "./context";

export default function Board() {
  const game = useKingGameContext();
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 10,
          border: "1px solid rgba(201,168,76,0.18)",
          background: "rgba(0,0,0,0.5)",
          borderRadius: 2,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${game.currentN},${game.cellPx}px)`,
          }}
        >
          {Array.from({ length: game.currentN }, (_, r) =>
            Array.from({ length: game.currentN }, (_, c) => {
              const reg = game.currentGrid![r][c];
              const borders = {
                top: r === 0 || game.currentGrid![r - 1]?.[c] !== reg,
                bottom:
                  r === game.currentN - 1 ||
                  game.currentGrid![r + 1]?.[c] !== reg,
                left: c === 0 || game.currentGrid![r]?.[c - 1] !== reg,
                right:
                  c === game.currentN - 1 ||
                  game.currentGrid![r]?.[c + 1] !== reg,
              };
              const st = game.cellStates[r]?.[c] ?? 0;
              const locked = game.autoLocked[r]?.[c];
              const inTerr = game.territory[r]?.[c];
              const conflict = st === 2 && game.conflictMap?.[r]?.[c];

              return (
                <div
                  key={`${r}-${c}`}
                  data-gen-cell={`${r}-${c}`}
                  onClick={() => game.handleLeft(r, c)}
                  onDoubleClick={() => game.handleDbl(r, c)}
                  onContextMenu={(e) => game.handleRight(e, r, c)}
                  style={{
                    width: game.cellPx,
                    height: game.cellPx,
                    background: conflict ? "#250e0e" : REG_FILL[reg % 12],
                    border: "0.5px solid rgba(255,255,255,0.04)",
                    borderTop: borders.top
                      ? "2.5px solid rgba(201,168,76,0.55)"
                      : undefined,
                    borderBottom: borders.bottom
                      ? "2.5px solid rgba(201,168,76,0.55)"
                      : undefined,
                    borderLeft: borders.left
                      ? "2.5px solid rgba(201,168,76,0.55)"
                      : undefined,
                    borderRight: borders.right
                      ? "2.5px solid rgba(201,168,76,0.55)"
                      : undefined,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: locked && st === 0 ? "default" : "pointer",
                    position: "relative",
                    userSelect: "none",
                    transition: "filter 0.1s, box-shadow 0.2s",
                  }}
                >
                  {inTerr && st === 0 && !locked && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(201,168,76,0.07)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {locked && st === 0 && (
                    <span
                      style={{
                        fontSize: "1.4rem",
                        color: "rgba(255,255,255,0.18)",
                      }}
                    >
                      ·
                    </span>
                  )}
                  {st === 1 && (
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "rgba(212,196,154,0.3)",
                        fontWeight: 700,
                      }}
                    >
                      ✕
                    </span>
                  )}
                  {st === 2 && (
                    <span
                      style={{
                        fontSize: "1.3rem",
                        color: "#e8c96a",
                        textShadow: "0 0 8px rgba(201,168,76,0.8)",
                      }}
                    >
                      ♛
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Status chips */}
      <div className="flex gap-2 flex-wrap justify-center">
        <span
          style={{
            fontFamily: "'Cinzel',serif",
            fontSize: "0.62rem",
            padding: "3px 10px",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "2px",
            background: "rgba(201,168,76,0.07)",
            color: "#c9a84c",
          }}
        >
          {game.numKings} / {game.currentN}
        </span>
        {game.numKings > 0 && (
          <span
            style={{
              fontSize: "0.62rem",
              padding: "3px 10px",
              border: `1px solid ${game.hasAnyConflict ? "rgba(200,70,70,0.4)" : "rgba(70,180,100,0.4)"}`,
              borderRadius: "2px",
              background: game.hasAnyConflict
                ? "rgba(200,70,70,0.08)"
                : "rgba(70,180,100,0.08)",
              color: game.hasAnyConflict ? "#ee8888" : "#7ed4a0",
            }}
          >
            {game.hasAnyConflict ? "⚠ Conflict" : "✓ No conflict"}
          </span>
        )}
        <span
          style={{
            fontSize: "0.62rem",
            padding: "3px 10px",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: "2px",
            color: "#7a6840",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTime(game.elapsed)}
        </span>
      </div>

      {/* Win banner */}
      {game.won && (
        <div
          className="text-center px-5 py-3 rounded-sm"
          style={{
            border: "1px solid rgba(201,168,76,0.4)",
            background: "rgba(201,168,76,0.08)",
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel Decorative',serif",
              fontSize: "0.875rem",
              color: "#e8c96a",
            }}
          >
            ⚜ PUZZLE CONQUERED ⚜
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              marginTop: 4,
              color: "#7a6840",
            }}
          >
            Solved in {formatTime(game.elapsed)} · {game.currentN}×
            {game.currentN} · {DIFF_TIERS[game.currentTierIdx].name}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2 flex-wrap justify-center">
        <ControlButton label={"↺ Restart"} onClick={game.resetPuzzle} />
        <ControlButton label={"Clear marks"} onClick={game.clearMarks} />
        <ControlButton
          label={"↩ Undo"}
          onClick={game.undoMove}
          disabled={!game.moveHistory.length}
        />
        <ControlButton label={"? Hint"} onClick={game.showHint} />
      </div>
    </div>
  );
}
