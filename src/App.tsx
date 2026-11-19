import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CELEBRATION_HOLD_MS,
  CHOICE_OPTION_LIMIT,
  DEFAULT_DIFFICULTY,
  DIFFICULTY_ORDER,
  DIFFICULTY_SPECS,
  INK_HEX,
  LIVE_HOLD_DEBOUNCE_MS,
  MIN_INK_PATH_PX,
  PAPER_HEX,
  ROUNDS_PER_RUN,
  SNAPSHOT_DIMENSION_PX,
  buildBlindSketchInput,
  buildRoundQuestionBundle,
  dealFiveRoundSet,
  type DifficultyId,
  type RoundQuestionBundle,
  type SketchWord,
} from './blueprint';
import { DecisionsClientError, createDecision } from './lib/decisionsClient';
import {
  clamp01,
  computeTotalInkLengthPx,
  computeVelocityBrushWidth,
  evaluateSketchResponse,
  formatPercent,
  formatSeconds,
  type SketchEvaluation,
  type SketchHunch,
  type SketchPoint,
  type SketchStroke,
} from './lib/sketchJudge';

type RoundPhase = 'playing' | 'won' | 'timeout' | 'skipped' | 'summary';
type RoundOutcome = 'won' | 'timeout' | 'skipped';

interface RoundRecord {
  readonly roundNumber: number;
  readonly target: SketchWord;
  readonly outcome: RoundOutcome;
  readonly elapsedSec: number;
  readonly bestGuessLabel: string;
  readonly bestGuessProbability: number;
  readonly thumbnailDataUrl: string;
}

const THUMB_WIDTH = 480;
const THUMB_HEIGHT = 320;

function paintStrokesOntoContext(
  ctx: CanvasRenderingContext2D,
  strokes: readonly SketchStroke[],
  drawWidth: number,
  drawHeight: number,
  widthMultiplier = 1,
): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = INK_HEX;
  ctx.fillStyle = INK_HEX;

  for (const stroke of strokes) {
    const pts = stroke.points;
    if (pts.length === 0) continue;

    if (pts.length === 1) {
      const p = pts[0];
      const r = Math.max(1.8, p.w * 0.52 * widthMultiplier);
      ctx.beginPath();
      ctx.arc(p.x * drawWidth, p.y * drawHeight, r, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }

    if (pts.length === 2) {
      const p0 = pts[0];
      const p1 = pts[1];
      ctx.lineWidth = (p0.w + p1.w) * 0.5 * widthMultiplier;
      ctx.beginPath();
      ctx.moveTo(p0.x * drawWidth, p0.y * drawHeight);
      ctx.lineTo(p1.x * drawWidth, p1.y * drawHeight);
      ctx.stroke();
      continue;
    }

    // Smooth quadratic midpoint spline with velocity width taper
    const first = pts[0];
    const second = pts[1];
    const firstMidX = (first.x + second.x) * 0.5 * drawWidth;
    const firstMidY = (first.y + second.y) * 0.5 * drawHeight;
    ctx.lineWidth = first.w * widthMultiplier;
    ctx.beginPath();
    ctx.moveTo(first.x * drawWidth, first.y * drawHeight);
    ctx.lineTo(firstMidX, firstMidY);
    ctx.stroke();

    for (let i = 1; i < pts.length - 1; i += 1) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const next = pts[i + 1];
      const startMidX = (prev.x + curr.x) * 0.5 * drawWidth;
      const startMidY = (prev.y + curr.y) * 0.5 * drawHeight;
      const endMidX = (curr.x + next.x) * 0.5 * drawWidth;
      const endMidY = (curr.y + next.y) * 0.5 * drawHeight;

      ctx.lineWidth = curr.w * widthMultiplier;
      ctx.beginPath();
      ctx.moveTo(startMidX, startMidY);
      ctx.quadraticCurveTo(
        curr.x * drawWidth,
        curr.y * drawHeight,
        endMidX,
        endMidY,
      );
      ctx.stroke();
    }

    const penult = pts[pts.length - 2];
    const last = pts[pts.length - 1];
    const lastMidX = (penult.x + last.x) * 0.5 * drawWidth;
    const lastMidY = (penult.y + last.y) * 0.5 * drawHeight;
    ctx.lineWidth = last.w * widthMultiplier;
    ctx.beginPath();
    ctx.moveTo(lastMidX, lastMidY);
    ctx.lineTo(last.x * drawWidth, last.y * drawHeight);
    ctx.stroke();
  }
}

