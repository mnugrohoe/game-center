"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSets } from "../hooks/SetContext";
import SetsLogo from "./Logo";
import { SetCard, SetTripletCards } from "./Card";
import { EmptyGrid } from "@/shared/components/ui/Grid";
import { Divider } from "@/shared/components/ui/primitive";
import { T } from "@/shared/components/ui/tokens";
import { CardType } from "../lib/types";
import { isValidSet } from "../lib/validator";
import { cn } from "@/shared/utils/cn";

/**
 * Representasi deretan status evaluasi saat 3 buah kartu sedang divalidasi oleh sistem.
 */
type SetMatchStatus = "SELECTING" | "NOT_A_SET" | "SET_FOUND" | "DUPLICATE";

/**
 * Membandingkan dua tumpukan kelompok triplet kartu secara deterministik berdasarkan urutan ID.
 * Mengembalikan nilai true jika kedua kelompok mengandung komponen kartu yang sama persis.
 *
 * @param tripletA - Kelompok triplet kartu pertama yang akan diuji.
 * @param tripletB - Kelompok triplet kartu kedua sebagai pembanding.
 * @returns Status kecocokan struktur ID dari kedua triplet.
 */
const isDuplicateTriplet = (
  tripletA: CardType[],
  tripletB: CardType[],
): boolean => {
  const idsA = tripletA
    .map((c) => c.id)
    .sort()
    .join(",");
  const idsB = tripletB
    .map((c) => c.id)
    .sort()
    .join(",");
  return idsA === idsB;
};

/**
 * Komponen papan utama permainan SETS. Mengelola visualisasi kartu acak di grid,
 * penanganan seleksi kartu interaktif oleh pengguna, penayangan status validasi,
 * hingga integrasi visualisasi solusi otomatis (solver mode).
 *
 * @component
 * @export
 */
