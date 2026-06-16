"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import useTimer, { UseTimerReturn } from "@/shared/hooks/useTimer";
import useGenerator, { UseGeneratorReturn } from "@/shared/hooks/useGenerator";
import useSolver, { UseSolverReturn } from "@/shared/hooks/useSolver";
import useSetsBoard, { UseSetsBoardReturn } from "./useSetBoard";
import { CardType } from "../lib/types";
import { setGenerator, SetsPuzzle } from "../lib/generator";
import { findAllSets } from "../lib/solver";
import { SET_TIERS } from "../lib/difficulty";

/**
 * Struktur data nilai konteks global yang disediakan oleh SetsProvider.
 */
interface SetsContextValue {
  /** Manajemen state papan permainan utama. */
  board: UseSetsBoardReturn;
  /** Mesin pembuat (generator) teka-teki berdasarkan level/kesulitan. */
  generator: UseGeneratorReturn;
  /** Pelacak durasi waktu permainan berjalan. */
  timer: UseTimerReturn;
  /** Status bendera penanda apakah permainan saat ini telah selesai dipecahkan. */
  isComplete: boolean;
  /** Mengembalikan seluruh state permainan, baris pilihan, dan waktu kembali ke awal. */
  resetGame: () => void;
  /** Memicu pembuatan instansiasi struktur teka-teki baru berdasarkan konfigurasi aktif. */
  generatePuzzle: (seedOverride?: number) => void;
  /** Melompati sesi saat ini dan memuat teka-teki berikutnya dari antrean tingkat kesulitan. */
  loadNextPuzzle: () => void;
  /** Menghitung solusi instan menggunakan pemecah algoritma pencarian bawaan. */
  autoSolve: () => void;
  /** Membersihkan tumpukan kartu pilihan serta mereset papan editor kustom. */
  clearBoard: () => void;
  /** Pengendali status, visibilitas, dan penampung data solusi otomatis dari mesin solver. */
  solver: UseSolverReturn<CardType[], [CardType, CardType, CardType][]>;
}

const SetsContext = createContext<SetsContextValue | null>(null);

/**
 * Hook kustom untuk mengakses seluruh state dan metode operasional game SETS.
 * Harus digunakan di dalam lingkup komponen yang dibungkus oleh `SetsProvider`.
 *
 * @throws {Error} Jika hook dipanggil di luar komponen `SetsProvider`.
 * @returns Seluruh nilai konteks operasional game SETS.
 */
export function useSets() {
  const context = useContext(SetsContext);
  if (!context) {
    throw new Error("useSets must be used within a SetsProvider");
  }
  return context;
}

/**
 * Membuat instansiasi teka-teki SETS baru berdasarkan urutan indeks level numerik tertentu.
 */
function levelGenerator(level: number): SetsPuzzle {
  const puzzle = setGenerator.byLevel(level);
  if (!puzzle) {
    throw new Error(`Failed to generate Sets puzzle at level ${level}`);
  }
  return puzzle;
}

/**
 * Membuat instansiasi teka-teki SETS baru berdasarkan tier tingkat kesulitan dan nilai seed pengacak.
 */
function tierGenerator(tierIdx: number, seed: number): SetsPuzzle {
  const puzzle = setGenerator.byTier(tierIdx, seed);
  if (!puzzle) {
    throw new Error(`Failed to generate Sets puzzle at tier ${tierIdx}`);
  }
  return puzzle;
}

/**
 * Komponen Provider utama yang mengisolasi, mengotomatisasi, dan menyebarkan
 * seluruh state manajemen game SETS ke seluruh rantai komponen anak di bawahnya.
 */
