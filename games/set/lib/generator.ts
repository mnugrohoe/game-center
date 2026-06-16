import { COLORS, COUNTS, SYMBOLS, TEXTURES } from "./constants";
import { setParamsGenerator, type SetParams } from "./difficulty";
import { cardSignature, completeSet, findAllSets } from "./solver";

import { mkRng } from "@/shared/algorithms";
import { createPuzzleGenerator } from "@/shared/utils/generator";
import { CardType, ColorToken, SymbolToken, TextureToken } from "./types";

// =============================================================================
// TYPES
// =============================================================================

export interface SetsPuzzle {
  cards: CardType[];
  sets: [CardType, CardType, CardType][];
  params: SetParams;
  metrics: BoardMetrics;
}

export interface BoardMetrics {
  cards: number;
  totalSets: number;
  deadCards: number;
  overlapAverage: number;
  overlapMax: number;
}

// =============================================================================
// CONFIG & UTILS
// =============================================================================

const MAX_STEPS_FACTOR = 30; // Diturunkan karena delta update sangat cepat konvergen

function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function getScopedTokens<T>(
  arr: readonly T[],
  controlFactor: number,
  rng: () => number,
): readonly T[] {
  const count = Math.max(2, Math.ceil(arr.length * controlFactor));
  if (count >= arr.length) return arr;

  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled.slice(0, count);
}

export function generateCustomCard(
  rng: () => number,
  allowedSymbols: readonly SymbolToken[],
  allowedColors: readonly ColorToken[],
  allowedTextures: readonly TextureToken[],
): CardType {
  const card: Omit<CardType, "id"> = {
    symbol: pick(allowedSymbols, rng),
    color: pick(allowedColors, rng),
    texture: pick(allowedTextures, rng),
    count: pick(COUNTS, rng),
  };

  return {
    id: cardSignature(card),
    ...card,
  };
}

// =============================================================================
// CORE GENERATOR ENGINE
// =============================================================================

function createInitialBoard(
  size: number,
  rng: () => number,
  allowedSymbols: readonly SymbolToken[],
  allowedColors: readonly ColorToken[],
  allowedTextures: readonly TextureToken[],
): CardType[] {
  const board: CardType[] = [];
  const used = new Set<string>();

  let safety = 0;
  const maxSafety = size * 40;

  while (board.length < size && safety++ < maxSafety) {
    const card = generateCustomCard(
      rng,
      allowedSymbols,
      allowedColors,
      allowedTextures,
    );
    if (used.has(card.id)) continue;
    used.add(card.id);
    board.push(card);
  }

  return board;
}

/**
 * Fungsi pembantu untuk memperbarui cache list SET secara incremental (O(N))
 * Menghapus SET yang mengandung kartu lama, dan menyuntikkan SET baru dari kartu pengganti.
 */
function updateSetsIncrementally(
  currentSets: [CardType, CardType, CardType][],
  board: CardType[],
  oldCardId: string,
  newCard: CardType,
): [CardType, CardType, CardType][] {
  // 1. Filter buang semua susunan SET yang mengandung ID kartu lama
  const nextSets = currentSets.filter(
    (s) =>
      s[0].id !== oldCardId && s[1].id !== oldCardId && s[2].id !== oldCardId,
  );

  // 2. Cari SET baru yang terbentuk dari kombinasi `newCard` dengan pasangan kartu lain di board (O(N))
  // Karena newCard dipasangkan dengan sisa board, ini mendeteksi pihak ke-3 secara matematis
  const cardMap = new Map<string, CardType>(board.map((c) => [c.id, c]));

  for (let i = 0; i < board.length; i++) {
    const cardA = board[i];
    if (cardA.id === oldCardId || cardA.id === newCard.id) continue;

    const needed = completeSet(newCard, cardA);
    const match = cardMap.get(needed.id);

    // Pastikan kartu ketiga ada di board, bukan kartu lama, dan bukan cardA/newCard itu sendiri
    if (
      match &&
      match.id !== oldCardId &&
      match.id !== cardA.id &&
      match.id !== newCard.id
    ) {
      // Masukkan ke array dengan urutan indeks yang stabil untuk menghindari duplikasi
      const combo: [CardType, CardType, CardType] = [newCard, cardA, match];

      // Cegah pencatatan ganda ganda (karena loop mendatangi cardA dan match secara bergantian)
      const alreadyAdded = nextSets.some(
        (s) =>
          (s[0].id === combo[0].id ||
            s[1].id === combo[0].id ||
            s[2].id === combo[0].id) &&
          (s[0].id === combo[1].id ||
            s[1].id === combo[1].id ||
            s[2].id === combo[1].id) &&
          (s[0].id === combo[2].id ||
            s[1].id === combo[2].id ||
            s[2].id === combo[2].id),
      );

      if (!alreadyAdded) {
        nextSets.push(combo);
      }
    }
  }

  return nextSets;
}