export default function SetsBoard() {
  const [status, setStatus] = useState<SetMatchStatus>("SELECTING");

  const { board, generator, timer, solver, isComplete } = useSets();
  const { isSolver } = generator;
  const { puzzle, customPuzzle } = board;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Menentukan basis data teka-teki (puzzle) yang aktif berdasarkan mode permainan saat ini.
   */
  const activePuzzle = isSolver ? customPuzzle.value : puzzle.value;

  /**
   * Mengkalkulasi daftar baris kombinasi kartu (triplet) yang harus dirender pada bar teratas.
   * Sumber data berpindah secara dinamis antara hasil temuan user atau kunci jawaban global.
   */
  const displayedSets = useMemo<[CardType, CardType, CardType][]>(() => {
    if (solver.isVisible.value && puzzle.value?.sets) {
      return puzzle.value.sets as [CardType, CardType, CardType][];
    }

    if (generator.isSolver && customPuzzle.value?.sets) {
      return customPuzzle.value.sets as [CardType, CardType, CardType][];
    }

    return (board.userSets.value || []) as [CardType, CardType, CardType][];
  }, [
    board.userSets.value,
    solver.isVisible.value,
    customPuzzle.value?.sets,
    generator.isSolver,
    puzzle.value?.sets,
  ]);

  /**
   * Mengatur siklus otomatisasi pembersihan tumpukan seleksi kartu (playState)
   * sesaat setelah sistem selesai menampilkan indikator status visual (sukses/gagal/duplikat).
   */
  useEffect(() => {
    if (isComplete) {
      timeoutRef.current = setTimeout(() => {
        board.playState.setValue([]);
        setStatus("SELECTING");
      }, 200);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status, isComplete, board.playState]);

  /**
   * Mengatur penambahan atau pengurangan kartu ke dalam antrean seleksi lokal (playState)
   * ketika sebuah kartu di papan diklik oleh pengguna.
   *
   * @param card - Entitas objek kartu yang memicu aksi klik.
   */
  const handleClick = (card: CardType) => {
    let currentSelected = board.playState.value;

    if (isSolver) return;

    if (timer.elapsedTime === 0) {
      timer.startTimer();
    }

    if (status === "SET_FOUND") {
      currentSelected = [];
      setStatus("SELECTING");
    }

    const isExist = currentSelected.some((c) => c.id === card.id);
    let updatedCards: CardType[] = [];

    if (isExist) {
      updatedCards = currentSelected.filter((c) => c.id !== card.id);
    } else {
      if (currentSelected.length < 3) {
        updatedCards = [...currentSelected, card];
      } else {
        return;
      }
    }

    if (updatedCards.length === 3) {
      const valid = isValidSet(updatedCards);

      if (valid) {
        const alreadyDiscovered = board.userSets.value.some((existingTriplet) =>
          isDuplicateTriplet(updatedCards, existingTriplet),
        );

        if (alreadyDiscovered) {
          setStatus("DUPLICATE");
        } else {
          setStatus("SET_FOUND");
          const triplet = updatedCards as [CardType, CardType, CardType];
          board.userSets.setValue((prev) => [...prev, triplet]);
        }
      } else {
        setStatus("NOT_A_SET");
      }
    } else {
      setStatus("SELECTING");
    }

    board.playState.setValue(updatedCards);
  };

  const handleRemove = (card: CardType) => {
    if (!isSolver || !customPuzzle.value?.cards) return;

    customPuzzle.setValue((prev) => {
      if (!prev) return prev;
      const newCards = (prev.cards || []).filter((c) => c.id !== card.id);

      return {
        ...prev,
        cards: newCards,
      };
    });
  };

  if (!activePuzzle) {
    return <EmptyGrid logo={SetsLogo} name="Sets" />;
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-4 w-full h-full p-4 overflow-hidden select-none">
      <div
        className="flex w-full shrink-0 items-center justify-between gap-6 p-2 rounded-xs border"
        style={{ backgroundColor: `${T.bg3}50`, borderColor: `${T.text3}88` }}
      >
        <div className="flex flex-1 items-center justify-start gap-4 flex-nowrap overflow-x-auto py-1 px-1 scrollbar-thin scrollbar-thumb-gold-600 min-h-28">
          {displayedSets.length > 0 ? (
            displayedSets.map((triplet, i) => {
              const isHighlighted =
                !isSolver &&
                solver.isVisible.value &&
                board.userSets.value.some((userTriplet) =>
                  isDuplicateTriplet(userTriplet, triplet),
                );

              return (
                <SetTripletCards
                  key={`${i}-${triplet[0]?.id}`}
                  cards={triplet}
                  highlighted={isHighlighted}
                />
              );
            })
          ) : (
            <div className="flex flex-col flex-1 items-center justify-center text-center px-4 h-full">
              <span
                className="text-sm font-medium text-zinc-400"
                style={{ fontFamily: T.font }}
              >
                {isSolver
                  ? "No valid SET combinations found on the current custom board."
                  : solver.isVisible.value
                    ? "This board contains exactly 0 SETs! Load a new puzzle."
                    : "Find and select 3 cards to form your first SET!"}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1">
                {isSolver
                  ? "Add more cards using the generator panel to activate matching loops."
                  : solver.isVisible.value
                    ? "Bad luck with the generation seed! Skip this board."
                    : "Matches you discover will be logged here."}
              </span>
            </div>
          )}
        </div>

        {!isSolver && (
          <div
            className="flex shrink-0 flex-col items-center justify-center gap-2 border-l pl-4 min-w-25"
            style={{ borderColor: `${T.text3}88` }}
          >
            <SetTripletCards
              cards={board.playState.value}
              className={cn(
                status === "SET_FOUND" && "border-teal-500 bg-teal-500/5",
                status === "DUPLICATE" && "border-orange-300 bg-orange-300/5",
                status === "NOT_A_SET" && "border-orange-700 bg-orange-700/5",
              )}
            />
            <span
              className={cn(
                "text-xs text-muted font-medium tracking-wide border bg-raised px-2 py-0.5 rounded-2xs",
                status === "SET_FOUND" && "text-teal-500 border-teal-500/20",
                status === "DUPLICATE" &&
                  "text-orange-300 border-orange-300/20",
                status === "NOT_A_SET" &&
                  "text-orange-700 border-orange-700/20",
              )}
            >
              {status}
            </span>
          </div>
        )}
      </div>

      <Divider style={{ height: 1, width: "100%" }} />

      <div className="flex-1 w-full overflow-y-auto min-h-0 flex flex-col scrollbar-thin scrollbar-thumb-gold-600">
        {activePuzzle.cards && activePuzzle.cards.length > 0 ? (
          <div className="flex flex-wrap gap-4 items-center justify-center pb-6 pt-1">
            {activePuzzle.cards.map((c) => (
              <SetCard
                key={c.id}
                card={c}
                onClick={handleClick}
                selected={
                  board.playState.value.some(
                    (selectedCard) => selectedCard.id === c.id,
                  ) && status !== "SET_FOUND"
                }
                onRemove={isSolver ? handleRemove : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col flex-1 items-center justify-center border-2 border-dashed border-zinc-800 rounded-sm p-8 text-center mx-auto w-full bg-surface/20">
            <div
              className="text-xl font-bold mb-2 tracking-wide text-gold-500"
              style={{ fontFamily: T.font }}
            >
              {isSolver ? "Custom Board Empty" : "No Puzzle Loaded"}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {isSolver
                ? "Your workspace is ready. Use the parameters panel on the left side to select card properties and click the '+ Add card' button to build your test set."
                : "Something went wrong while generating the matrix. Please click 'New Puzzle' on the right panel to re-roll."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
