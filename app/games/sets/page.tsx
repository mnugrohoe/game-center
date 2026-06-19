"use client";

import { useMemo } from "react";

// shared UI
import GameShell from "@/shared/components/layout/GameShell";
import { ParamItem } from "@/shared/components/ui/GeneratorPanel";
import {
  ActionDef,
  StatItem,
  SolverPanel,
  SolverGeneratorParamConfig,
  ParamValues,
  ParamValuesType,
} from "@/shared/components/ui/SolverPanel";
import {
  SectionLabel,
  SolverStatusBar,
} from "@/shared/components/ui/primitive";
import { T, colorId, formatTime } from "@/shared/components/ui/tokens";

import LogoIcon from "@/games/set/components/Logo";
import ParamsPanel from "@/shared/components/ui/ParamsPanel";
import ToolSelectionPanel from "@/shared/components/ui/ToolSelectionPanel";

import { ColorType, GeneratorMode } from "@/shared/types";
import { useSets, SetsProvider } from "@/games/set/hooks/SetContext";
import {
  SET_TIERS,
  SetParams,
  setParamsGenerator,
} from "@/games/set/lib/difficulty";
import SetsBoard from "@/games/set/components/SetBoard";
import {
  COLOR_MAP,
  COLORS,
  COUNTS,
  SYMBOLS,
  TEXTURES,
} from "@/games/set/lib/constants";
import SymbolRenderer from "@/games/set/components/Shape";
import { SetCard } from "@/games/set/components/Card";
import {
  CardType,
  ColorToken,
  CountToken,
  SymbolToken,
  TextureToken,
} from "@/games/set/lib/types";
import { FaPlus } from "react-icons/fa6";
import { cardSignature } from "@/games/set/lib/solver";

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function SetsGame() {
  const ctx = useSets();
  const { isSolver } = ctx.generator;

  const params: SetParams | null = useMemo(() => {
    if (ctx.generator.mode.value === ("Difficulty" as GeneratorMode)) {
      return setParamsGenerator.byTier(
        ctx.generator.tierIdx.value,
        ctx.generator.seed.value,
      );
    }

    if (ctx.generator.mode.value === "Level") {
      return setParamsGenerator.byLevel(ctx.generator.level.value);
    }

    return null;
  }, [ctx.generator]);

  // ── Modifikasi Parameter Kiri Atas / Detail Tumpukan Deck ──────────────────
  const displayParams = useMemo((): ParamItem[] => {
    // Jika berada pada mode Solver/Editor kustom, tampilkan proporsi isi kartu saat ini
    if (isSolver) {
      const currentCardsCount =
        ctx.board.customPuzzle.value?.cards?.length || 0;
      const currentSetsCount = ctx.board.customPuzzle.value?.sets?.length || 0;
      return [
        {
          label: "Custom Workspace",
          display: "Active Mode",
          pct: 1,
          color: T.accent2,
        },
        {
          label: "Registered Cards",
          display: `${currentCardsCount} / 24 max`,
          pct: Math.min(currentCardsCount / 24, 1),
          color: `hsl(${colorId(2).bg})` as ColorType,
        },
        {
          label: "Available Sets Loop",
          display: `${currentSetsCount} sets detected`,
          pct: Math.min(currentSetsCount / 10, 1),
          color: `hsl(${colorId(3).bg})` as ColorType,
        },
      ];
    }

    if (!params) return [];

    return [
      {
        label: "Total Cards",
        display: `${params.totalCards} cards`,
        pct: params.totalCards / 36,
        color: `hsl(${colorId(1).bg})` as ColorType,
      },
      {
        label: "Overlap Factor",
        display: params.overlapFactor.toFixed(2),
        pct: params.overlapFactor / 5,
        color: `hsl(${colorId(2).bg})` as ColorType,
      },
      {
        label: "Entropy",
        display: params.entropy.toFixed(2),
        pct: params.entropy,
        color: `hsl(${colorId(3).bg})` as ColorType,
      },
      {
        label: "Visual Noise",
        display: params.visualNoise.toFixed(2),
        pct: params.visualNoise,
        color: `hsl(${colorId(4).bg})` as ColorType,
      },
      {
        label: "Seed",
        display: params.seed.toString(),
        pct: 1,
        color: `hsl(${colorId(6).bg})` as ColorType,
      },
    ];
  }, [params, isSolver, ctx.board.customPuzzle.value]);

  const setCell = useMemo(() => {
    return ctx.board.userSets.value.length;
  }, [ctx.board.userSets.value]);

  // ── Solver panel actions ──────────────────────────────────────────────────
  const solverActions: ActionDef[] = [
    {
      label: ctx.solver.isVisible.value ? "Hide Solution" : "Show Solution",
      icon: ctx.solver.isVisible.value ? "◎" : "◉",
      color: T.cyan,
      hidden: isSolver,
      disabled: !ctx.board.puzzle.value,
      onClick: ctx.solver.toggleVisibility,
    },
    {
      label: "Clear Board",
      icon: "⌫",
      color: T.text2,
      // ✅ FIX: Mematikan tombol jika tidak ada data aktif di kedua mode
      disabled: !ctx.board.puzzle.value && !ctx.board.customPuzzle.value,
      onClick: ctx.clearBoard,
    },
    {
      label: "New Puzzle",
      icon: "↺",
      color: T.green,
      disabled: !ctx.board.puzzle.value && !ctx.board.customPuzzle.value,
      hidden: isSolver,
      onClick: ctx.loadNextPuzzle,
    },
  ];

  const solverBoardParams: SolverGeneratorParamConfig[] = [
    {
      key: "size",
      label: "Size",
      type: "number",
      defaultValue: 6,
      min: 4,
      max: 15,
    },
  ];

  // ── Modifikasi Reaktif untuk Grid Statistik (Kanan Bawah) ─────────────────
  const stats: StatItem[] = useMemo((): StatItem[] => {
    if (isSolver) {
      const customData = ctx.board.customPuzzle.value;
      return [
        {
          label: "Cards",
          value: customData ? `${customData.cards?.length || 0}` : "0",
        },
        {
          label: "Sets Loops",
          value: customData ? `${customData.sets?.length || 0}` : "0",
        },
        {
          label: "Status",
          value: "Sandbox",
        },
        {
          label: "Time",
          value: "—", // Hentikan perhitungan waktu pada mode sandbox kustom
        },
      ];
    }

    return [
      {
        label: "Cards",
        value: ctx.board.puzzle.value
          ? `${ctx.board.puzzle.value.metrics.cards}`
          : "—",
      },
      {
        label: "Sets",
        value: ctx.board.puzzle.value
          ? `${ctx.board.puzzle.value.metrics.totalSets}`
          : "—",
      },
      {
        label: "Placed",
        value: ctx.board.puzzle.value
          ? `${setCell}/${ctx.board.puzzle.value.params.targetSets}`
          : "—",
      },
      {
        label: "Time",
        value: formatTime(ctx.timer.elapsedTime),
      },
    ];
  }, [
    isSolver,
    ctx.board.puzzle.value,
    ctx.board.customPuzzle.value,
    setCell,
    ctx.timer.elapsedTime,
  ]);

  const handleGenerateSolverBoard = (values: ParamValues) => {
    if (
      !values.symbol ||
      !values.colorToken ||
      !values.texture ||
      !values.count
    ) {
      return;
    }

    const card: Omit<CardType, "id"> = {
      symbol: values.symbol as SymbolToken,
      color: values.colorToken as ColorToken,
      texture: values.texture as TextureToken,
      count: values.count as CountToken,
    };

    const id: CardType["id"] = cardSignature(card);
    const newCard: CardType = { id, ...card };

    ctx.board.customPuzzle.setValue((prev) => {
      const oldCards = prev?.cards ?? [];
      if (oldCards.some((c) => c.id === id)) return prev;

      return {
        ...prev,
        cards: [...oldCards, newCard],
      };
    });

    ctx.resetGame();
  };

  const handleGenerateBoard = () => {
    ctx.board.customPuzzle.setValue(null);
    ctx.generatePuzzle();
  };

  // Kalkulasi total sasaran penemuan set dan warna tema shell reaktif
  const targetTotalSets = isSolver
    ? ctx.board.customPuzzle.value?.sets?.length || 0
    : ctx.board.puzzle.value?.params.targetSets || 0;

  const themeAccentColor = isSolver
    ? T.accent2
    : ctx.board.puzzle.value?.params.tier.color || T.accent;

  return (
    <GameShell
      gameName="SETS"
      logoIcon={<LogoIcon />}
      accentColor={themeAccentColor}
      tierLabel={
        isSolver ? "SOLVER MODE" : ctx.board.puzzle.value?.params.tier.name
      }
      tierIcon={isSolver ? "⚙️" : ctx.board.puzzle.value?.params.tier.icon}
      seed={isSolver ? 0 : ctx.board.puzzle.value?.params.seed}
      elapsed={isSolver ? 0 : ctx.timer.elapsedTime}
      placedCount={setCell || 0}
      totalCount={targetTotalSets}
      isSolved={isSolver ? false : ctx.isComplete}
      onNext={ctx.loadNextPuzzle}
      inforPanel={
        <SolverStatusBar
          status={ctx.solver.status.value}
          message={
            ctx.solver.status.value === "solving"
              ? "Running backtracking solver…"
              : ctx.solver.status.value === "done"
                ? `Solution found — ${ctx.solver.solution.value?.length} rectangles`
                : ctx.solver.status.value === "error"
                  ? "No solution found"
                  : ""
          }
        />
      }
      leftPanel={
        <ToolSelectionPanel
          generator={{
            tiers: SET_TIERS,
            tier: ctx.generator.tierIdx,
            seed: ctx.generator.seed,
            onGenerate: handleGenerateBoard,
            mode: ctx.generator.mode,
            level: ctx.generator.level,
          }}
          solver={{
            paramsConfig: solverBoardParams,
            onGenerate: handleGenerateSolverBoard,
            customElement: (values, onChange) => (
              <CardSelector values={values} onChange={onChange} />
            ),
            generateLabel: (
              <>
                <FaPlus /> Add card
              </>
            ),
            initialValues: {
              symbol: SYMBOLS[0],
              colorToken: COLORS[0],
              texture: TEXTURES[0],
              count: COUNTS[0],
            },
          }}
          mode={ctx.generator.puzzleMode}
        />
      }
      centerPanel={<SetsBoard />}
      rightPanel={
        <SolverPanel
          panelLabel={isSolver ? "Custom Workspace Matrix" : "Params & Stats"}
          placedCount={setCell}
          totalCount={targetTotalSets}
          stats={stats}
          actions={solverActions}
        >
          <ParamsPanel params={displayParams} />
        </SolverPanel>
      }
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Card Selector Component
// ─────────────────────────────────────────────────────────────────────────────
function CardSelector({
  values,
  onChange,
}: {
  values: ParamValues;
  onChange: (key: string, value: ParamValuesType) => void;
}) {
  const activeSymbol = (values.symbol ?? "diamond") as SymbolToken;
  const activeColor = (values.colorToken ?? "red") as ColorToken;
  const activeTexture = (values.texture ?? "outline") as TextureToken;
  const activeCount = Number(values.count ?? 1) as CountToken;
  const symboleSize = "1.5em";

  const getBtnClass = (isActive: boolean, isCount = false) => {
    const base = "flex-1 border p-2 transition-all duration-200 cursor-pointer";
    if (isActive) {
      return `${base} border-gold-500 bg-gold-500/10 shadow-[0_0_8px_rgba(234,179,8,0.2)] ${isCount ? "text-gold-500" : ""}`;
    }
    return `${base} border-zinc-800 bg-transparent hover:border-zinc-700 ${isCount ? "text-zinc-400 hover:text-zinc-200 text-sm font-bold" : ""}`;
  };

  return (
    <>
      <SectionLabel>Symbol</SectionLabel>
      <div className="flex gap-1.5">
        {SYMBOLS.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => onChange("symbol", s)}
            className={getBtnClass(activeSymbol === s)}
          >
            <SymbolRenderer
              symbol={s}
              color={activeColor}
              texture={activeTexture}
              count={1}
              size={symboleSize}
            />
          </button>
        ))}
      </div>

      <SectionLabel style={{ marginTop: 12 }}>Color</SectionLabel>
      <div className="flex gap-1.5">
        {COLORS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => onChange("colorToken", c)}
            className={getBtnClass(activeColor === c)}
          >
            <SymbolRenderer
              symbol={activeSymbol}
              color={c}
              texture={activeTexture}
              count={1}
              size={symboleSize}
            />
          </button>
        ))}
      </div>

      <SectionLabel style={{ marginTop: 12 }}>Texture</SectionLabel>
      <div className="flex gap-1.5">
        {TEXTURES.map((t) => (
          <button
            type="button"
            key={t}
            onClick={() => onChange("texture", t)}
            className={getBtnClass(activeTexture === t)}
          >
            <SymbolRenderer
              symbol={activeSymbol}
              color={activeColor}
              texture={t}
              count={1}
              size={symboleSize}
            />
          </button>
        ))}
      </div>

      <SectionLabel style={{ marginTop: 12 }}>Count</SectionLabel>
      <div className="flex gap-1.5">
        {COUNTS.map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => onChange("count", Number(c))}
            className={getBtnClass(activeCount === Number(c), true)}
            style={{ color: COLOR_MAP[activeColor] }}
          >
            {c}
          </button>
        ))}
      </div>

      <SectionLabel style={{ marginTop: 12 }}>Preview</SectionLabel>
      <div className="flex gap-1.5 justify-center items-center rounded">
        <SetCard
          card={{
            id: "preview-card",
            symbol: activeSymbol,
            color: activeColor,
            texture: activeTexture,
            count: activeCount,
          }}
        />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Wrapper Export
// ─────────────────────────────────────────────────────────────────────────────
export default function SetsGamePage() {
  return (
    <SetsProvider>
      <SetsGame />
    </SetsProvider>
  );
}