function optimizeBoard(
  params: SetParams,
  initialBoard: CardType[],
  rng: () => number,
): CardType[] {
  const board = [...initialBoard];
  const boardIdSet = new Set<string>(board.map((c) => c.id));

  const minSets = params.targetSets;
  const maxSets = params.targetSets + params.maxExtraSets;

  // JALANKAN SOLVER UTUH HANYA SATU KALI DI AWAL! (Hemat beban CPU raksasa)
  let activeSets = findAllSets(board);
  const maxSteps = params.totalCards * MAX_STEPS_FACTOR;

  for (let step = 0; step < maxSteps; step++) {
    const currentSetsCount = activeSets.length;

    if (currentSetsCount >= minSets && currentSetsCount <= maxSets) {
      break;
    }

    // Bangun map statistik penggunaan kartu berdasarkan cache activeSets
    const usage = new Map<string, number>();
    for (let i = 0; i < activeSets.length; i++) {
      const s = activeSets[i];
      usage.set(s[0].id, (usage.get(s[0].id) ?? 0) + 1);
      usage.set(s[1].id, (usage.get(s[1].id) ?? 0) + 1);
      usage.set(s[2].id, (usage.get(s[2].id) ?? 0) + 1);
    }

    let replaceTarget: CardType;

    if (currentSetsCount < minSets) {
      // KASUS 1: Kekurangan SET -> Cari kartu mati (dead card) atau usage terendah
      const dead = board.filter((c) => !usage.has(c.id));
      if (dead.length > 0 && rng() > params.overlapFactor / 4.0) {
        replaceTarget = pick(dead, rng);
      } else {
        let minUsage = Infinity;
        let candidate = board[0];
        for (let i = 0; i < board.length; i++) {
          const u = usage.get(board[i].id) ?? 0;
          if (u < minUsage) {
            minUsage = u;
            candidate = board[i];
          }
        }
        replaceTarget = candidate;
      }

      // Ambil 2 pasang acak dari board untuk dipaksa membentuk SET baru
      const highUsageCards = board.filter((c) => (usage.get(c.id) ?? 0) > 0);
      const poolA =
        highUsageCards.length > 1 && rng() < 0.7 ? highUsageCards : board;
      const a = pick(poolA, rng);

      let b = board[0];
      for (let i = 0; i < board.length; i++) {
        const potentialB = board[Math.floor(rng() * board.length)];
        if (potentialB.id !== a.id) {
          b = potentialB;
          break;
        }
      }

      const needed = completeSet(a, b);
      if (boardIdSet.has(needed.id)) continue;

      const targetIdx = board.findIndex((c) => c.id === replaceTarget.id);
      if (targetIdx !== -1) {
        // INCREMENTAL UPDATE: Update cache SET tanpa panggil solver utuh
        activeSets = updateSetsIncrementally(
          activeSets,
          board,
          replaceTarget.id,
          needed,
        );
        boardIdSet.delete(replaceTarget.id);
        boardIdSet.add(needed.id);
        board[targetIdx] = needed;
      }
    } else {
      // KASUS 2: Kelebihan SET -> Rusak kartu penyumbang terbanyak
      let maxUsage = -1;
      let candidate: CardType | null = null;
      for (let i = 0; i < board.length; i++) {
        const u = usage.get(board[i].id) ?? 0;
        if (u > maxUsage) {
          maxUsage = u;
          candidate = board[i];
        }
      }

      if (!candidate || maxUsage === 0) break;
      replaceTarget = candidate;

      const fallbackCard = generateCustomCard(rng, SYMBOLS, COLORS, TEXTURES);
      if (boardIdSet.has(fallbackCard.id)) continue;

      const targetIdx = board.findIndex((c) => c.id === replaceTarget.id);
      if (targetIdx !== -1) {
        // INCREMENTAL UPDATE: Update cache SET tanpa panggil solver utuh
        activeSets = updateSetsIncrementally(
          activeSets,
          board,
          replaceTarget.id,
          fallbackCard,
        );
        boardIdSet.delete(replaceTarget.id);
        boardIdSet.add(fallbackCard.id);
        board[targetIdx] = fallbackCard;
      }
    }
  }

  return board;
}

// =============================================================================
// METRICS RUNNER & PUBLIC MATCHERS
// =============================================================================

function analyzeBoard(
  cards: CardType[],
  sets: [CardType, CardType, CardType][],
): BoardMetrics {
  const usage = new Map<string, number>();
  for (let i = 0; i < sets.length; i++) {
    const s = sets[i];
    usage.set(s[0].id, (usage.get(s[0].id) ?? 0) + 1);
    usage.set(s[1].id, (usage.get(s[1].id) ?? 0) + 1);
    usage.set(s[2].id, (usage.get(s[2].id) ?? 0) + 1);
  }

  let deadCards = 0;
  for (let i = 0; i < cards.length; i++) {
    if (!usage.has(cards[i].id)) deadCards++;
  }

  let sum = 0;
  let max = 0;
  for (const v of usage.values()) {
    sum += v;
    if (v > max) max = v;
  }

  return {
    cards: cards.length,
    totalSets: sets.length,
    deadCards,
    overlapAverage: cards.length ? sum / cards.length : 0,
    overlapMax: max,
  };
}

export function generateSet(params: SetParams): SetsPuzzle {
  const rng = mkRng(params.seed);

  const allowedSymbols = getScopedTokens(SYMBOLS, params.entropy, rng);
  const allowedTextures = getScopedTokens(TEXTURES, params.entropy, rng);
  const allowedColors = getScopedTokens(COLORS, params.visualNoise, rng);

  const initial = createInitialBoard(
    params.totalCards,
    rng,
    allowedSymbols,
    allowedColors,
    allowedTextures,
  );
  const board = optimizeBoard(params, initial, rng);

  // Ambil list final satu kali di akhir untuk keaslian laporan object output
  const finalSets = findAllSets(board);

  return {
    cards: board,
    sets: finalSets,
    params,
    metrics: analyzeBoard(board, finalSets),
  };
}

export const setGenerator = createPuzzleGenerator(
  generateSet,
  setParamsGenerator,
);
