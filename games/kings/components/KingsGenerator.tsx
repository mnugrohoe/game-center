import { REG_FILL, DIFF_TIERS } from "@/games/kings/core/const";
import { ButtonLevel, ControlButton } from "@/games/kings/components/Button";
import { DifficultyBadge } from "./DifficultyBadge";
import { cinzel } from "@/shared/utils/fonts";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { IoInfiniteOutline } from "react-icons/io5";
import { KingGameProvider } from "./context";
import { formatTime } from "../core/utils";
import { useKingGame } from "../hooks/useKingsGame";

export default function KingsGenerator() {
  const game = useKingGame();

  return (
    <KingGameProvider>
      <div
        className="min-h-screen "
        style={{ background: "#0a0908", color: "#d4c49a" }}
      >
        {/* Scanline */}
        <div className="pointer-events-none z-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
          {/* Header */}
          <div className="text-center ">
            <h1
              className={`${cinzel.className} text-3xl font-bold tracking-[0.08em] mb-1 text-[#e8c96a]`}
            >
              ♛ KINGS
            </h1>
            <p
              className={`${cinzel.className} text-xs letter-spacing-[0.12em] text-[#7a6840]`}
            >
              PUZZLE GENERATOR
            </p>
          </div>

          {/* Generator Panel */}
          <div className="rounded-sm p-5 flex flex-col gap-5 bg-[#111009]  border-[0.5px] border-[rgba(201,168,76,0.15)]">
            {/* Mode tabs */}
            <div className="flex w-full items-center rounded-sm overflow-hidden border border-[rbga(201,168,76,0.2)]">
              {(["level", "diff"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => game.setMode(m)}
                  className={`flex-1 p-2 ${cinzel.className} text-xs tracking-widest transition-all duration-150 ${game.mode === m ? "text-[#c9a84c] bg-[rgba(201,168,76,0.12)]" : " text-[#7a6840] bg-transparent hover:bg-[rgba(125,103,45,0.07)] cursor-pointer"} border-none 
                `}
                >
                  {m === "level" ? "BY LEVEL" : "BY DIFFICULTY"}
                </button>
              ))}
            </div>

            {/* By level */}
            {game.mode === "level" && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex flex-col w-full">
                    <span
                      className={`${cinzel.className} text-xs tracking-widest mb-1 text-[#7a6840]`}
                    >
                      LEVEL
                    </span>
                    <div className="flex items-center gap-2 w-full justify-around">
                      <div>
                        <ButtonLevel
                          onClick={() =>
                            game.handleChangeLevel(
                              Math.max(1, game.currentLevel - 1),
                            )
                          }
                        >
                          <FaChevronLeft />
                        </ButtonLevel>
                      </div>
                      <div className="flex flex-col items-center flex-1">
                        <div
                          style={{
                            fontFamily: "'Cinzel Decorative',serif",
                            fontSize: "2.8rem",
                            fontWeight: 700,
                            color: "#e8c96a",
                            lineHeight: 1,
                            textShadow: "0 0 20px rgba(201,168,76,0.3)",
                          }}
                        >
                          <input
                            type="number"
                            value={game.currentLevel}
                            min={1}
                            max={99999}
                            className={`text-center text-6xl bg-transparent border-b border-[rgba(201,168,76,0.25)] text-[#d4c49a] ${cinzel.className} p-3 rounded-xs outline-none min-w-24`}
                            onChange={(e) =>
                              game.handleChangeLevel(
                                Math.max(
                                  1,
                                  Math.min(99999, +e.target.value || 1),
                                ),
                              )
                            }
                          />
                        </div>
                        <DifficultyBadge difficulty={game.currentTierIdx} />
                      </div>
                      <div>
                        <ButtonLevel
                          onClick={() =>
                            game.handleChangeLevel(
                              Math.min(99999, game.currentLevel + 1),
                            )
                          }
                        >
                          <FaChevronRight />
                        </ButtonLevel>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-full mb-1 h-0.75 rounded-xs bg-[rgba(201,168,76,0.1)] overflow-hidden">
                  <div
                    className={`h-full  bg-[#c9a84c] rounded-xs transition-width duration-300`}
                    style={{
                      width: `${game.levelPct(game.currentLevel).toFixed(1)}%`,
                    }}
                  />
                </div>
                <div
                  className={`flex justify-between text-[0.65rem] text-[#7a6840] ${cinzel.className} mb-3`}
                >
                  <span>Level 1</span>
                  <span>
                    <IoInfiniteOutline />
                  </span>
                </div>
              </div>
            )}

            {/* By difficulty */}
            {game.mode === "diff" && (
              <div className="flex flex-col gap-3">
                <span
                  style={{
                    fontFamily: "'Cinzel',serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    color: "#7a6840",
                  }}
                >
                  SELECT DIFFICULTY
                </span>
                <div className="flex flex-wrap gap-2">
                  {DIFF_TIERS.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => game.setSelectedTier(i)}
                      className="cursor-pointer transition-all duration-150 tracking-widest"
                    >
                      <DifficultyBadge
                        difficulty={i}
                        active={game.selectedTier === i}
                      />
                    </button>
                  ))}
                </div>
                {/* <div className="text-xs text-[#7a6840]">
                  {DIFF_TIERS[game.selectedTier].grid}×
                  {DIFF_TIERS[game.selectedTier].grid} grid ·{" "}
                  {DIFF_TIERS[game.selectedTier].regions} regions · infinite
                  unique seeds
                </div> */}
              </div>
            )}

            <button
              onClick={game.generate}
              disabled={game.generating}
              className={`tracking-widest ${cinzel.className} text-sm tracking-wider py-3 px-5 rounded-sm border border-[rgba(201,168,76,0.65)] bg-[rgba(201,168,76,0.18)] text-[#e8c96a] transition-all duration-150 flex items-center justify-center gap-2 ${game.generating ? "cursor-not-allowed opacity-70" : "hover:bg-[rgba(201,168,76,0.25)] cursor-pointer"}`}
            >
              {game.generating && (
                <span
                  className={`w-4.5 h-4.5  border-2 border-[rgba(201,168,76,0.2)] border-t-[#c9a84c] rounded-[50%] animate-spin inline-block`}
                />
              )}
              {game.generating ? "Generating…" : "Generate Puzzle"}
            </button>

            {game.currentGrid && (
              <div className="flex gap-2 flex-wrap items-center">
                <span
                  className={`${cinzel.className} text-xs tracking-widest mb-1 text-[#7a6840] py-1.5 px-3 border-[${DIFF_TIERS[game.currentTierIdx].dim}] bg-[${DIFF_TIERS[game.currentTierIdx].color}18] text-[${DIFF_TIERS[game.currentTierIdx].bright}] rounded-sm`}
                >
                  {DIFF_TIERS[game.currentTierIdx].icon}{" "}
                  {DIFF_TIERS[game.currentTierIdx].name.toUpperCase()}
                </span>
                <span
                  className={`${cinzel.className} text-xs tracking-widest mb-1 text-[#7a6840] py-1.5 px-3 border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.1)] rounded-sm`}
                >
                  {game.currentN}×{game.currentN}
                </span>
                <span
                  className={`${cinzel.className} text-xs tracking-widest mb-1 text-[#7a6840] py-1.5 px-3 border-[rgba(201,168,76,0.25)] bg-[rgba(201,168,76,0.1)] rounded-sm`}
                >
                  {game.currentN} regions
                </span>
                {game.mode === "level" && (
                  <span
                    className={`${cinzel.className} text-xs tracking-widest mb-1 text-[#7a6840] py-1.5 px-3 border-[rgba(201,168,76,0.15)] bg-[rgba(201,168,76,0.1)] rounded-sm`}
                  >
                    Level {game.currentLevel}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Board */}
          {game.currentGrid && (
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
                          style={{
                            width: game.cellPx,
                            height: game.cellPx,
                            background: conflict
                              ? "#250e0e"
                              : REG_FILL[reg % 12],
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
                <ControlButton
                  label={"Clear marks"}
                  onClick={game.clearMarks}
                />
                <ControlButton
                  label={"↩ Undo"}
                  onClick={game.undoMove}
                  disabled={!game.moveHistory.length}
                />
                <ControlButton label={"? Hint"} onClick={game.showHint} />
              </div>
            </div>
          )}

          {/* How to play */}
          <div
            className="rounded-sm p-4"
            style={{
              background: "#111009",
              border: "0.5px solid rgba(201,168,76,0.1)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                style={{
                  flex: 1,
                  height: "0.5px",
                  background:
                    "linear-gradient(to right,transparent,rgba(201,168,76,0.3))",
                }}
              />
              <span
                style={{
                  fontFamily: "'Cinzel',serif",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  color: "#7a6840",
                }}
              >
                HOW TO PLAY
              </span>
              <div
                style={{
                  flex: 1,
                  height: "0.5px",
                  background:
                    "linear-gradient(to left,transparent,rgba(201,168,76,0.3))",
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2">
              {[
                { k: "L-click", v: "→ mark ×" },
                { k: "R-click / dblclick", v: "→ King ♛" },
                { k: "1 king", v: "per region, row, column" },
                { k: "3×3 zone", v: "around each king = blocked" },
              ].map(({ k, v }) => (
                <div
                  key={k}
                  className="flex gap-2"
                  style={{ fontSize: "0.75rem", color: "#7a6840" }}
                >
                  <span style={{ color: "#c9a84c" }}>{k}</span> {v}
                </div>
              ))}
            </div>
          </div>

          <div
            className="text-center"
            style={{
              fontFamily: "'Cinzel',serif",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              color: "rgba(201,168,76,0.2)",
            }}
          >
            SAME SEED · SAME PUZZLE · EVERY TIME
          </div>
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </KingGameProvider>
  );
}