function renderFittedSnapshotDataUrl(
  strokes: readonly SketchStroke[],
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  paddingPx: number,
  strokeBoost: number,
  bgHex = PAPER_HEX,
): string {
  const offscreen = document.createElement('canvas');
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  if (strokes.length > 0 && sourceWidth > 0 && sourceHeight > 0) {
    const availW = Math.max(40, targetWidth - paddingPx * 2);
    const availH = Math.max(40, targetHeight - paddingPx * 2);
    const fit = Math.min(availW / sourceWidth, availH / sourceHeight);
    const fittedW = sourceWidth * fit;
    const fittedH = sourceHeight * fit;
    const ox = (targetWidth - fittedW) * 0.5;
    const oy = (targetHeight - fittedH) * 0.5;

    ctx.save();
    ctx.translate(ox, oy);
    paintStrokesOntoContext(
      ctx,
      strokes,
      fittedW,
      fittedH,
      Math.max(0.75, fit * strokeBoost),
    );
    ctx.restore();
  }

  return offscreen.toDataURL('image/png');
}

export default function App() {
  const [difficulty, setDifficulty] = useState<DifficultyId>(DEFAULT_DIFFICULTY);
  const [runSalt, setRunSalt] = useState<number>(1);
  const [deck, setDeck] = useState<SketchWord[]>(() =>
    dealFiveRoundSet({ difficulty: DEFAULT_DIFFICULTY, firstRun: true }),
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [phase, setPhase] = useState<RoundPhase>('playing');
  const [strokeCount, setStrokeCount] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [remainingSec, setRemainingSec] = useState(
    DIFFICULTY_SPECS[DEFAULT_DIFFICULTY].durationSec,
  );
  const [liveEval, setLiveEval] = useState<SketchEvaluation | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [apiNotice, setApiNotice] = useState<string | null>(null);
  const [records, setRecords] = useState<RoundRecord[]>([]);

  const spec = DIFFICULTY_SPECS[difficulty];
  const currentWord = deck[roundIndex] ?? deck[0];

  const roundBundle = useMemo<RoundQuestionBundle>(
    () =>
      buildRoundQuestionBundle(
        currentWord,
        difficulty,
        runSalt * 31 + roundIndex,
      ),
    [currentWord, difficulty, roundIndex, runSalt],
  );

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasCssSizeRef = useRef<{ width: number; height: number }>({
    width: 680,
    height: 416,
  });
  const strokesRef = useRef<SketchStroke[]>([]);
  const activeStrokeRef = useRef<SketchStroke | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  const phaseRef = useRef<RoundPhase>(phase);
  phaseRef.current = phase;
  const difficultyRef = useRef<DifficultyId>(difficulty);
  difficultyRef.current = difficulty;
  const currentWordRef = useRef<SketchWord>(currentWord);
  currentWordRef.current = currentWord;
  const roundBundleRef = useRef<RoundQuestionBundle>(roundBundle);
  roundBundleRef.current = roundBundle;
  const roundIndexRef = useRef<number>(roundIndex);
  roundIndexRef.current = roundIndex;
  const deckRef = useRef<SketchWord[]>(deck);
  deckRef.current = deck;
  const seenDifficultiesRef = useRef<Set<DifficultyId>>(
    new Set([DEFAULT_DIFFICULTY]),
  );

  const roundStartPerfRef = useRef<number | null>(null);
  const pausedElapsedMsRef = useRef<number>(0);
  const bestGuessRef = useRef<SketchHunch | null>(null);

  interface PendingSnapshot {
    readonly base64Png: string;
    readonly roundToken: number;
    readonly bundle: RoundQuestionBundle;
  }

  // Coalescing single-in-flight /api/decisions queue state
  const roundTokenRef = useRef<number>(1);
  const inFlightRef = useRef<boolean>(false);
  const pendingSnapshotRef = useRef<PendingSnapshot | null>(null);
  const lastLiveHoldEvalPerfRef = useRef<number>(0);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }, []);

  const repaintCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width));
    const cssH = Math.max(1, Math.round(rect.height));
    canvasCssSizeRef.current = { width: cssW, height: cssH };

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetPixelW = Math.round(cssW * dpr);
    const targetPixelH = Math.round(cssH * dpr);
    if (canvas.width !== targetPixelW || canvas.height !== targetPixelH) {
      canvas.width = targetPixelW;
      canvas.height = targetPixelH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = PAPER_HEX;
    ctx.fillRect(0, 0, cssW, cssH);

    const allStrokes = activeStrokeRef.current
      ? [...strokesRef.current, activeStrokeRef.current]
      : strokesRef.current;
    paintStrokesOntoContext(ctx, allStrokes, cssW, cssH, 1);
  }, []);

  useEffect(() => {
    repaintCanvas();
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => {
      repaintCanvas();
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [repaintCanvas, phase]);

  const computeElapsedSecondsNow = useCallback((): number => {
    const durationSec = DIFFICULTY_SPECS[difficultyRef.current].durationSec;
    const liveMs =
      roundStartPerfRef.current !== null
        ? performance.now() - roundStartPerfRef.current
        : 0;
    const totalSec = (pausedElapsedMsRef.current + liveMs) / 1000;
    return Math.min(durationSec, Math.max(0, totalSec));
  }, []);

  const captureThumbnailDataUrl = useCallback((): string => {
    const { width, height } = canvasCssSizeRef.current;
    const combined = activeStrokeRef.current
      ? [...strokesRef.current, activeStrokeRef.current]
      : strokesRef.current;
    return renderFittedSnapshotDataUrl(
      combined,
      width,
      height,
      THUMB_WIDTH,
      THUMB_HEIGHT,
      20,
      1.15,
      '#F2F7FD',
    );
  }, []);

  const captureBlindModelPngBase64 = useCallback((): string => {
    const { width, height } = canvasCssSizeRef.current;
    const combined = activeStrokeRef.current
      ? [...strokesRef.current, activeStrokeRef.current]
      : strokesRef.current;
    const dataUrl = renderFittedSnapshotDataUrl(
      combined,
      width,
      height,
      SNAPSHOT_DIMENSION_PX,
      SNAPSHOT_DIMENSION_PX,
      16,
      1.32,
    );
    const commaIdx = dataUrl.indexOf(',');
    return commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : '';
  }, []);

  const stepToNextRoundOrSummary = useCallback(() => {
    clearAutoAdvanceTimer();
    roundTokenRef.current += 1;
    pendingSnapshotRef.current = null;
    activeStrokeRef.current = null;
    activePointerIdRef.current = null;

    const nextIdx = roundIndexRef.current + 1;
    if (nextIdx >= ROUNDS_PER_RUN) {
      setPhase('summary');
      setIsReading(false);
      return;
    }

    const durationSec = DIFFICULTY_SPECS[difficultyRef.current].durationSec;
    strokesRef.current = [];
    roundStartPerfRef.current = null;
    pausedElapsedMsRef.current = 0;
    bestGuessRef.current = null;
    lastLiveHoldEvalPerfRef.current = 0;

    setRoundIndex(nextIdx);
    setPhase('playing');
    setStrokeCount(0);
    setTimerStarted(false);
    setRemainingSec(durationSec);
    setLiveEval(null);
    setIsReading(false);
    setApiNotice(null);
    window.requestAnimationFrame(() => repaintCanvas());
  }, [clearAutoAdvanceTimer, repaintCanvas]);

  const concludeCurrentRound = useCallback(
    (
      outcome: RoundOutcome,
      winningEval?: SketchEvaluation,
      immediateAdvance = false,
    ) => {
      if (phaseRef.current !== 'playing') return;

      clearAutoAdvanceTimer();
      roundTokenRef.current += 1;
      pendingSnapshotRef.current = null;

      if (
        activeStrokeRef.current &&
        activeStrokeRef.current.points.length > 0
      ) {
        strokesRef.current = [...strokesRef.current, activeStrokeRef.current];
      }
      activeStrokeRef.current = null;
      activePointerIdRef.current = null;

      const durationSec = DIFFICULTY_SPECS[difficultyRef.current].durationSec;
      const rawElapsed = computeElapsedSecondsNow();
      const elapsedSec =
        outcome === 'timeout'
          ? durationSec
          : outcome === 'won'
            ? Math.max(0.1, rawElapsed)
            : rawElapsed;

      roundStartPerfRef.current = null;
      pausedElapsedMsRef.current = elapsedSec * 1000;
      setRemainingSec(Math.max(0, durationSec - elapsedSec));
      setIsReading(false);
      repaintCanvas();

      const target = currentWordRef.current;
      let bestLabel = 'No guess yet';
      let bestProb = 0;

      if (outcome === 'won' && winningEval) {
        bestLabel = target.label;
        bestProb = winningEval.targetProbability;
      } else if (
        bestGuessRef.current &&
        bestGuessRef.current.probability > 0
      ) {
        bestLabel = bestGuessRef.current.label;
        bestProb = bestGuessRef.current.probability;
      }

      const record: RoundRecord = {
        roundNumber: roundIndexRef.current + 1,
        target,
        outcome,
        elapsedSec,
        bestGuessLabel: bestLabel,
        bestGuessProbability: bestProb,
        thumbnailDataUrl: captureThumbnailDataUrl(),
      };

      setRecords((prev) => {
        const filtered = prev.filter(
          (r) => r.roundNumber !== record.roundNumber,
        );
        return [...filtered, record];
      });

      if (immediateAdvance) {
        stepToNextRoundOrSummary();
        return;
      }

      const nextPhase: RoundPhase = outcome;
      phaseRef.current = nextPhase;
      setPhase(nextPhase);

      autoAdvanceTimerRef.current = window.setTimeout(() => {
        stepToNextRoundOrSummary();
      }, CELEBRATION_HOLD_MS);
    },
    [
      captureThumbnailDataUrl,
      clearAutoAdvanceTimer,
      computeElapsedSecondsNow,
      repaintCanvas,
      stepToNextRoundOrSummary,
    ],
  );

  // Smooth 60 fps countdown loop (runs strictly after first stroke while round is 'playing')
  useEffect(() => {
    if (phase !== 'playing' || !timerStarted) return undefined;
    let rafId = 0;
    const tick = () => {
      if (phaseRef.current !== 'playing') return;
      const durationSec = DIFFICULTY_SPECS[difficultyRef.current].durationSec;
      const elapsed = computeElapsedSecondsNow();
      const rem = Math.max(0, durationSec - elapsed);
      setRemainingSec(rem);
      if (rem <= 0) {
        concludeCurrentRound('timeout');
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [computeElapsedSecondsNow, concludeCurrentRound, phase, timerStarted]);

  useEffect(() => () => clearAutoAdvanceTimer(), [clearAutoAdvanceTimer]);

  const pumpDecisionQueue = useCallback(async () => {
    if (inFlightRef.current) return;
    const job = pendingSnapshotRef.current;
    if (!job) return;
    pendingSnapshotRef.current = null;

    if (
      job.roundToken !== roundTokenRef.current ||
      phaseRef.current !== 'playing'
    ) {
      setIsReading(false);
      return;
    }

    inFlightRef.current = true;
    setIsReading(true);
    const t0 = performance.now();

    try {
      const response = await createDecision(
        buildBlindSketchInput(job.base64Png),
        job.bundle.questions,
      );

      if (
        job.roundToken !== roundTokenRef.current ||
        phaseRef.current !== 'playing'
      ) {
        return;
      }

      const dt = Math.round(performance.now() - t0);
      const evaluation = evaluateSketchResponse(
        response,
        job.bundle.pool,
        job.bundle.pool.difficulty,
      );

      setApiNotice(null);
      setLatencyMs(dt);
      setLiveEval(evaluation);

      const leadHunch = evaluation.topHunches[0];
      if (
        !evaluation.isWrittenWordsCheat &&
        leadHunch &&
        leadHunch.probability > (bestGuessRef.current?.probability ?? 0)
      ) {
        bestGuessRef.current = leadHunch;
      }

      if (evaluation.isSolved) {
        concludeCurrentRound('won', evaluation);
      }
    } catch (err) {
      console.error('Sketch evaluation failed:', err);
      if (
        job.roundToken !== roundTokenRef.current ||
        phaseRef.current !== 'playing'
      ) {
        return;
      }
      if (err instanceof DecisionsClientError && err.code === 'NO_API_KEY') {
        // Pause timer calmly so an unkeyed preview never burns the player's clock
        if (roundStartPerfRef.current !== null) {
          pausedElapsedMsRef.current +=
            performance.now() - roundStartPerfRef.current;
          roundStartPerfRef.current = null;
          setTimerStarted(false);
        }
        setApiNotice(err.message);
      } else {
        setApiNotice(
          err instanceof Error
            ? err.message
            : 'Could not score sketch stroke.',
        );
      }
    } finally {
      inFlightRef.current = false;
      const nextJob = pendingSnapshotRef.current as PendingSnapshot | null;
      if (
        nextJob &&
        nextJob.roundToken === roundTokenRef.current &&
        phaseRef.current === 'playing'
      ) {
        void pumpDecisionQueue();
      } else {
        setIsReading(false);
      }
    }
  }, [concludeCurrentRound]);

  const queueBlindEvaluationIfInkReady = useCallback(() => {
    if (phaseRef.current !== 'playing') return;
    const { width, height } = canvasCssSizeRef.current;
    const allStrokes = activeStrokeRef.current
      ? [...strokesRef.current, activeStrokeRef.current]
      : strokesRef.current;
    const totalInkPx = computeTotalInkLengthPx(allStrokes, width, height);
    if (totalInkPx < MIN_INK_PATH_PX) return;

    const base64Png = captureBlindModelPngBase64();
    if (!base64Png) return;

    pendingSnapshotRef.current = {
      base64Png,
      roundToken: roundTokenRef.current,
      bundle: roundBundleRef.current,
    };
    void pumpDecisionQueue();
  }, [captureBlindModelPngBase64, pumpDecisionQueue]);

  interface CanvasPointerEvt {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly button: number;
    readonly clientX: number;
    readonly clientY: number;
    readonly currentTarget: EventTarget & HTMLCanvasElement;
    preventDefault(): void;
  }

  const readNormalizedPoint = (
    e: CanvasPointerEvt,
    prevPoint?: SketchPoint,
  ): SketchPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const x = clamp01((e.clientX - rect.left) / w);
    const y = clamp01((e.clientY - rect.top) / h);
    const t = performance.now();

    if (!prevPoint) {
      return { x, y, t, w: 5.4 };
    }
    const dx = (x - prevPoint.x) * w;
    const dy = (y - prevPoint.y) * h;
    const dist = Math.hypot(dx, dy);
    const dt = Math.max(1, t - prevPoint.t);
    const targetW = computeVelocityBrushWidth(dist / dt);
    const smoothedW = prevPoint.w * 0.64 + targetW * 0.36;
    return { x, y, t, w: smoothedW };
  };

  const handlePointerDown = (e: CanvasPointerEvt) => {
    if (phaseRef.current !== 'playing') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic automation pointers may not hold an active pointerId slot
    }

    if (roundStartPerfRef.current === null) {
      roundStartPerfRef.current = performance.now();
      lastLiveHoldEvalPerfRef.current = roundStartPerfRef.current;
      setTimerStarted(true);
    }

    const pt = readNormalizedPoint(e);
    activePointerIdRef.current = e.pointerId;
    activeStrokeRef.current = { points: [pt] };
    repaintCanvas();
  };

  const handlePointerMove = (e: CanvasPointerEvt) => {
    if (phaseRef.current !== 'playing') return;
    if (activePointerIdRef.current !== e.pointerId) return;
    const current = activeStrokeRef.current;
    if (!current) return;

    const pts = current.points;
    const prev = pts[pts.length - 1];
    const nextPt = readNormalizedPoint(e, prev);

    const { width, height } = canvasCssSizeRef.current;
    const stepPx = Math.hypot(
      (nextPt.x - prev.x) * width,
      (nextPt.y - prev.y) * height,
    );
    if (stepPx < 1.6) return;

    pts.push(nextPt);
    repaintCanvas();

    const now = performance.now();
    if (now - lastLiveHoldEvalPerfRef.current >= LIVE_HOLD_DEBOUNCE_MS) {
      lastLiveHoldEvalPerfRef.current = now;
      queueBlindEvaluationIfInkReady();
    }
  };

  const finishActiveStroke = (e: CanvasPointerEvt) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Safe no-op when pointer capture already released
    }

    const finished = activeStrokeRef.current;
    activeStrokeRef.current = null;
    activePointerIdRef.current = null;

    if (!finished || finished.points.length === 0) return;
    if (phaseRef.current !== 'playing') return;

    strokesRef.current = [...strokesRef.current, finished];
    setStrokeCount(strokesRef.current.length);
    repaintCanvas();

    lastLiveHoldEvalPerfRef.current = performance.now();
    queueBlindEvaluationIfInkReady();
  };

  const handleUndo = () => {
    if (phaseRef.current !== 'playing' || strokesRef.current.length === 0) {
      return;
    }
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    repaintCanvas();

    const { width, height } = canvasCssSizeRef.current;
    if (
      computeTotalInkLengthPx(strokesRef.current, width, height) <
      MIN_INK_PATH_PX
    ) {
      roundTokenRef.current += 1;
      pendingSnapshotRef.current = null;
      setIsReading(false);
      setLiveEval(null);
      return;
    }
    queueBlindEvaluationIfInkReady();
  };

  const handleClear = () => {
    if (phaseRef.current !== 'playing' || strokesRef.current.length === 0) {
      return;
    }
    roundTokenRef.current += 1;
    pendingSnapshotRef.current = null;
    strokesRef.current = [];
    activeStrokeRef.current = null;
    activePointerIdRef.current = null;
    setStrokeCount(0);
    setIsReading(false);
    setLiveEval(null);
    repaintCanvas();
  };

  const handleSkip = () => {
    if (phaseRef.current !== 'playing') return;
    concludeCurrentRound('skipped', undefined, true);
  };

  const beginRunAtDifficulty = (
    nextDifficulty: DifficultyId,
    isFirstVisitForTier: boolean,
  ) => {
    clearAutoAdvanceTimer();
    roundTokenRef.current += 1;
    pendingSnapshotRef.current = null;
    strokesRef.current = [];
    activeStrokeRef.current = null;
    activePointerIdRef.current = null;
    roundStartPerfRef.current = null;
    pausedElapsedMsRef.current = 0;
    bestGuessRef.current = null;
    lastLiveHoldEvalPerfRef.current = 0;

    const prevIds = deckRef.current.map((w) => w.id);
    const nextDeck = dealFiveRoundSet({
      difficulty: nextDifficulty,
      firstRun: isFirstVisitForTier,
      excludeIds: isFirstVisitForTier ? [] : prevIds,
    });
    const nextDuration = DIFFICULTY_SPECS[nextDifficulty].durationSec;

    difficultyRef.current = nextDifficulty;
    phaseRef.current = 'playing';

    setDifficulty(nextDifficulty);
    setRunSalt((s) => s + 1);
    setDeck(nextDeck);
    setRoundIndex(0);
    setRecords([]);
    setPhase('playing');
    setStrokeCount(0);
    setTimerStarted(false);
    setRemainingSec(nextDuration);
    setLiveEval(null);
    setIsReading(false);
    setApiNotice(null);
    window.requestAnimationFrame(() => repaintCanvas());
  };

  const handleSelectDifficulty = (nextDifficulty: DifficultyId) => {
    if (nextDifficulty === difficultyRef.current && phaseRef.current !== 'summary') {
      return;
    }
    const firstForTier = !seenDifficultiesRef.current.has(nextDifficulty);
    seenDifficultiesRef.current.add(nextDifficulty);
    beginRunAtDifficulty(nextDifficulty, firstForTier);
  };

  const startFreshFiveRoundRun = () => {
    beginRunAtDifficulty(difficultyRef.current, false);
  };

  const solvedRecords = records.filter((r) => r.outcome === 'won');
  const solvedCount = solvedRecords.length;
  const fastestSolvedSec =
    solvedRecords.length > 0
      ? Math.min(...solvedRecords.map((r) => r.elapsedSec))
      : null;
  const latestRecord = records.find((r) => r.roundNumber === roundIndex + 1);

  const timerProgress = clamp01(remainingSec / spec.durationSec);
  const urgentCutoff = Math.max(4, Math.round(spec.durationSec * 0.28));
  const warmCutoff = Math.round(spec.durationSec * 0.6);
  const timerToneClass =
    remainingSec <= urgentCutoff
      ? 'timer-urgent'
      : remainingSec <= warmCutoff
        ? 'timer-warm'
        : 'timer-calm';

  const winPctNumber = Math.round(spec.winThreshold * 100);
  const winGoalLabel = `${winPctNumber}%`;

  const displayedHunches: Array<SketchHunch | null> = [
    liveEval?.topHunches[0] ?? null,
    liveEval?.topHunches[1] ?? null,
    liveEval?.topHunches[2] ?? null,
  ];

  const targetInTopThree = Boolean(
    liveEval?.topHunches.some((h) => h.isTarget),
  );
  const leadRival = liveEval?.topHunches.find((h) => !h.isTarget) ?? null;

  let targetCoachCopy: string | null = null;
  if (liveEval && !liveEval.isWrittenWordsCheat && phase === 'playing') {
    if (!targetInTopThree) {
      targetCoachCopy = `Target: ${currentWord.label} · ${formatPercent(liveEval.targetProbability)} (#${liveEval.targetObjectRank}) — need ${winGoalLabel} #1`;
    } else if (
      liveEval.topHunches[0] &&
      !liveEval.topHunches[0].isTarget
    ) {
      targetCoachCopy = `Target: ${currentWord.label} · ${formatPercent(liveEval.targetProbability)} (#${liveEval.targetObjectRank}) — beat ${liveEval.topHunches[0].label} to ${winGoalLabel} #1`;
    } else if (leadRival) {
      targetCoachCopy = `Target: ${currentWord.label} leads at ${formatPercent(liveEval.targetProbability)} — reach ${winGoalLabel} #1`;
    }
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <p className="brand-mark">
          Speed Sketch, a real-time sketch recognition powered by the Gemini Decisions API
        </p>
        <div
          className="diff-switch"
          role="group"
          aria-label="Sketch difficulty"
        >
          {DIFFICULTY_ORDER.map((id) => {
            const item = DIFFICULTY_SPECS[id];
            const active = difficulty === id;
            return (
              <button
                key={id}
                type="button"
                className={`btn-diff ${active ? 'btn-diff-active' : ''}`}
                aria-pressed={active}
                onClick={() => handleSelectDifficulty(id)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="main-stage">
        {phase === 'summary' ? (
          <>
            <div className="prompt-bar summary-prompt-bar">
              <h1 className="prompt-heading">
                <span className="prompt-verb">Run score</span>{' '}
                <span className="prompt-word">
                  {`${solvedCount} of ${ROUNDS_PER_RUN} solved`}
                </span>
              </h1>
              <button
                type="button"
                className="btn-primary"
                onClick={startFreshFiveRoundRun}
              >
                Play 5 new words
              </button>
            </div>

            <section className="gallery-card" aria-label="Five sketch gallery">
              <div className="gallery-summary-head">
                <h2 className="panel-heading">Your 5 sketches</h2>
                <p className="gallery-recap">
                  {fastestSolvedSec !== null
                    ? `Fastest solve in ${formatSeconds(fastestSolvedSec)} against ${CHOICE_OPTION_LIMIT} options`
                    : `No ${winGoalLabel} #1 locks this run — draw five fresh prompts`}
                </p>
              </div>

              <div className="gallery-grid">
                {deck.map((word, idx) => {
                  const rec = records.find((r) => r.roundNumber === idx + 1);
                  const isWon = rec?.outcome === 'won';
                  const isTimeout = rec?.outcome === 'timeout';
                  return (
                    <article
                      key={`${word.id}-${idx}`}
                      className={`gallery-item ${isWon ? 'gallery-item-won' : ''}`}
                    >
                      <div className="gallery-thumb-frame">
                        {rec?.thumbnailDataUrl ? (
                          <img
                            src={rec.thumbnailDataUrl}
                            alt={`Your sketch for ${word.label}`}
                            className="sketch-thumb-img"
                          />
                        ) : (
                          <div className="empty-thumb">Blank canvas</div>
                        )}
                      </div>
                      <h3 className="gallery-word">{word.label}</h3>
                      <p
                        className={`gallery-verdict ${isWon ? 'verdict-won' : 'verdict-miss'}`}
                      >
                        {isWon && rec
                          ? `Got it · ${formatPercent(rec.bestGuessProbability)} in ${formatSeconds(rec.elapsedSec)}`
                          : isTimeout && rec
                            ? rec.bestGuessProbability > 0
                              ? `Time up · ${rec.bestGuessLabel} ${formatPercent(rec.bestGuessProbability)}`
                              : 'Time up · No hunch'
                            : 'Skipped'}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="prompt-bar">
              <h1 className="prompt-heading">
                <span className="prompt-verb">Draw:</span>{' '}
                <span className="prompt-word">{currentWord.label}</span>
              </h1>
              <div className={`timer-readout ${timerToneClass}`}>
                {formatSeconds(remainingSec)}
              </div>
            </div>

            <div className="stage-grid">
              <section className="sketchpad-card" aria-label="Drawing sketchpad">
                <div className="timer-track" aria-hidden="true">
                  <div
                    className="timer-fill"
                    style={{ transform: `scaleX(${timerProgress})` }}
                  />
                </div>

                <div className="canvas-wrap">
                  <canvas
                    ref={canvasRef}
                    className="sketch-canvas"
                    aria-label={`Drawing canvas for ${currentWord.label}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={finishActiveStroke}
                    onPointerCancel={finishActiveStroke}
                  />

                  {phase === 'won' && latestRecord && (
                    <div
                      className="round-banner round-banner-won"
                      role="status"
                      aria-live="assertive"
                    >
                      <div className="banner-copy">
                        <strong className="banner-title">
                          {`Got it! ${latestRecord.target.label} · ${formatPercent(latestRecord.bestGuessProbability)} in ${formatSeconds(latestRecord.elapsedSec)}`}
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="btn-banner-next"
                        onClick={stepToNextRoundOrSummary}
                      >
                        {roundIndex + 1 >= ROUNDS_PER_RUN
                          ? 'View gallery'
                          : 'Next word'}
                      </button>
                    </div>
                  )}

                  {phase === 'timeout' && latestRecord && (
                    <div
                      className="round-banner round-banner-timeout"
                      role="status"
                      aria-live="assertive"
                    >
                      <div className="banner-copy">
                        <strong className="banner-title">
                          {latestRecord.bestGuessProbability > 0
                            ? `Time's up! Best guess: ${latestRecord.bestGuessLabel} (${formatPercent(latestRecord.bestGuessProbability)})`
                            : `Time's up! Word was ${latestRecord.target.label}`}
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="btn-banner-next"
                        onClick={stepToNextRoundOrSummary}
                      >
                        {roundIndex + 1 >= ROUNDS_PER_RUN
                          ? 'View gallery'
                          : 'Next word'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pad-toolbar">
                  <span className="pad-state">
                    {phase === 'won' && latestRecord
                      ? `Recognized in ${formatSeconds(latestRecord.elapsedSec)}`
                      : phase === 'timeout'
                        ? 'Round ended'
                        : !timerStarted
                          ? `${spec.durationSec}s clock starts on first stroke`
                          : isReading
                            ? 'Reading strokes...'
                            : `${strokeCount} ${strokeCount === 1 ? 'stroke' : 'strokes'} on paper`}
                  </span>

                  <div className="pad-actions">
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={handleUndo}
                      disabled={phase !== 'playing' || strokeCount === 0}
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      className="btn-tool"
                      onClick={handleClear}
                      disabled={phase !== 'playing' || strokeCount === 0}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="btn-tool btn-skip"
                      onClick={handleSkip}
                      disabled={phase !== 'playing'}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </section>

              <aside className="side-stack" aria-label="Live AI hunches and progress">
                <section className="side-card hunch-card">
                  <div className="card-head hunch-card-head">
                    <h2 className="panel-heading">Live hunches</h2>
                    <span className="hunch-meta">
                      {isReading
                        ? 'Looking...'
                        : latencyMs !== null
                          ? `${latencyMs} ms · ${winGoalLabel} #1`
                          : `Need ${winGoalLabel} #1`}
                    </span>
                  </div>

                  <p className="pool-caption">
                    {`${CHOICE_OPTION_LIMIT} live options (${spec.verySimilarCount} close twins · ${spec.similarCount} shape cousins · ${spec.genericCount} general)`}
                  </p>

                  {liveEval?.isWrittenWordsCheat && (
                    <p className="cheat-alert" role="alert">
                      No spelling — draw it!
                    </p>
                  )}

                  {apiNotice && (
                    <p className="api-notice" role="status">
                      {apiNotice}
                    </p>
                  )}

                  <div className="hunch-list">
                    {displayedHunches.map((hunch, idx) => {
                      const pct = hunch ? clamp01(hunch.probability) * 100 : 0;
                      const roundedPct = Math.round(pct);
                      const barWidth =
                        hunch && (roundedPct >= 1 || hunch.probability > 0.004)
                          ? Math.min(100, Math.max(5, pct))
                          : 0;
                      const isMatch = Boolean(
                        hunch?.isTarget && phase === 'won',
                      );
                      const isTargetTracking = Boolean(
                        hunch?.isTarget && !liveEval?.isWrittenWordsCheat,
                      );
                      return (
                        <div
                          key={hunch ? `${idx}-${hunch.id}` : `empty-${idx}`}
                          className={`hunch-row ${isMatch ? 'hunch-row-won' : ''}`}
                        >
                          <p className="hunch-label-line">
                            <span className="hunch-name">
                              {hunch ? hunch.label : `Hunch ${idx + 1}`}
                            </span>
                            <span className="hunch-pct">
                              {hunch ? formatPercent(hunch.probability) : '—'}
                            </span>
                          </p>
                          <div className="hunch-track" aria-hidden="true">
                            <div
                              className={`hunch-bar ${
                                isMatch
                                  ? 'hunch-bar-won'
                                  : isTargetTracking
                                    ? 'hunch-bar-warm'
                                    : ''
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                            {idx === 0 && (
                              <span
                                className="hunch-goal-tick"
                                style={{ left: `${winPctNumber}%` }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {targetCoachCopy && (
                    <p className="target-status" aria-live="polite">
                      {targetCoachCopy}
                    </p>
                  )}
                </section>

                <section className="side-card trophy-card">
                  <div className="card-head">
                    <h2 className="panel-heading">5-round strip</h2>
                    <span className="hunch-meta">
                      {`R${roundIndex + 1}/${ROUNDS_PER_RUN} · ${solvedCount} won`}
                    </span>
                  </div>

                  <div className="trophy-grid">
                    {deck.map((word, idx) => {
                      const rec = records.find((r) => r.roundNumber === idx + 1);
                      const isCurrent = idx === roundIndex;
                      const won = rec?.outcome === 'won';
                      return (
                        <div
                          key={`${word.id}-${idx}`}
                          className={`trophy-slot ${
                            won
                              ? 'trophy-slot-won'
                              : rec
                                ? 'trophy-slot-done'
                                : isCurrent
                                  ? 'trophy-slot-active'
                                  : ''
                          }`}
                        >
                          <div className="trophy-thumb">
                            {rec?.thumbnailDataUrl ? (
                              <img
                                src={rec.thumbnailDataUrl}
                                alt={rec.target.label}
                                className="sketch-thumb-img"
                              />
                            ) : (
                              <span className="trophy-num">{idx + 1}</span>
                            )}
                          </div>
                          <span className="trophy-caption">
                            {rec
                              ? won
                                ? formatSeconds(rec.elapsedSec)
                                : 'Miss'
                              : isCurrent
                                ? 'Now'
                                : `R${idx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
