import { REG_FILL, DIFF_TIERS } from "@/games/kings/core/const";
import { formatTime } from "@/games/kings/core/utils";
import { ControlButton } from "@/games/kings/components/Button";
import { cinzel } from "@/shared/utils/fonts";
import { KingGameContextType } from "../../hooks/useKingsGame";

export default function GeneratorBoard({
  game,
}: {
  game: KingGameContextType;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Board */}
      {game.currentGrid && (
        <>
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center p-2 border border-[rgba(201,168,76,0.18)] bg-[rgba(0,0,0,0.5)] rounded-xs">
              <div
                className="grid"
                style={{
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
                    const conflict =
                      st === 2 &&
                      game.hasConflict(
                        game.cellStates,
                        game.currentGrid!,
                        r,
                        c,
                        game.currentN,
                      );

                    return (
                      <div
                        key={`${r}-${c}`}
                        data-gen-cell={`${r}-${c}`}
                        onClick={() => game.handleLeft(r, c)}
                        onDoubleClick={() => game.handleDbl(r, c)}
                        onContextMenu={(e) => game.handleRight(e, r, c)}
                        className="relative select-none flex items-center justify-center transition-[filter,box-shadow]"
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
                          cursor: locked && st === 0 ? "default" : "pointer",
                          position: "relative",
                          userSelect: "none",
                          transition: "filter 0.1s, box-shadow 0.2s",
                        }}
                      >
                        {inTerr && st === 0 && !locked && (
                          <div className="absolute inset-0 bg-[rgba(201,168,76,0.07)] pointer-events-none" />
                        )}

                        {locked && st === 0 && (
                          <span className="text-[1.4rem] text-[rgba(255,255,255,0.18)]">
                            ·
                          </span>
                        )}

                        {st === 1 && (
                          <span className="text-[0.85rem] text-[rgba(212,196,154,0.3)] font-bold">
                            ×
                          </span>
                        )}

                        {st === 2 && (
                          <span
                            className="text-[1.3rem] text-[#e8c96a]"
                            style={{
                              textShadow: "0 0 8px rgba(201,168,76,0.8)",
                            }}
                          >
                            ♝
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
                className={`${cinzel.className} text-xs tracking-widest mb-1 text-[#7a6840] py-1.5 px-3 rounded-sm border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.07)]`}
              >
                {game.numKings} / {game.currentN}
              </span>

              {game.numKings > 0 && (
                <span
                  className="text-[0.62rem] py-1.5 px-3 rounded-sm border"
                  style={{
                    borderColor: game.hasAnyConflict
                      ? "rgba(200,70,70,0.4)"
                      : "rgba(70,180,100,0.4)",
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
                className="text-[0.62rem] py-1.5 px-3 rounded-sm border border-[rgba(201,168,76,0.15)] text-[#7a6840] font-['tabular-nums']"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatTime(game.elapsed)}
              </span>
            </div>

            {/* Win banner */}
            {game.won && (
              <div className="text-center px-5 py-3 rounded-sm border border-[rgba(201,168,76,0.4)] bg-[rgba(201,168,76,0.08)]">
                <div
                  className={`${cinzel.className} text-[0.875rem] text-[#e8c96a]`}
                  style={{ color: "#e8c96a" }}
                >
                  ✓ PUZZLE CONQUERED ✓
                </div>
                <div className="text-[0.75rem] mt-1 text-[#7a6840]">
                  Solved in {formatTime(game.elapsed)} · {game.currentN}×
                  {game.currentN} · {DIFF_TIERS[game.currentTierIdx].name}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2 flex-wrap justify-center">
              <ControlButton label="↺ Restart" onClick={game.resetPuzzle} />
              <ControlButton label="Clear marks" onClick={game.clearMarks} />
              <ControlButton
                label="↩ Undo"
                onClick={game.undoMove}
                disabled={!game.moveHistory.length}
              />
              <ControlButton label="? Hint" onClick={game.showHint} />
            </div>
          </div>
        </>
      )}

      {/* How to play */}
      <div className="rounded-sm p-4 bg-[#111009] border border-[rgba(201,168,76,0.1)] w-full max-w-xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-linear-to-r from-transparent via-[rgba(201,168,76,0.3)] to-transparent" />
          <span
            className={`${cinzel.className} text-[0.65rem] tracking-widest text-[#7a6840]`}
          >
            HOW TO PLAY
          </span>
          <div className="flex-1 h-px bg-linear-to-l from-transparent via-[rgba(201,168,76,0.3)] to-transparent" />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {[
            { k: "L-click", v: "→ mark ×" },
            { k: "R-click / dblclick", v: "→ King ♝" },
            { k: "1 king", v: "per region, row, column" },
            { k: "3×3 zone", v: "around each king = blocked" },
          ].map(({ k, v }) => (
            <div key={k} className="flex gap-2 text-[0.75rem] text-[#7a6840]">
              <span className="text-[#c9a84c]">{k}</span> {v}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-2 text-[0.65rem] tracking-widest text-[rgba(201,168,76,0.2)] ${cinzel.className}">
        SAME SEED · SAME PUZZLE · EVERY TIME
      </div>
    </div>
  );
}
