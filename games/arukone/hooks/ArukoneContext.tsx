"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import useTimer, { UseTimerReturn } from "@/shared/hooks/useTimer";
import useGenerator, { UseGeneratorReturn } from "@/shared/hooks/useGenerator";
import useArukoneBoard, { type UseArukoneBoardReturn } from "./useArukoneBoard";
import {
  ARUKONE_TIERS,
  arukoneGenerator,
  validateArukone,
  type ArukonePuzzle,
} from "../lib";
import useArukoneSolver, { UseArukoneSolverReturn } from "./useArukoneSolver";

/**
 * Struktur data nilai konteks global yang disediakan oleh ArukoneProvider.
 */
interface ArukoneContextValue {
  /** Manajemen state papan permainan utama. */
  board: UseArukoneBoardReturn;
  /** Mesin pembuat (generator) teka-teki berdasarkan level/kesulitan. */
  generator: UseGeneratorReturn;
  /** Pelacak durasi waktu permainan berjalan. */
  timer: UseTimerReturn;
  /** Solver Management */
  solver: UseArukoneSolverReturn;
  /** Status bendera penanda apakah permainan saat ini telah selesai dipecahkan. */
  validation: ReturnType<typeof validateArukone>;
  /** Mengembalikan seluruh state permainan, baris pilihan, dan waktu kembali ke awal. */
  resetGame: () => void;
  /** Memicu pembuatan instansiasi struktur teka-teki baru berdasarkan konfigurasi aktif. */
  generatePuzzle: (seedOverride?: number) => void;
  /** Melompati sesi saat ini dan memuat teka-teki berikutnya dari antrean tingkat kesulitan. */
  loadNextPuzzle: () => void;
  /** Menghitung solusi instan menggunakan pemecah algoritma pencarian bawaan. */
  autoSolve: () => void;
  /** Membersihkan tumpukan kartu pilihan serta merearukone papan editor kustom. */
  clearBoard: () => void;
}

const ArukoneContext = createContext<ArukoneContextValue | null>(null);

/**
 * Hook kustom untuk mengakses seluruh state dan metode operasional game SETS.
 * Harus digunakan di dalam lingkup komponen yang dibungkus oleh `ArukoneProvider`.
 *
 * @throws {Error} Jika hook dipanggil di luar komponen `ArukoneProvider`.
 * @returns Seluruh nilai konteks operasional game SETS.
 */
export function useArukone() {
  const context = useContext(ArukoneContext);
  if (!context) {
    throw new Error("useArukone must be used within a ArukoneProvider");
  }
  return context;
}

/**
 * Membuat instansiasi teka-teki SETS baru berdasarkan urutan indeks level numerik tertentu.
 */
function levelGenerator(level: number): ArukonePuzzle {
  const puzzle = arukoneGenerator.byLevel(level);
  if (!puzzle) {
    throw new Error(`Failed to generate Arukone puzzle at level ${level}`);
  }
  return puzzle;
}

/**
 * Membuat instansiasi teka-teki SETS baru berdasarkan tier tingkat kesulitan dan nilai seed pengacak.
 */
function tierGenerator(tierIdx: number, seed: number): ArukonePuzzle {
  const puzzle = arukoneGenerator.byTier(tierIdx, seed);
  if (!puzzle) {
    throw new Error(`Failed to generate Arukone puzzle at tier ${tierIdx}`);
  }
  return puzzle;
}

/**
 * Komponen Provider utama yang mengisolasi, mengotomatisasi, dan menyebarkan
 * seluruh state manajemen game SETS ke seluruh rantai komponen anak di bawahnya.
 */
