import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentDocsView } from "./component-docs";
import type { ComponentDocs } from "@/lib/component-docs";

const DOCS: ComponentDocs = {
  whatItIs: "The avatar-plus-name control that opens the workspace list.",
  whyItMatters: "First element in every sidebar on the reference board.",
  evidence: ["Descript", "CapCut"],
  anatomy: [{ slot: "trigger", note: "Current workspace + plan badge" }],
  usage: "Reach for it whenever a product has more than one workspace.",
  dos: [{ text: "Put creation last, below a separator." }],
  donts: [{ text: "Don't add a plus icon to the trigger." }],
  accessibility: {
    keyboard: ["The trigger is one tab stop; the list is a composite."],
    screenReader: ["The trigger announces the current workspace, not the word 'workspace'."],
    focus: ["Closing the list returns focus to the trigger."],
  },
  pitfalls: ["Two flavours, one component."],
};

describe("ComponentDocsView", () => {
  it("renders every guidance section", () => {
    render(<ComponentDocsView docs={DOCS} />);
    expect(screen.getByText(DOCS.whatItIs)).toBeInTheDocument();
    expect(screen.getByText(DOCS.whyItMatters)).toBeInTheDocument();
    expect(screen.getByText(DOCS.usage)).toBeInTheDocument();
    expect(screen.getByText(DOCS.pitfalls[0])).toBeInTheDocument();
  });

  it("distinguishes dos from donts so they cannot be misread", () => {
    render(<ComponentDocsView docs={DOCS} />);
    const dos = document.querySelector('[data-slot="docs-do"]')!;
    const donts = document.querySelector('[data-slot="docs-dont"]')!;
    expect(dos.textContent).toContain("Put creation last");
    expect(donts.textContent).toContain("Don't add a plus icon");
    expect(dos.className).not.toBe(donts.className);
  });

  it("numbers anatomy slots so callouts can reference them", () => {
    render(<ComponentDocsView docs={DOCS} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Current workspace + plan badge")).toBeInTheDocument();
  });

  it("lists evidence products", () => {
    render(<ComponentDocsView docs={DOCS} />);
    expect(screen.getByText(/Descript/)).toBeInTheDocument();
  });

  it("omits sections that carry no content", () => {
    render(<ComponentDocsView docs={{ ...DOCS, anatomy: [] }} />);
    expect(document.querySelector('[data-slot="docs-anatomy"]')).toBeNull();
  });

  it("splits accessibility notes by the concern a reader arrives with", () => {
    render(<ComponentDocsView docs={DOCS} />);
    const keyboard = document.querySelector('[data-slot="docs-a11y-keyboard"]')!;
    const screenReader = document.querySelector('[data-slot="docs-a11y-screen-reader"]')!;
    expect(keyboard.textContent).toContain("one tab stop");
    expect(screenReader.textContent).toContain("announces the current workspace");
  });

  it("drops the focus arm when nothing moves focus", () => {
    render(<ComponentDocsView docs={{ ...DOCS, accessibility: { ...DOCS.accessibility, focus: undefined } }} />);
    expect(document.querySelector('[data-slot="docs-a11y-focus"]')).toBeNull();
    expect(document.querySelector('[data-slot="docs-a11y-keyboard"]')).not.toBeNull();
  });

  // The deliberate asymmetry with anatomy/pitfalls above: an undocumented
  // accessibility section says so rather than disappearing, because a hidden
  // empty section reads as "nothing to say here" — the one signal this
  // heading must never send.
  it("says so out loud when accessibility is undocumented, rather than hiding", () => {
    render(<ComponentDocsView docs={{ ...DOCS, accessibility: { keyboard: [], screenReader: [] } }} />);
    expect(document.querySelector('[data-slot="docs-a11y"]')).not.toBeNull();
    expect(document.querySelector('[data-slot="docs-a11y-undocumented"]')!.textContent).toContain(
      "Not yet documented",
    );
  });
});
