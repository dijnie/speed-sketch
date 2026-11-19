import type { ContentBlock, Question } from './lib/decisionsClient';
import {
  CHOICE_OPTION_LIMIT,
  DEFAULT_DIFFICULTY,
  DIFFICULTY_ORDER,
  DIFFICULTY_SPECS,
  RANDOM_SCRIBBLE_KEY,
  UNFINISHED_LINES_KEY,
  VISUAL_CATALOG,
  WORD_BY_ID,
  composeTargetOptionPool,
  createSeededRng,
  hashStringSeed,
  shuffleWithRng,
  type DifficultyId,
  type DifficultySpec,
  type PoolComposition,
  type PromptTier,
  type ShapeTag,
  type SketchWord,
  type VisualClusterId,
} from './lib/visualMorphology';

export {
  CHOICE_OPTION_LIMIT,
  DEFAULT_DIFFICULTY,
  DIFFICULTY_ORDER,
  DIFFICULTY_SPECS,
  RANDOM_SCRIBBLE_KEY,
  UNFINISHED_LINES_KEY,
  VISUAL_CATALOG,
  WORD_BY_ID,
  composeTargetOptionPool,
  createSeededRng,
  hashStringSeed,
  type DifficultyId,
  type DifficultySpec,
  type PoolComposition,
  type PromptTier,
  type ShapeTag,
  type SketchWord,
  type VisualClusterId,
};

export const DECK_WORDS: readonly SketchWord[] = VISUAL_CATALOG;
export const DEALABLE_WORDS: readonly SketchWord[] = VISUAL_CATALOG.filter(
  (word) => word.promptTier !== 'none',
);

export const ROUNDS_PER_RUN = 5;
export const ROUND_DURATION_SEC = 30;
export const MIN_INK_PATH_PX = 40;
export const LIVE_HOLD_DEBOUNCE_MS = 650;
export const SNAPSHOT_DIMENSION_PX = 384;
export const WIN_PROBABILITY_THRESHOLD =
  DIFFICULTY_SPECS[DEFAULT_DIFFICULTY].winThreshold;
export const CHEAT_PROBABILITY_THRESHOLD = 0.6;
export const CELEBRATION_HOLD_MS = 1450;

export const INK_HEX = '#0F172A';
export const PAPER_HEX = '#FAFBFD';

export const HARD_SHOWCASE_STARTERS: readonly string[] = [
  'shopping_cart',
  'penny_farthing',
  'saxophone',
  'scorpion',
  'chandelier',
  'cuckoo_clock',
  'hot_air_balloon',
  'gramophone',
  'roller_coaster',
  'microscope',
  'venus_flytrap',
  'pirate_ship',
  'swiss_army_knife',
  'sewing_machine',
  'ferris_wheel',
];

export interface RoundQuestionBundle {
  readonly pool: PoolComposition;
  readonly questions: Record<string, Question>;
}

const BLIND_CHOICE_INSTRUCTIONS =
  'Look closely at this black-ink line drawing on a white sketchpad. Which exact item from the 255 options is drawn? Choose unfinished_lines if only one or two unformed starting strokes exist, or random_scribble if it is chaotic scribbling.';

const UNFINISHED_DESCRIPTION =
  'Just one or two starting strokes, bare shapes, or incomplete sketch';
const SCRIBBLE_DESCRIPTION = 'Messy scribble or unrecognizable blob';

/**
 * Converts an alphabetically sorted 255-key PoolComposition into a `/v1beta/decisions`
 * question map (255 choice + 9 noul = 264 leaf branches < 1,000).
 * Sets `null` descriptions on all 253 concrete snake_case nouns (~490 ms warm latency)
 * and never mentions the target word in instructions or ordering.
 */
export function buildQuestionsFromPool(
  pool: PoolComposition,
): Record<string, Question> {
  const criteria: Record<string, string | null> = {};
  for (const key of pool.optionKeys) {
    if (key === UNFINISHED_LINES_KEY) {
      criteria[key] = UNFINISHED_DESCRIPTION;
    } else if (key === RANDOM_SCRIBBLE_KEY) {
      criteria[key] = SCRIBBLE_DESCRIPTION;
    } else {
      criteria[key] = null;
    }
  }

  return {
    sketch_guess: {
      type: 'choice',
      instructions: BLIND_CHOICE_INSTRUCTIONS,
      criteria,
    },
    written_words_cheat: {
      type: 'noul',
      instructions:
        'Did the player write readable alphabet letters or words spelling out an item instead of drawing a picture?',
      criteria: {
        true_description:
          'Contains readable written alphabet letters or a spelled-out word naming an item',
        false_description: 'Pure line drawing with no spelled-out words',
      },
    },
  };
}

