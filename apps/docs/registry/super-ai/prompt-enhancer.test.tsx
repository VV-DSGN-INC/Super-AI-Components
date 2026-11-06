import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectAccessibleName } from "@/lib/test-utils";
import { PromptEnhancer, diffAdded } from "./prompt-enhancer";

const ORIGINAL = "write a poem about the sea";
const ENHANCED = "write a short poem about the sea, in four lines, with a calm tone";

function root() {
  return document.querySelector<HTMLElement>('[data-slot="prompt-enhancer"]')!;
}
function status() {
  return document.querySelector<HTMLElement>('[data-slot="prompt-enhancer-status"]')!;
}

/** Text as a sighted reader sees it: the sr-only start and end markers removed. */
function seen(el: Element | null): string {
  const clone = el!.cloneNode(true) as Element;
  clone.querySelectorAll(".sr-only").forEach((n) => n.remove());
  return clone.textContent!.replace(/\s+/g, " ").trim();
}

interface Deferred {
  promise: Promise<string>;
  resolve: (v: string) => void;
  reject: (e: Error) => void;
}
function deferred(): Deferred {
  let resolve!: (v: string) => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<string>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A host that owns the field, the way a composer would. */
function Host({
  onEnhance,
  onAccept,
  onRevert,
}: {
  onEnhance: (v: string, r?: string) => Promise<string>;
  onAccept?: (v: string) => void;
  onRevert?: (v: string) => void;
}) {
  const [value, setValue] = useState(ORIGINAL);
  return (
    <>
      <textarea aria-label="Prompt" value={value} onChange={(e) => setValue(e.target.value)} />
      <PromptEnhancer
        value={value}
        onEnhance={onEnhance}
        onAccept={(next) => {
          setValue(next);
          onAccept?.(next);
        }}
        onRevert={
          onRevert
            ? (orig) => {
                setValue(orig);
                onRevert(orig);
              }
            : undefined
        }
      />
    </>
  );
}

async function enhance(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Enhance prompt" }));
}

describe("PromptEnhancer", () => {
  it("renders the idle state: one Enhance button, nothing proposed, nothing announced", () => {
    render(<PromptEnhancer value={ORIGINAL} onEnhance={vi.fn()} onAccept={vi.fn()} />);
    expect(root().getAttribute("data-state")).toBe("idle");
    expect(screen.getByRole("button", { name: "Enhance prompt" })).toBeEnabled();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(status()).toHaveTextContent("");
  });

  it("disables Enhance when the field is empty, so there is nothing to rewrite", () => {
    render(<PromptEnhancer value="   " onEnhance={vi.fn()} onAccept={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Enhance prompt" })).toBeDisabled();
  });

  it("renders the enhancing state: polite status, cancellable, onEnhance gets the original", async () => {
    const user = userEvent.setup();
    const d = deferred();
    const onEnhance = vi.fn(() => d.promise);
    render(<PromptEnhancer value={ORIGINAL} onEnhance={onEnhance} onAccept={vi.fn()} />);
    await enhance(user);
    expect(onEnhance).toHaveBeenCalledWith(ORIGINAL, undefined);
    expect(root().getAttribute("data-state")).toBe("enhancing");
    expect(status()).toHaveAttribute("role", "status");
    expect(status()).toHaveAttribute("aria-live", "polite");
    expect(status()).toHaveTextContent("Enhancing your prompt.");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("cancel returns to idle and drops a result that arrives afterwards", async () => {
    const user = userEvent.setup();
    const d = deferred();
    const onAccept = vi.fn();
    render(<PromptEnhancer value={ORIGINAL} onEnhance={() => d.promise} onAccept={onAccept} />);
    await enhance(user);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(root().getAttribute("data-state")).toBe("idle");
    d.resolve(ENHANCED);
    await new Promise((r) => setTimeout(r, 0));
    expect(root().getAttribute("data-state")).toBe("idle");
    expect(screen.queryByText("Suggested rewrite")).toBeNull();
    expect(onAccept).not.toHaveBeenCalled();
  });

  it("renders the suggested state: original beside the rewrite, host untouched until accept", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(<Host onEnhance={async () => ENHANCED} onAccept={onAccept} />);
    await enhance(user);
    await screen.findByRole("button", { name: "Accept" });
    expect(root().getAttribute("data-state")).toBe("suggested");
    expect(document.querySelector('[data-slot="prompt-enhancer-original"]')).toHaveTextContent(ORIGINAL);
    expect(seen(document.querySelector('[data-slot="prompt-enhancer-text"]'))).toBe(ENHANCED);
    expect(screen.getByLabelText("Prompt")).toHaveValue(ORIGINAL);
    expect(onAccept).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent("Suggested rewrite ready.");
  });

  it("marks added words in text and style, and describes them", async () => {
    const user = userEvent.setup();
    render(<Host onEnhance={async () => ENHANCED} />);
    await enhance(user);
    await screen.findByRole("button", { name: "Accept" });
    const added = [...document.querySelectorAll('[data-slot="prompt-enhancer-added"]')];
    expect(added.map((n) => n.tagName)).toEqual(["INS", "INS"]);
    // The added text is the words the person did not write.
    expect(added.map((n) => seen(n))).toEqual(["short", "in four lines, with a calm tone"]);
    // Not colour alone: underline plus start and end markers for assistive tech.
    expect(added[0]).toHaveClass("underline");
    expect(added[0]!.textContent).toContain("added start");
    expect(added[0]!.textContent).toContain("added end");
    const group = screen.getByRole("region", { name: "Suggested rewrite" });
    expect(group).toHaveAccessibleDescription(/8 words added in 2 places/);
    // The unchanged words are not marked.
    expect(document.querySelector('[data-slot="prompt-enhancer-text"]')!.textContent).toContain("write a");
  });

  it("keeps the refinement chips behind an advanced disclosure and re-runs from the original", async () => {
    const user = userEvent.setup();
    const onEnhance = vi.fn(async (_v: string, r?: string) =>
      r ? "write a poem about the sea, briefly" : ENHANCED,
    );
    render(<Host onEnhance={onEnhance} />);
    await enhance(user);
    await screen.findByRole("button", { name: "Accept" });
    const advanced = screen.getByRole("button", { name: "Advanced" });
    expect(advanced).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "More concise" })).toBeNull();
    await user.click(advanced);
    expect(advanced).toHaveAttribute("aria-expanded", "true");
    await user.click(await screen.findByRole("button", { name: "More concise" }));
    expect(onEnhance).toHaveBeenLastCalledWith(ORIGINAL, "More concise");
    await waitFor(() =>
      expect(seen(document.querySelector('[data-slot="prompt-enhancer-text"]'))).toBe(
        "write a poem about the sea, briefly",
      ),
    );
    expect(document.querySelector('[data-slot="prompt-enhancer-refinement"]')).toHaveTextContent(
      "More concise",
    );
  });

  it("renders the accepted state: returns the text, then offers a one-step revert", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(<Host onEnhance={async () => ENHANCED} onAccept={onAccept} />);
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Accept" }));
    expect(onAccept).toHaveBeenCalledWith(ENHANCED);
    expect(root().getAttribute("data-state")).toBe("accepted");
    expect(screen.getByLabelText("Prompt")).toHaveValue(ENHANCED);
    expect(screen.getByRole("button", { name: "Revert to original" })).toBeInTheDocument();
    expect(status()).toHaveTextContent("Enhanced prompt applied. Revert is available.");
  });

  it("lets the person edit the suggestion and accepts the edited text", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(<Host onEnhance={async () => ENHANCED} onAccept={onAccept} />);
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Edit" }));
    const editor = screen.getByRole("textbox", { name: "Edit the suggested rewrite" });
    await user.clear(editor);
    await user.type(editor, "write a poem about the sea at night");
    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(onAccept).toHaveBeenCalledWith("write a poem about the sea at night");
  });

  it("renders the reverted state: the exact original string comes back, including after an accept", async () => {
    const user = userEvent.setup();
    const onRevert = vi.fn();
    render(<Host onEnhance={async () => ENHANCED} onRevert={onRevert} />);
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Accept" }));
    await user.click(screen.getByRole("button", { name: "Revert to original" }));
    expect(onRevert).toHaveBeenCalledTimes(1);
    expect(onRevert.mock.calls[0]![0]).toBe(ORIGINAL);
    expect(screen.getByLabelText("Prompt")).toHaveValue(ORIGINAL);
    expect(root().getAttribute("data-state")).toBe("reverted");
    expect(status()).toHaveTextContent("Original prompt restored.");
    expect(screen.queryByRole("button", { name: "Revert to original" })).toBeNull();
  });

  it("restores whitespace and punctuation exactly, not a trimmed copy", async () => {
    const user = userEvent.setup();
    const awkward = "  keep   this\n\nexactly ";
    const onAccept = vi.fn();
    render(<PromptEnhancer value={awkward} onEnhance={async () => "something else"} onAccept={onAccept} />);
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Accept" }));
    await user.click(screen.getByRole("button", { name: "Revert to original" }));
    expect(onAccept).toHaveBeenLastCalledWith(awkward);
  });

  it("falls back to onAccept for revert when no onRevert is given", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(<PromptEnhancer value={ORIGINAL} onEnhance={async () => ENHANCED} onAccept={onAccept} />);
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Accept" }));
    await user.click(screen.getByRole("button", { name: "Revert to original" }));
    expect(onAccept).toHaveBeenNthCalledWith(1, ENHANCED);
    expect(onAccept).toHaveBeenNthCalledWith(2, ORIGINAL);
  });

  it("renders the failed state: says the prompt is unchanged and never touches the host", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(
      <Host
        onEnhance={async () => {
          throw new Error("rate limited");
        }}
        onAccept={onAccept}
      />,
    );
    await enhance(user);
    await waitFor(() =>
      expect(document.querySelector('[data-slot="prompt-enhancer-error"]')).toHaveTextContent(
        /Your prompt is unchanged/,
      ),
    );
    expect(root().getAttribute("data-state")).toBe("failed");
    expect(screen.getByLabelText("Prompt")).toHaveValue(ORIGINAL);
    expect(onAccept).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent("Enhance failed. Your prompt is unchanged.");
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();
  });

  it("retries a failed run from the same original", async () => {
    const user = userEvent.setup();
    const onEnhance = vi
      .fn<(v: string, r?: string) => Promise<string>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(ENHANCED);
    render(<Host onEnhance={onEnhance} />);
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    await screen.findByRole("button", { name: "Accept" });
    expect(onEnhance).toHaveBeenNthCalledWith(2, ORIGINAL, undefined);
  });

  it("dismiss discards the suggestion and returns to idle", async () => {
    const user = userEvent.setup();
    render(<Host onEnhance={async () => ENHANCED} />);
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(root().getAttribute("data-state")).toBe("idle"));
    expect(screen.getByLabelText("Prompt")).toHaveValue(ORIGINAL);
  });

  it("never owns or replaces the host field and never submits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Host onEnhance={async () => ENHANCED} />
      </form>,
    );
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Accept" }));
    expect(onSubmit).not.toHaveBeenCalled();
    // The component renders no textarea of its own while it is not editing.
    expect(root().querySelector("textarea")).toBeNull();
  });

  it("names the trigger and the revert control by their full phrase", async () => {
    const user = userEvent.setup();
    render(<Host onEnhance={async () => ENHANCED} />);
    expectAccessibleName(screen.getByRole("button", { name: "Enhance prompt" }), "Enhance prompt");
    await enhance(user);
    await user.click(await screen.findByRole("button", { name: "Accept" }));
    expectAccessibleName(screen.getByRole("button", { name: "Revert to original" }), "Revert to original");
  });

  it("passes className through", () => {
    render(<PromptEnhancer value="x" onEnhance={vi.fn()} onAccept={vi.fn()} className="test-class" />);
    expect(document.querySelector('[data-slot="prompt-enhancer"]')!.className).toContain("test-class");
  });
});

describe("diffAdded", () => {
  it("marks only the words that are not in the original and re-joins losslessly", () => {
    const segments = diffAdded("a b c", "a x b c y");
    expect(segments.map((s) => s.text).join("")).toBe("a x b c y");
    expect(segments.filter((s) => s.added).map((s) => s.text.trim())).toEqual(["x", "y"]);
  });

  it("marks nothing when the rewrite is identical", () => {
    expect(diffAdded("same words", "same words").every((s) => !s.added)).toBe(true);
  });
});
