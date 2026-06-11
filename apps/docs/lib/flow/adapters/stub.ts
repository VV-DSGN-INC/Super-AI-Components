// apps/docs/lib/flow/adapters/stub.ts
// Deterministic, zero-key adapter: bundled placeholder media, 800–2500ms latency,
// AbortSignal-aware, scripted failure via options.failPlease. Default for every route.
import type { GenerateAdapter, GenerateKind, GenerateRequest, GenerateResult } from "./types";

const MEDIA: Partial<Record<GenerateKind, { url: string }>> = {
  image: { url: "/stubs/image-1.webp" },
  video: { url: "/stubs/video-1.mp4" },
  speech: { url: "/stubs/speech-1.mp3" },
  sfx: { url: "/stubs/sfx-1.mp3" },
  music: { url: "/stubs/music-1.mp3" },
};

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException("aborted", "AbortError"));
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}

export const stubAdapter: GenerateAdapter & { kind: "stub" } = {
  kind: "stub" as never,
  async generate(req: GenerateRequest, signal: AbortSignal): Promise<GenerateResult> {
    await wait(800 + Math.random() * 1700, signal);
    if (req.options?.failPlease) throw new Error("Stub failure (demo).");
    if (req.kind === "llm") {
      return { kind: "llm", text: `Stubbed text for: ${req.prompt}`, provider: "stub" };
    }
    const media = MEDIA[req.kind];
    return { kind: req.kind, url: media?.url ?? MEDIA.image!.url, provider: "stub" };
  },
};
