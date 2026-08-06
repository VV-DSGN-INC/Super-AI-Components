import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { AiDocBlock, type AiDocBlockState } from "./ai-doc-block";

const verbNames = () =>
  screen
    .getAllByRole("button")
    .map((button) => button.textContent?.trim())
    .filter((text): text is string => Boolean(text));

const allVerbs = {
  onKeep: () => {},
  onEdit: () => {},
  onRegenerate: () => {},
  onDiscard: () => {},
};

/** A block sitting in a document, with prose either side of it. */
function Document({
  state,
  children,
}: {
  state: AiDocBlockState;
  children: React.ReactNode;
}) {
  return (
    <article>
      <p>The paragraph above.</p>
      <AiDocBlock state={state} onRePrompt={() => {}} {...allVerbs}>
        {children}
      </AiDocBlock>
      <p>The paragraph below.</p>
    </article>
  );
}

describe("AiDocBlock", () => {
  it("renders the streaming state", () => {
    const { container } = render(
      <AiDocBlock state="streaming" {...allVerbs}>
        <p>The first half of a sentence that is still</p>
      </AiDocBlock>,
    );

    expect(container.querySelector('[data-slot="ai-doc-block"]')).toHaveAttribute(
      "data-state",
      "streaming",
    );
    expect(container.querySelector('[data-slot="ai-doc-block-content"]')).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("status")).toHaveTextContent(/generating this block/i);
  });

  it("renders the editable state", async () => {
    const onValueChange = vi.fn();
    render(
      <AiDocBlock
        state="editable"
        value="Revenue grew."
        onValueChange={onValueChange}
        {...allVerbs}
      />,
    );

    const editor = screen.getByRole("textbox", { name: /edit generated text/i });
    expect(editor).toHaveValue("Revenue grew.");

    await userEvent.type(editor, "!");
    expect(onValueChange).toHaveBeenCalledWith("Revenue grew.!");

    // The verbs stay available while editing — Keep is how an edit is committed.
    expect(screen.getByRole("button", { name: /keep/i })).toBeEnabled();
  });

  it("renders the re-promptable state", async () => {
    const onRePrompt = vi.fn();
    render(
      <AiDocBlock
        state="re-promptable"
        prompt="Make it shorter."
        onRePrompt={onRePrompt}
        onRePromptCancel={() => {}}
        {...allVerbs}
      >
        <p>The current draft.</p>
      </AiDocBlock>,
    );

    expect(screen.getByRole("textbox", { name: /what should change/i })).toHaveValue(
      "Make it shorter.",
    );
    await userEvent.click(screen.getByRole("button", { name: /^regenerate$/i }));
    expect(onRePrompt).toHaveBeenCalledWith("Make it shorter.");

    // The affordance replaces the verb row rather than sitting beside it, so
    // "Regenerate" never names two controls inside one block.
    expect(screen.getAllByRole("button", { name: /regenerate/i })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /keep/i })).not.toBeInTheDocument();
  });

  it("renders the approval-verbs state", () => {
    render(
      <AiDocBlock {...allVerbs}>
        <p>A finished passage.</p>
      </AiDocBlock>,
    );
    expect(verbNames()).toEqual(["Keep", "Edit", "Regenerate", "Discard"]);
    for (const name of [/keep/i, /^edit$/i, /regenerate/i, /discard/i]) {
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
  });

  it("passes className through", () => {
    render(<AiDocBlock className="test-class" />);
    expect(document.querySelector('[data-slot="ai-doc-block"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions
  // ---------------------------------------------------------------------------

  it("is a real document node: the content slot wraps nothing around the markup", () => {
    // "Must survive save, reload and export as ordinary content." A document
    // model serialises what is inside this slot, so component-owned wrappers or
    // an absolutely-positioned overlay layer would break the export.
    const { container } = render(
      <AiDocBlock {...allVerbs}>
        <h3>Q3 summary</h3>
        <p>Revenue grew 14% quarter over quarter.</p>
      </AiDocBlock>,
    );
    const content = container.querySelector('[data-slot="ai-doc-block-content"]')!;
    expect(content.innerHTML).toBe("<h3>Q3 summary</h3><p>Revenue grew 14% quarter over quarter.</p>");
    expect(screen.getByRole("heading", { name: "Q3 summary" })).toBeInTheDocument();
  });

  it("keeps the block in place when re-prompting swaps its content", () => {
    // "Re-prompting keeps the block in place and swaps its content, so
    // structure never moves." The same DOM node, between the same two
    // paragraphs, before and after the swap.
    const { container, rerender } = render(
      <Document state="approval-verbs">
        <p>First draft.</p>
      </Document>,
    );
    const node = container.querySelector('[data-slot="ai-doc-block"]')!;
    const before = node.previousElementSibling;
    const after = node.nextElementSibling;

    rerender(
      <Document state="re-promptable">
        <p>First draft.</p>
      </Document>,
    );
    expect(container.querySelector('[data-slot="ai-doc-block"]')).toBe(node);

    rerender(
      <Document state="approval-verbs">
        <p>Second draft.</p>
      </Document>,
    );
    const swapped = container.querySelector('[data-slot="ai-doc-block"]')!;
    expect(swapped).toBe(node);
    expect(swapped.previousElementSibling).toBe(before);
    expect(swapped.nextElementSibling).toBe(after);
    expect(swapped).toHaveTextContent("Second draft.");
    expect(swapped).not.toHaveTextContent("First draft.");
  });

  it("fixes verb order in the component, not by which handlers are supplied", () => {
    const { unmount } = render(
      <AiDocBlock
        onDiscard={() => {}}
        onRegenerate={() => {}}
        onEdit={() => {}}
        onKeep={() => {}}
      />,
    );
    expect(verbNames()).toEqual(["Keep", "Edit", "Regenerate", "Discard"]);
    unmount();

    // A subset keeps its relative order rather than collapsing to call order.
    render(<AiDocBlock onDiscard={() => {}} onKeep={() => {}} />);
    expect(verbNames()).toEqual(["Keep", "Discard"]);
  });

  it("renders only the verbs that have handlers", () => {
    render(<AiDocBlock onKeep={() => {}} />);
    expect(verbNames()).toEqual(["Keep"]);
    expect(screen.queryByRole("button", { name: /discard/i })).not.toBeInTheDocument();
  });

  it("routes each verb to its own handler", async () => {
    const onKeep = vi.fn();
    const onEdit = vi.fn();
    const onRegenerate = vi.fn();
    const onDiscard = vi.fn();
    render(
      <AiDocBlock
        onKeep={onKeep}
        onEdit={onEdit}
        onRegenerate={onRegenerate}
        onDiscard={onDiscard}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /discard/i }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onKeep).not.toHaveBeenCalled();
    expect(onEdit).not.toHaveBeenCalled();
    expect(onRegenerate).not.toHaveBeenCalled();
  });

  it("makes the verbs unavailable while streaming without hiding them", async () => {
    const onKeep = vi.fn();
    render(
      <AiDocBlock state="streaming" {...allVerbs} onKeep={onKeep}>
        <p>Half a sentence</p>
      </AiDocBlock>,
    );

    // Still on screen — hiding them would shrink and regrow the footer, which
    // is the structural movement this component exists to avoid.
    expect(verbNames()).toEqual(["Keep", "Edit", "Regenerate", "Discard"]);
    for (const name of [/keep/i, /^edit$/i, /regenerate/i, /discard/i]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }

    await userEvent.click(screen.getByRole("button", { name: /keep/i }));
    expect(onKeep).not.toHaveBeenCalled();
  });

  it("signals streaming in words, not by colour alone", () => {
    const { rerender } = render(
      <AiDocBlock state="streaming" {...allVerbs}>
        <p>Half a sentence</p>
      </AiDocBlock>,
    );
    expect(screen.getByText("Streaming")).toBeInTheDocument();

    rerender(
      <AiDocBlock state="approval-verbs" {...allVerbs}>
        <p>Half a sentence</p>
      </AiDocBlock>,
    );
    expect(screen.queryByText("Streaming")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/waiting on your decision/i);
  });

  it("names the block as generated in text, so attribution survives a theme", () => {
    render(<AiDocBlock label="Drafted by Claude" {...allVerbs} />);
    expect(screen.getByText("Drafted by Claude")).toBeInTheDocument();
  });
});
