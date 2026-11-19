import type { IncomingMessage, ServerResponse } from 'node:http';

export const DECISIONS_UPSTREAM_URL: string;
export const DECISIONS_MODEL: string;
export const MAX_BODY_BYTES: number;
export const MAX_PNG_BASE64_CHARS: number;
export const CHOICE_OPTION_LIMIT: number;
export const UNFINISHED_LINES_KEY: string;
export const RANDOM_SCRIBBLE_KEY: string;
export const MISSING_KEY_MESSAGE: string;
export const ALLOWED_SKETCH_OPTION_KEYS: Set<string>;

export function isAllowedRequestOrigin(req: IncomingMessage): boolean;
export function extractClientIpKey(req: IncomingMessage): string;
export function acquireRateLimitSlot(
  ipKey: string,
  now?: number,
): (() => void) | null;
export function resetRateLimitsForTest(): void;
export function sendJsonResponse(
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
  extraHeaders?: Record<string, string>,
): void;
export function sendDecisionsError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
  extraHeaders?: Record<string, string>,
): void;
export function buildVerifiedSketchPayload(
  parsed: unknown,
): { ok: true; upstreamBody: string } | { ok: false; message: string };
export function handleDecisionsPost(
  req: IncomingMessage,
  res: ServerResponse,
  options?: {
    env?: Record<string, string>;
    fetchImpl?: typeof fetch;
  },
): Promise<void>;