export function buildRoundQuestionBundle(
  target: SketchWord,
  difficulty: DifficultyId = DEFAULT_DIFFICULTY,
  roundSalt = 0,
): RoundQuestionBundle {
  const rng = createSeededRng(
    hashStringSeed(`${target.id}:${difficulty}:${roundSalt}`),
  );
  const pool = composeTargetOptionPool(target, difficulty, rng);
  return {
    pool,
    questions: buildQuestionsFromPool(pool),
  };
}

export function buildBlindSketchInput(base64Png: string): ContentBlock[] {
  return [
    { type: 'text', text: 'Live quick-draw sketchpad snapshot:' },
    {
      type: 'image',
      mime_type: 'image/png',
      data: base64Png,
      resolution: 'low',
    },
  ];
}

function pickDistinctClusterWord(
  candidates: readonly SketchWord[],
  usedIds: Set<string>,
  usedClusters: Set<VisualClusterId>,
  rng: () => number,
): SketchWord {
  const freshClusterMatches = candidates.filter(
    (w) => !usedIds.has(w.id) && !usedClusters.has(w.cluster),
  );
  if (freshClusterMatches.length > 0) {
    return shuffleWithRng(freshClusterMatches, rng)[0];
  }
  const unusedMatches = candidates.filter((w) => !usedIds.has(w.id));
  if (unusedMatches.length > 0) {
    return shuffleWithRng(unusedMatches, rng)[0];
  }
  return shuffleWithRng(DEALABLE_WORDS, rng)[0];
}

export function dealFiveRoundSet(
  options: {
    difficulty?: DifficultyId;
    firstRun?: boolean;
    excludeIds?: readonly string[];
    rng?: () => number;
  } = {},
): SketchWord[] {
  const difficulty = options.difficulty ?? DEFAULT_DIFFICULTY;
  const rng = options.rng ?? Math.random;
  const excluded = new Set<string>(options.excludeIds ?? []);

  const avail = DEALABLE_WORDS.filter((w) => !excluded.has(w.id));
  const pool = avail.length >= ROUNDS_PER_RUN * 3 ? avail : DEALABLE_WORDS;

  const easyWords = pool.filter((w) => w.promptTier === 'easy');
  const mediumWords = pool.filter((w) => w.promptTier === 'medium');
  const hardWords = pool.filter((w) => w.promptTier === 'hard');

  const chosen: SketchWord[] = [];
  const usedIds = new Set<string>();
  const usedClusters = new Set<VisualClusterId>();

  const pushWord = (word: SketchWord) => {
    chosen.push(word);
    usedIds.add(word.id);
    usedClusters.add(word.cluster);
  };

  if (difficulty === 'easy') {
    if (options.firstRun && WORD_BY_ID.bicycle && !excluded.has('bicycle')) {
      pushWord(WORD_BY_ID.bicycle);
    }
    while (chosen.length < ROUNDS_PER_RUN) {
      pushWord(pickDistinctClusterWord(easyWords, usedIds, usedClusters, rng));
    }
    return chosen;
  }

  if (difficulty === 'hard') {
    const showcaseCandidates = HARD_SHOWCASE_STARTERS.map((id) => WORD_BY_ID[id]).filter(
      (w): w is SketchWord => Boolean(w && w.promptTier === 'hard' && !excluded.has(w.id)),
    );
    if (options.firstRun && WORD_BY_ID.shopping_cart) {
      pushWord(WORD_BY_ID.shopping_cart);
    } else if (showcaseCandidates.length > 0) {
      pushWord(shuffleWithRng(showcaseCandidates, rng)[0]);
    }
    while (chosen.length < ROUNDS_PER_RUN) {
      pushWord(pickDistinctClusterWord(hardWords, usedIds, usedClusters, rng));
    }
    return chosen;
  }

  // Medium (default): iconic R1–R2 warm-up with 50 lookalike twins -> spicy R3–R5 challenge
  if (options.firstRun && WORD_BY_ID.bicycle && !excluded.has('bicycle')) {
    pushWord(WORD_BY_ID.bicycle);
  } else {
    pushWord(
      pickDistinctClusterWord(
        [...easyWords, ...mediumWords],
        usedIds,
        usedClusters,
        rng,
      ),
    );
  }
  pushWord(
    pickDistinctClusterWord(
      mediumWords.length > 0 ? mediumWords : easyWords,
      usedIds,
      usedClusters,
      rng,
    ),
  );
  const spiceWords = [...mediumWords, ...hardWords];
  while (chosen.length < ROUNDS_PER_RUN) {
    pushWord(pickDistinctClusterWord(spiceWords, usedIds, usedClusters, rng));
  }
  return chosen;
}
