import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FACT_KEYS, type SystemFacts, type SystemPage } from "@/lib/system-page";

import { SystemPageView } from "./system-page";

const FACTS = Object.fromEntries(FACT_KEYS.map((key, index) => [key, index + 1])) as SystemFacts;

const PAGE: SystemPage = {
  slug: "harness",
  title: "Fixture page",
  description: "A page for the renderer test.",
  draft: true,
  lede: ["There are {facts.ciSteps} steps and a `code` chip."],
  sections: [
    {
      id: "first",
      heading: "First section",
      blocks: [
        { kind: "p", text: "A paragraph." },
        { kind: "quote", text: "A quote." },
        { kind: "list", items: ["Step one of the list"] },
        { kind: "table", columns: ["Kind", "Count"], rows: [["Rules", "{facts.rules}"]] },
        { kind: "figure", figure: "harness-parts", caption: "The caption." },
        { kind: "gates" },
        { kind: "derived" },
        {
          kind: "links",
          items: [{ label: "Elsewhere", href: "/elsewhere", storybook: "?path=/docs/x--docs" }],
        },
      ],
    },
  ],
};

describe("SystemPageView", () => {
  it("renders one titled h1 and the numbered section heading", () => {
    const { container } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector('[data-slot="system-page-title"]')).toHaveTextContent("Fixture page");
    expect(screen.getByRole("heading", { level: 2, name: /First section/ })).toBeInTheDocument();
  });

  it("resolves fact placeholders and renders backticks as code", () => {
    const { container } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    expect(screen.getByText(/There are 1 steps/)).toBeInTheDocument();
    expect([...container.querySelectorAll("code")].some((el) => el.textContent === "code")).toBe(true);
    expect(screen.getByRole("cell", { name: String(FACTS.rules) })).toBeInTheDocument();
  });

  it("puts every figure in a figure with a figcaption", () => {
    const { container } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    const figure = container.querySelector('[data-figure="harness-parts"]');
    expect(figure?.tagName).toBe("FIGURE");
    expect(figure?.querySelector("figcaption")).toHaveTextContent("The caption.");
  });

  it("prints the roster and the derived rows", () => {
    const { container } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    expect(container.querySelector('[data-slot="system-gates"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="system-derived"]')).not.toBeNull();
  });

  it("shows the draft note while the page is a draft, and not after", () => {
    const { container, rerender } = render(<SystemPageView page={PAGE} facts={FACTS} />);
    expect(container.querySelector('[data-slot="system-page-draft"]')).not.toBeNull();
    const reviewed: SystemPage = { ...PAGE, draft: undefined };
    rerender(<SystemPageView page={reviewed} facts={FACTS} />);
    expect(container.querySelector('[data-slot="system-page-draft"]')).toBeNull();
  });

  it("uses the Storybook link target on the Storybook surface", () => {
    render(<SystemPageView page={PAGE} facts={FACTS} surface="storybook" />);
    expect(screen.getByRole("link", { name: "Elsewhere" })).toHaveAttribute("href", "?path=/docs/x--docs");
  });
});
