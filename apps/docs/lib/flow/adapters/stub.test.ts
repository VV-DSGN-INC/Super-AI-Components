// apps/docs/lib/flow/adapters/stub.test.ts
import { describe, expect, it, vi } from "vitest";
import { stubAdapter } from "./stub";

const req = (kind: Parameters<typeof stubAdapter.generate>[0]["kind"], extra = {}) => ({
  kind,
  prompt: "a cat",
  ...extra,
});

describe("stubAdapter", () => {
  it("returns deterministic placeholder media per kind tagged provider:stub", async () => {
    vi.useFakeTimers();
    const p = stubAdapter.generate(req("image"), new AbortController().signal);
    await vi.runAllTimersAsync();
    const out = await p;
    expect(out).toMatchObject({ kind: "image", url: "/stubs/image-1.webp", provider: "stub" });
    vi.useRealTimers();
  });

  it("returns text for llm without a url", async () => {
    vi.useFakeTimers();
    const p = stubAdapter.generate(req("llm"), new AbortController().signal);
    await vi.runAllTimersAsync();
    const out = await p;
    expect(out.url).toBeUndefined();
    expect(out.text).toContain("a cat");
    vi.useRealTimers();
  });

  it("honors the scripted failure flag", async () => {
    vi.useFakeTimers();
    const p = stubAdapter.generate(
      req("image", { options: { failPlease: true } }),
      new AbortController().signal,
    );
    const assertion = expect(p).rejects.toThrow(/stub failure/i);
    await vi.runAllTimersAsync();
    await assertion;
    vi.useRealTimers();
  });

  it("rejects with AbortError when the signal aborts mid-flight", async () => {
    const ctl = new AbortController();
    const p = stubAdapter.generate(req("video"), ctl.signal);
    ctl.abort();
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
  });
});