export function ArukoneProvider({ children }: { children: React.ReactNode }) {
  const timer = useTimer();
  const generator = useGenerator();
  const board = useArukoneBoard();
  const solver = useArukoneSolver();

  const [debouncedPlayState, setDebouncedPlayState] = useState(
    board.playState.value,
  );

  const { stopTimer, resetTimer } = timer;

  /**
   * Evaluasi berkala untuk memastikan apakah jumlah kombinasi arukone yang ditemukan user
   * sudah menyamai target jumlah solusi asli yang disimpan oleh teka-teki aktif.
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      if (board.swapSegments && board.swapSegments.length > 0) {
        const order = board.swapSegments[0].order;
        setDebouncedPlayState(order);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [board.playState.value, board.swapSegments]);

  useEffect(() => {
    if (!generator.isSolver) return;
    solver.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.customPuzzle.value]);

  // 1. Dapatkan hasil validasi langsung saat render (Tanpa State)
  const validation = useMemo(() => {
    if (!board.puzzle.value || !debouncedPlayState) {
      // Return nilai default jika belum siap
      return {
        isComplete: false,
        isSequenceError: false,
        reachedClue: 0,
        expectedNextClue: null,
        filledCellCount: 0,
        requiredCellCount: 0,
      };
    }

    return validateArukone(
      debouncedPlayState,
      board.puzzle.value.grid,
      board.puzzle.value.walls,
    );
  }, [board.puzzle.value, debouncedPlayState]);

  // 2. Gunakan useEffect HANYA untuk side effect (stopTimer)
  useEffect(() => {
    if (validation.isComplete) {
      stopTimer();
    }
  }, [validation.isComplete, stopTimer]); // Hanya bereaksi jika status selesai berubah

  // 3. Gunakan 'validation' langsung di komponen Anda

  /**
   * Mengatur pemasangan data teka-teki baru ke dalam papan sekaligus mengosongkan antrean seleksi lama.
   */
  const onPuzzle = useCallback(
    (newPuzzle: ArukonePuzzle) => {
      board.puzzle.setValue(newPuzzle);
      board.playState.setValue([]);
    },
    [board.puzzle, board.playState],
  );

  /**
   * Mengembalikan seluruh kesatuan state papan, histori temuan, status solver, dan waktu ke titik awal.
   */
  const resetGame = useCallback(() => {
    board.resetBoard([]);
    solver.reset();
    resetTimer();
  }, [board, solver, resetTimer]);

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
        seedOverride,
      });
    },
    [generator, onPuzzle, resetGame],
  );

  /**
   * Menggeser antrean indeks permainan saat ini untuk memuat teka-teki tantangan berikutnya.
   */
  const loadNextPuzzle = useCallback(() => {
    generator.loadNext({
      levelGenerator,
      tierGenerator,
      diffTiers: ARUKONE_TIERS,
      onPuzzle,
      onReset: resetGame,
    });
  }, [generator, onPuzzle, resetGame]);

  /**
   * Menampilkan solusi pemecahan teka-teki secara instan.
   */
  const autoSolve = useCallback(() => {
    if (generator.isSolver) {
      const custom = board.customPuzzle.value;
      if (!custom?.rows || !custom?.cols) {
        solver.status.setValue("error");
        solver.statusMsg.setValue("No custom board to solve");
        return;
      }
      solver.solve({
        rows: custom.rows,
        cols: custom.cols,
        grid: custom.grid ?? {},
        walls: custom.walls ?? [],
      });
      return;
    }

    if (board.puzzle.value) {
      solver.solution.setValue(board.puzzle.value.solutionPath);
      solver.status.setValue("done");
      solver.toggleVisibility();
      return;
    }

    solver.status.setValue("error");
    solver.statusMsg.setValue("Puzzle don't have solution");
  }, [
    board.puzzle.value,
    board.customPuzzle.value,
    generator.isSolver,
    solver,
  ]);

  const clearBoard = useCallback(() => {
    if (generator.isSolver) {
      const prev = board.customPuzzle.value;
      if (!prev) return;
      board.customPuzzle.setValue({ ...prev, grid: {}, walls: [] });
      return;
    }
    board.playState.setValue([]);
  }, [board.playState, board.customPuzzle, generator.isSolver]);

  /**
   * Memoisasi nilai konteks gabungan untuk menjamin tidak ada re-render komponen anak
   */
  const contextValue = useMemo<ArukoneContextValue>(
    () => ({
      board,
      generator,
      solver,
      timer,
      validation,
      autoSolve,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      clearBoard,
    }),
    [
      board,
      generator,
      solver,
      timer,
      validation,
      autoSolve,
      resetGame,
      generatePuzzle,
      loadNextPuzzle,
      clearBoard,
    ],
  );

  return (
    <ArukoneContext.Provider value={contextValue}>
      {children}
    </ArukoneContext.Provider>
  );
}
