// apps/docs/lib/flow/adapters/types.ts
// Provider layer contract (demo app only — registry components never fetch).
// One interface, six kinds; routes pick the real adapter when its env key is present, else the stub.

export type GenerateKind = "image" | "video" | "speech" | "sfx" | "music" | "llm";

/** Request shape sent from the browser execute() to a /api/generate/<kind> route. */
export interface GenerateRequest {
  kind: GenerateKind;
  /** Primary text: prompt for media, script for speech, lyrics-or-prompt for music, user text for llm. */
  prompt: string;
  /** Resolved upstream outputs keyed by source node id (urls/text the node depends on). */
  inputs?: Record<string, { url?: string; text?: string; kind?: string }>;
  /** Node settings copied from model-bar / node data (voiceId, duration, aspect, loop, promptInfluence, lyrics, model, …). */
  options?: Record<string, unknown>;
}

/** Normalized success result returned to the browser; drives media-slot + node output. */
export interface GenerateResult {
  kind: GenerateKind;
  /** Object URL or remote URL of the produced media; omitted for text/llm. */
  url?: string;
  /** Text payload for llm/text-producing nodes. */
  text?: string;
  /** Which provider served this result, for the env-status pill. */
  provider: "stub" | "live";
}

/** Normalized error — every adapter funnels failures into this; routes return it as JSON with the right status. */
export interface GenerateError {
  code: string;
  message: string;
}

export interface GenerateAdapter {
  kind: GenerateKind;
  generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult>;
}

/** Normalize any thrown value into { code, message }. Reused by every adapter + route. */
export function toGenerateError(err: unknown, fallbackCode = "provider_error"): GenerateError {
  if (err instanceof DOMException && err.name === "AbortError") {
    return { code: "aborted", message: "Generation was cancelled." };
  }
  if (err instanceof Error) return { code: fallbackCode, message: err.message };
  return { code: fallbackCode, message: String(err) };
}

/** True when an upstream fetch Response is not ok; builds a normalized error from it. */
export async function errorFromResponse(res: Response, code: string): Promise<GenerateError> {
  let detail = "";
  try {
    detail = await res.text();
  } catch {
    /* ignore */
  }
  return {
    code,
    message: `${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 200)}` : ""}`,
  };
}
