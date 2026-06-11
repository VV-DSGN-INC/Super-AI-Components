// Demo-only stub executor for the /flow page. No network, no API routes (wave 2):
// it sleeps 800–2000ms, honors AbortSignal, and resolves to bundled placeholder media.
import type { NodeOutput, RunnerNode } from "@/registry/super-ai/flow/use-flow-runner";

const IMAGE_STUBS = ["/stubs/image-1.webp", "/stubs/image-2.webp"];
const VIDEO_STUB = "/stubs/video-1.mp4";

/** Stable tiny hash so a given node always resolves to the same placeholder image. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException("The stub execution was aborted", "AbortError");
    if (signal.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Resolve a node to placeholder media after a simulated generation delay.
 *
 * - `node.data.kind` selects the output: `"video"` → bundled mp4, `"text"` → echoed
 *   prompt, anything else → one of two bundled webp gradients (stable per node id).
 * - `node.data.failPlease` → rejects with `Error("Stub failure (demo)")` *after* the
 *   delay, so the node visibly passes through `streaming` before `failed`.
 * - The node's prompt is included in the output on purpose: useFlowRunner content-hashes
 *   upstream outputs into downstream cache keys, so editing an image prompt re-runs that
 *   image *and* the video fed by it, while untouched branches stay cached.
 */
export async function stubExecute(
  node: RunnerNode,
  _inputs: Record<string, NodeOutput>,
  signal: AbortSignal,
): Promise<NodeOutput> {
  await sleep(800 + Math.random() * 1200, signal);
  if (node.data.failPlease) throw new Error("Stub failure (demo)");
  const kind = String(node.data.kind ?? "image");
  const prompt = typeof node.data.prompt === "string" ? node.data.prompt : "";
  if (kind === "video") return { url: VIDEO_STUB, kind: "video", prompt };
  if (kind === "text") return { kind: "text", text: prompt };
  return { url: IMAGE_STUBS[hashId(node.id) % IMAGE_STUBS.length], kind: "image", prompt };
}
