export const DECISIONS_MODEL = 'gemini-decision-1';
export const DECISIONS_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/decisions';
export const DECISIONS_SERVER_PROXY_PATH = '/api/decisions';

export type ImageResolution = 'low' | 'medium' | 'high' | 'ultra_high';

export type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      mime_type: string;
      data?: string;
      uri?: string;
      resolution?: ImageResolution;
    }
  | { type: 'audio'; mime_type: string; data?: string; uri?: string }
  | { type: 'video'; mime_type: string; data?: string; uri?: string }
  | {
      type: 'document';
      mime_type: 'application/pdf' | 'text/csv';
      data?: string;
      uri?: string;
    };

export type DecisionInput = string | ContentBlock | ContentBlock[];

export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria?: {
    true_description?: string;
    false_description?: string;
  };
}

export interface ChoiceQuestion {
  type: 'choice';
  instructions: string;
  criteria: Record<string, string | null>;
}

export interface ScoreQuestion {
  type: 'score';
  instructions: string;
  criteria: string[];
}

export type Question = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export interface NoulAnswer {
  type: 'noul';
  noul: number;
  confidence: number;
  applicability?: number;
  value?: boolean;
  true_probability?: number;
  false_probability?: number;
}

export interface ChoiceAnswer {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
  applicability?: number;
}

export interface ScoreAnswer {
  type: 'score';
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
  applicability?: number;
  variance?: number;
  most_likely_level?: number;
}

export type Answer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export interface DecisionUsage {
  input_tokens?: number;
  output_tokens?: number;
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_tokens?: number;
  input_tokens_by_modality?: Array<{ modality: string; tokens: number }>;
}

export interface DecisionProxyErrorInfo {
  status?: number;
  code?: string;
  message?: string;
}

export interface DecisionResponse {
  id?: string;
  model?: string;
  answers?: Record<string, Answer>;
  prompt_feedback?: {
    block_reason?: string;
    safety_ratings?: Array<{ category: string; probability: string }>;
  };
  usage?: DecisionUsage;
  __decisionsProxyError?: DecisionProxyErrorInfo;
}

export class DecisionsClientError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = 'DECISIONS_ERROR', status = 500) {
    super(message);
    this.name = 'DecisionsClientError';
    this.code = code;
    this.status = status;
  }
}

export function estimateLeafBranches(questions: Record<string, Question>): number {
  let branches = 0;
  for (const q of Object.values(questions)) {
    if (q.type === 'noul') branches += 9;
    else if (q.type === 'choice') branches += Object.keys(q.criteria).length;
    else branches += q.criteria.length;
  }
  return branches;
}

export function readInputTokens(usage?: DecisionUsage): number {
  if (!usage) return 0;
  return usage.total_input_tokens ?? usage.input_tokens ?? usage.total_tokens ?? 0;
}

export function readOutputTokens(usage?: DecisionUsage): number {
  if (!usage) return 0;
  return usage.total_output_tokens ?? usage.output_tokens ?? 0;
}

export function readConfiguredApiKey(): string {
  try {
    return process.env.GEMINI_API_KEY || '';
  } catch {
    return '';
  }
}

export function defaultApiKey(): string {
  return readConfiguredApiKey().trim();
}

interface DecisionErrorEnvelope {
  error?: {
    message?: string;
  };
}

const SERVER_UPDATING_MESSAGE =
  'Live sketch reader is updating — refresh in a few seconds and try again.';

function extractErrorMessage(status: number, rawText: string, code?: string): string {
  if (code === 'NO_API_KEY' || status === 503) {
    return rawText;
  }
  if (/^\s*</.test(rawText)) {
    return SERVER_UPDATING_MESSAGE;
  }
  try {
    const parsed = JSON.parse(rawText) as DecisionErrorEnvelope;
    if (parsed && parsed.error && parsed.error.message) {
      return `Decisions API HTTP ${status}: ${parsed.error.message}`;
    }
  } catch {
    // Keep raw text when response body is not JSON
  }
  return `Decisions API HTTP ${status}: ${rawText}`;
}

function parseDecisionPayload(rawText: string): DecisionResponse {
  let payload: DecisionResponse = {};
  try {
    payload = JSON.parse(rawText) as DecisionResponse;
  } catch {
    throw new DecisionsClientError(SERVER_UPDATING_MESSAGE, 'NON_JSON', 502);
  }
  if (!payload || typeof payload !== 'object') {
    throw new DecisionsClientError(SERVER_UPDATING_MESSAGE, 'NON_JSON', 502);
  }
  return payload;
}

export async function createDecision(
  input: DecisionInput,
  questions: Record<string, Question>,
  apiKey: string = defaultApiKey(),
  signal?: AbortSignal,
): Promise<DecisionResponse> {
  const branches = estimateLeafBranches(questions);
  if (branches >= 1000) {
    throw new DecisionsClientError(
      `Question map expands ${branches} leaf branches; stay below 1000.`,
      'BRANCH_LIMIT',
      400,
    );
  }
  const isBrowser = typeof window !== 'undefined';
  const trimmedKey = (apiKey || '').trim();
  if (!isBrowser && !trimmedKey) {
    throw new DecisionsClientError(
      'GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in AI Studio Secrets or environment.',
      'NO_API_KEY',
      503,
    );
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (
    trimmedKey &&
    trimmedKey !== 'MY_GEMINI_API_KEY' &&
    trimmedKey !== 'MY_DECISIONS_API_KEY'
  ) {
    headers['x-goog-api-key'] = trimmedKey;
  }
  const response = await fetch(
    isBrowser ? DECISIONS_SERVER_PROXY_PATH : DECISIONS_ENDPOINT,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: DECISIONS_MODEL,
        input,
        questions,
      }),
      signal,
    },
  );
  const rawText = await response.text();
  if (!response.ok) {
    let errCode = 'HTTP_ERROR';
    let errStatus = response.status;
    let errMsg = extractErrorMessage(response.status, rawText);
    try {
      const parsedErr = JSON.parse(rawText) as DecisionResponse & {
        error?: { code?: string; status?: number; message?: string };
      };
      const proxyErr = parsedErr.__decisionsProxyError ?? parsedErr.error;
      if (proxyErr && typeof proxyErr === 'object') {
        if (typeof proxyErr.code === 'string' && proxyErr.code) {
          errCode = proxyErr.code;
        }
        if (typeof proxyErr.status === 'number') {
          errStatus = proxyErr.status;
        }
        if (typeof proxyErr.message === 'string' && proxyErr.message) {
          errMsg = extractErrorMessage(errStatus, proxyErr.message, errCode);
        }
      }
    } catch {
      // Keep raw HTTP error message when body is non-JSON
    }
    throw new DecisionsClientError(errMsg, errCode, errStatus);
  }
  const payload = parseDecisionPayload(rawText);
  if (payload.__decisionsProxyError) {
    const pErr = payload.__decisionsProxyError;
    const status = pErr.status ?? 502;
    const code = pErr.code ?? 'UPSTREAM_ERROR';
    throw new DecisionsClientError(
      extractErrorMessage(
        status,
        pErr.message ?? 'Decisions proxy request failed.',
        code,
      ),
      code,
      status,
    );
  }
  if (payload.prompt_feedback?.block_reason) {
    throw new DecisionsClientError(
      `Sketch blocked by safety filter: ${payload.prompt_feedback.block_reason}`,
      'SAFETY_BLOCKED',
      400,
    );
  }
  return payload;
}
