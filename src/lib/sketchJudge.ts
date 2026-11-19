import {
  CHEAT_PROBABILITY_THRESHOLD,
  DIFFICULTY_SPECS,
  MIN_INK_PATH_PX,
  RANDOM_SCRIBBLE_KEY,
  UNFINISHED_LINES_KEY,
  WORD_BY_ID,
  type DifficultyId,
  type PoolComposition,
  type SketchWord,
} from '../blueprint';
import type { ChoiceAnswer, DecisionResponse, NoulAnswer } from './decisionsClient';

export interface SketchPoint {
  /** Normalized [0..1] X coordinate on the canvas */
  readonly x: number;
  /** Normalized [0..1] Y coordinate on the canvas */
  readonly y: number;
  /** Timestamp in ms from performance.now() */
  readonly t: number;
  /** Tapered brush width in CSS px */
  readonly w: number;
}

export interface SketchStroke {
  readonly points: SketchPoint[];
}

export type HunchRelation = 'target' | 'twin' | 'cousin' | 'general';

export interface SketchHunch {
  readonly id: string;
  readonly label: string;
  readonly probability: number;
  readonly isTarget: boolean;
  readonly relation: HunchRelation;
}

export interface SketchEvaluation {
  readonly topHunches: SketchHunch[];
  readonly overallTopKey: string;
  readonly overallTopProbability: number;
  readonly targetProbability: number;
  readonly targetRank: number;
  readonly targetObjectRank: number;
  readonly winThreshold: number;
  readonly unfinishedProbability: number;
  readonly cheatProbability: number;
  readonly isWrittenWordsCheat: boolean;
  readonly isSolved: boolean;
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function computeVelocityBrushWidth(speedPxPerMs: number): number {
  const minW = 3.5;
  const maxW = 6.2;
  const normalized = clamp01(speedPxPerMs / 2.2);
  return maxW - (maxW - minW) * normalized;
}

export function computeStrokeLengthPx(
  stroke: SketchStroke,
  canvasWidthPx: number,
  canvasHeightPx: number,
): number {
  const pts = stroke.points;
  if (pts.length === 0) return 0;
  if (pts.length === 1) return 6;
  let len = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const dx = (pts[i].x - pts[i - 1].x) * canvasWidthPx;
    const dy = (pts[i].y - pts[i - 1].y) * canvasHeightPx;
    len += Math.hypot(dx, dy);
  }
  return len;
}

export function computeTotalInkLengthPx(
  strokes: readonly SketchStroke[],
  canvasWidthPx: number,
  canvasHeightPx: number,
): number {
  let total = 0;
  for (const stroke of strokes) {
    total += computeStrokeLengthPx(stroke, canvasWidthPx, canvasHeightPx);
  }
  return total;
}

export function hasEnoughInkToScore(
  strokes: readonly SketchStroke[],
  canvasWidthPx: number,
  canvasHeightPx: number,
): boolean {
  return (
    computeTotalInkLengthPx(strokes, canvasWidthPx, canvasHeightPx) >=
    MIN_INK_PATH_PX
  );
}

export function evaluateSketchResponse(
  response: DecisionResponse,
  pool: PoolComposition,
  difficulty: DifficultyId = pool.difficulty,
): SketchEvaluation {
  const target: SketchWord = pool.target;
  const winThreshold = DIFFICULTY_SPECS[difficulty].winThreshold;
  const answers = response.answers ?? {};
  const guessAns = answers.sketch_guess as ChoiceAnswer | undefined;
  const cheatAns = answers.written_words_cheat as NoulAnswer | undefined;

  const rawProbs = guessAns?.probabilities ?? {};
  const cheatProbability = clamp01(cheatAns?.noul ?? 0);
  const isWrittenWordsCheat = cheatProbability >= CHEAT_PROBABILITY_THRESHOLD;

  const twinSet = new Set<string>(pool.verySimilarIds);
  const cousinSet = new Set<string>(pool.similarIds);

  const allEntries: Array<[string, number]> = pool.optionKeys.map((key) => [
    key,
    clamp01(rawProbs[key] ?? 0),
  ]);

  allEntries.sort((a, b) => b[1] - a[1]);

  const overallTopKey = allEntries[0]?.[0] ?? UNFINISHED_LINES_KEY;
  const overallTopProbability = allEntries[0]?.[1] ?? 0;

  const targetIdx = allEntries.findIndex(([id]) => id === target.id);
  const targetRank = targetIdx >= 0 ? targetIdx + 1 : allEntries.length;
  const targetProbability = targetIdx >= 0 ? allEntries[targetIdx][1] : 0;

  const unfinishedProbability = clamp01(
    (rawProbs[UNFINISHED_LINES_KEY] ?? 0) +
      (rawProbs[RANDOM_SCRIBBLE_KEY] ?? 0),
  );

  const objectEntries = allEntries.filter(
    ([id]) => id !== UNFINISHED_LINES_KEY && id !== RANDOM_SCRIBBLE_KEY,
  );

  const targetObjIdx = objectEntries.findIndex(([id]) => id === target.id);
  const targetObjectRank =
    targetObjIdx >= 0 ? targetObjIdx + 1 : objectEntries.length;

  const classifyRelation = (id: string): HunchRelation => {
    if (id === target.id) return 'target';
    if (twinSet.has(id)) return 'twin';
    if (cousinSet.has(id)) return 'cousin';
    return 'general';
  };

  const topHunches: SketchHunch[] = objectEntries
    .slice(0, 3)
    .map(([id, prob]) => ({
      id,
      label: WORD_BY_ID[id]?.label ?? id,
      probability: prob,
      isTarget: id === target.id,
      relation: classifyRelation(id),
    }));

  const isSolved =
    !isWrittenWordsCheat &&
    overallTopKey === target.id &&
    targetProbability >= winThreshold;

  return {
    topHunches,
    overallTopKey,
    overallTopProbability,
    targetProbability,
    targetRank,
    targetObjectRank,
    winThreshold,
    unfinishedProbability,
    cheatProbability,
    isWrittenWordsCheat,
    isSolved,
  };
}

export function formatPercent(probability: number): string {
  const clamped = clamp01(probability);
  if (clamped > 0.004 && clamped < 0.01) {
    return '1%';
  }
  const pct = Math.round(clamped * 100);
  return `${pct}%`;
}

export function formatSeconds(seconds: number): string {
  const clamped = Math.max(0, seconds);
  return `${clamped.toFixed(1)}s`;
}