export function SetsProvider({ children }: { children: React.ReactNode }) {
  const timer = useTimer();
  const generator = useGenerator();
  const board = useSetsBoard();

  const {
    puzzle: { setValue: setPuzzle },
    playState: { setValue: setPlayState },
    customPuzzle: { setValue: setCustomPuzzle },
    userSets: { setValue: setUserSets },
    resetBoard,
  } = board;

  const { isSolver } = generator;
  const { resetTimer, stopTimer } = timer;

  /**
   * Evaluasi berkala untuk memastikan apakah jumlah kombinasi set yang ditemukan user
   * sudah menyamai target jumlah solusi asli yang disimpan oleh teka-teki aktif.
   */
  const isComplete = useMemo(() => {
    if (!board.puzzle.value || !board.userSets.value) return false;
    return board.userSets.value.length === board.puzzle.value.params.targetSets;
  }, [board.puzzle.value, board.userSets.value]);

  useEffect(() => {
    if (isComplete) {
      stopTimer();
    }
  }, [isComplete, stopTimer]);

  /**
   * Efek otomatisasi pemindaian solusi pada mode solver/editor kustom.
   */
  useEffect(() => {
    const isSolverMode = generator.isSolver;
    const customPuzzleData = board.customPuzzle.value;

    if (!isSolverMode || !customPuzzleData?.cards) {
      return;
    }

    const currentCards = customPuzzleData.cards;
    const computedSets = findAllSets(currentCards);

    const newSetsSignature = computedSets
      .map((set) =>
        set
          .map((c) => c.id)
          .sort()
          .join(","),
      )
      .sort()
      .join("|");

    const currentSetsSignature = (customPuzzleData.sets || [])
      .map((set) =>
        set
          .map((c) => c.id)
          .sort()
          .join(","),
      )
      .sort()
      .join("|");

    if (currentSetsSignature === newSetsSignature) {
      return;
    }

    board.customPuzzle.setValue((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sets: computedSets,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generator.isSolver, board.customPuzzle.value?.cards]);

  /**
   * Mengatur pemasangan data teka-teki baru ke dalam papan sekaligus mengosongkan antrean seleksi lama.
   */
  const onPuzzle = useCallback(
    (newPuzzle: SetsPuzzle) => {
      setPuzzle(newPuzzle);
      setPlayState([]);
    },
    [setPuzzle, setPlayState],
  );

  /**
   * Pembungkus fungsi pemecah kalkulasi pencarian matematika yang diandalkan oleh hook useSolver.
   */
  const SetsSolver = useCallback((cards: CardType[]) => findAllSets(cards), []);
  const solver = useSolver(SetsSolver);

  /**
   * Mengembalikan seluruh kesatuan state papan, histori temuan, status solver, dan waktu ke titik awal.
   */
  const resetGame = useCallback(() => {
    resetBoard([]);
    resetTimer();
    setUserSets([]);
    solver.reset();
  }, [resetBoard, resetTimer, solver, setUserSets]);

  /**
   * Menjalankan generator inti untuk membuat formasi teka-teki baru berdasarkan struktur parameter aktif.
   */
  const generatePuzzle = useCallback(
    (seedOverride?: number) => {
      generator.generate({
        levelGenerator,
        tierGenerator,
        onPuzzle,
        onReset: resetGame,
        onError: () => solver.status.setValue("error"),
        seedOverride,
      });
    },
    [generator, onPuzzle, solver.status, resetGame],
  );

  /**
   * Menggeser antrean indeks permainan saat ini untuk memuat teka-teki tantangan berikutnya.
   */
  const loadNextPuzzle = useCallback(() => {
    generator.loadNext({
      levelGenerator,
      tierGenerator,
      diffTiers: SET_TIERS,
      onPuzzle,
      onReset: resetGame,
      onError: () => solver.status.setValue("error"),
    });
  }, [generator, onPuzzle, solver.status, resetGame]);

  /**
   * Menampilkan solusi pemecahan teka-teki secara instan.
   */
  const autoSolve = useCallback(() => {
    const activePuzzle = board.puzzle.value ?? board.customPuzzle.value;

    if (!activePuzzle?.cards) {
      console.warn("[autoSolve] Rejected: Puzzle or grid is not initialized.");
      solver.status.setValue("error");
      return;
    }

    if (activePuzzle.sets) {
      solver.solution.setValue(activePuzzle.sets);
      solver.status.setValue("done");
      solver.toggleVisibility();
      return;
    }

    solver.solve(activePuzzle.cards);
  }, [board.puzzle.value, board.customPuzzle.value, solver]);

  const clearBoard = useCallback(() => {
    setPlayState([]);
    solver.reset();

    if (isSolver) {
      setCustomPuzzle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          cards: [],
          sets: [],
        };
      });
      resetTimer();
    } else {
      setUserSets([]);
    }
  }, [
    isSolver,
    setPlayState,
    setCustomPuzzle,
    setUserSets,
    solver,
    resetTimer,
  ]);

  /**
   * Memoisasi nilai konteks gabungan untuk menjamin tidak ada re-render komponen anak
   */
  const contextValue = useMemo<SetsContextValue>(
    () => ({
      board,
      generator,
      timer,
      solver,
      isComplete,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      autoSolve,
      clearBoard,
    }),
    [
      board,
      generator,
      timer,
      solver,
      isComplete,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      autoSolve,
      clearBoard,
    ],
  );

  return (
    <SetsContext.Provider value={contextValue}>{children}</SetsContext.Provider>
  );
}
