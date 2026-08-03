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
});
