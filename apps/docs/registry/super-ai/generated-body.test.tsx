import "@/components/openui/no-devtools";

import { createLibrary, defineComponent } from "@openuidev/react-lang";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { GeneratedBody } from "./generated-body";

// A tiny library of the test's own. The registry component imports no surface.
const Page = defineComponent({
  name: "Page",
  description: "The root. Blocks top to bottom.",
  props: z.object({ children: z.array(z.any()) }),
  component: ({ props, renderNode }) => (
    <div>
      {(props.children as unknown[]).map((child, i) => (
        <div key={i}>{renderNode(child)}</div>
      ))}
    </div>
  ),
});
const Markdown = defineComponent({
  name: "Markdown",
  description: "One paragraph of text.",
  props: z.object({ text: z.string() }),
  component: ({ props }) => <p>{props.text}</p>,
});
const library = createLibrary({ root: "Page", components: [Page, Markdown] });

const GOOD = ["root = Page([intro])", 'intro = Markdown("Spend by project")'].join("\n");
const GOOD_V2 = ["root = Page([intro])", 'intro = Markdown("Spend by project, newest")'].join("\n");
const UNKNOWN_COMPONENT = [
  "root = Page([intro, trend])",
  'intro = Markdown("Spend with a trend")',
  'trend = Chart("line", days)',
].join("\n");
const DANGLING = ["root = Page([intro, trend])", 'intro = Markdown("Spend with a trend")'].join("\n");
const BAD_ARGUMENT = ["root = Page([intro])", "intro = Markdown(5)"].join("\n");
const UNKNOWN_ROOT = 'root = Chart("line", days)';

const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`);

describe("GeneratedBody", () => {
  it("renders the streaming state: what has arrived, no failure, no report", () => {
    const onRender = vi.fn();
    // A name used before its line has arrived is unresolved, not wrong.
    const { rerender } = render(
      <GeneratedBody program={DANGLING} library={library} streaming onRender={onRender} />,
    );
    expect(screen.getByText("Spend with a trend")).toBeInTheDocument();
    expect(slot("generated-body")).toHaveAttribute("aria-busy", "true");
    expect(slot("generated-body-failure")).toBeNull();

    // Even a program that can never render stays quiet until the stream ends.
    rerender(<GeneratedBody program={UNKNOWN_COMPONENT} library={library} streaming onRender={onRender} />);
    expect(slot("generated-body-failure")).toBeNull();
    expect(onRender).not.toHaveBeenCalled();
  });

  it("renders the rendered state and reports ok once", () => {
    const onRender = vi.fn();
    render(<GeneratedBody program={GOOD} library={library} onRender={onRender} />);
    expect(screen.getByText("Spend by project")).toBeInTheDocument();
    expect(slot("generated-body-content")).not.toBeNull();
    expect(slot("generated-body-failure")).toBeNull();
    expect(slot("generated-body")).not.toHaveAttribute("aria-busy");
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(onRender).toHaveBeenCalledWith({ ok: true, errors: [] });
  });

  it("renders the failed-with-fallback state: alert, reason, Retry, last good version", async () => {
    const onRetry = vi.fn();
    const onRender = vi.fn();
    render(
      <GeneratedBody
        program={UNKNOWN_COMPONENT}
        library={library}
        fallbackProgram={GOOD}
        onRetry={onRetry}
        onRender={onRender}
      />,
    );
    const alert = screen.getByRole("status");
    expect(alert).toBe(slot("generated-body-failure"));
    expect(alert).toHaveTextContent("This version did not render.");
    expect(alert).toHaveTextContent("Chart is not a component this view can use.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(slot("generated-body-retry")).not.toBeNull();

    const fallback = slot("generated-body-fallback")!;
    expect(fallback).toHaveTextContent("Spend by project");
    // The failed program's own body is not shown beside the fallback.
    expect(screen.queryByText("Spend with a trend")).toBeNull();
    expect(slot("generated-body-content")).toBeNull();
    expect(onRender).toHaveBeenCalledWith({
      ok: false,
      errors: ["Chart is not a component this view can use."],
    });
  });

  it("renders the failed-without-fallback state: the alert alone, never the broken body", () => {
    render(<GeneratedBody program={UNKNOWN_COMPONENT} library={library} />);
    expect(screen.getByRole("status")).toHaveTextContent("This version did not render.");
    expect(slot("generated-body-fallback")).toBeNull();
    expect(slot("generated-body-content")).toBeNull();
    // The valid half of the broken program must not leak through.
    expect(screen.queryByText("Spend with a trend")).toBeNull();
  });

  it("shows Retry only when onRetry is given", () => {
    render(<GeneratedBody program={UNKNOWN_COMPONENT} library={library} />);
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
    expect(slot("generated-body-retry")).toBeNull();
  });

  it("treats a finished program with an unknown component as failed through meta.errors", () => {
    // Pinned by experiment on @openuidev/react-lang 0.3.2: an unknown component
    // leaves result.root set and result.meta.unresolved empty. Only
    // meta.errors carries it, so a check on root or unresolved alone would let
    // this program through and paint the rest of it.
    const onRender = vi.fn();
    render(<GeneratedBody program={UNKNOWN_COMPONENT} library={library} onRender={onRender} />);
    expect(onRender).toHaveBeenCalledWith({
      ok: false,
      errors: ["Chart is not a component this view can use."],
    });
  });

  it("treats an unknown root component as failed (root is null)", () => {
    const onRender = vi.fn();
    render(<GeneratedBody program={UNKNOWN_ROOT} library={library} onRender={onRender} />);
    expect(screen.getByRole("status")).toHaveTextContent("Chart is not a component this view can use.");
    expect(onRender.mock.calls[0]![0]).toMatchObject({ ok: false });
    expect(onRender.mock.calls[0]![0].errors).toContain("The program has no root to show.");
  });

  it("treats a reference that is never defined as failed through meta.unresolved", () => {
    const onRender = vi.fn();
    render(<GeneratedBody program={DANGLING} library={library} onRender={onRender} />);
    expect(screen.getByRole("status")).toHaveTextContent("trend is used but never defined.");
    expect(onRender).toHaveBeenCalledWith({ ok: false, errors: ["trend is used but never defined."] });
  });

  it("treats a bad argument as failed and reads the parser's own message", () => {
    render(<GeneratedBody program={BAD_ARGUMENT} library={library} />);
    expect(screen.getByRole("status")).toHaveTextContent("expects string but got number");
  });

  it("judges the program only when the stream ends", () => {
    const onRender = vi.fn();
    const { rerender } = render(
      <GeneratedBody program={UNKNOWN_COMPONENT} library={library} streaming onRender={onRender} />,
    );
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<GeneratedBody program={UNKNOWN_COMPONENT} library={library} onRender={onRender} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(onRender).toHaveBeenCalledTimes(1);
    expect(onRender.mock.calls[0]![0].ok).toBe(false);
  });

  it("reports once per finished program, not on every re-render", () => {
    const onRender = vi.fn();
    const { rerender } = render(<GeneratedBody program={GOOD} library={library} onRender={onRender} />);
    rerender(<GeneratedBody program={GOOD} library={library} onRender={onRender} className="again" />);
    rerender(<GeneratedBody program={GOOD} library={library} onRender={vi.fn(onRender)} />);
    expect(onRender).toHaveBeenCalledTimes(1);

    rerender(<GeneratedBody program={GOOD_V2} library={library} onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(2);
    expect(onRender).toHaveBeenLastCalledWith({ ok: true, errors: [] });
  });

  it("reports again when a new stream finishes, even with identical text", () => {
    const onRender = vi.fn();
    const { rerender } = render(<GeneratedBody program={GOOD} library={library} onRender={onRender} />);
    rerender(<GeneratedBody program={GOOD} library={library} streaming onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(1);
    rerender(<GeneratedBody program={GOOD} library={library} onRender={onRender} />);
    expect(onRender).toHaveBeenCalledTimes(2);
  });

  it("recovers when the next program renders", () => {
    const { rerender } = render(
      <GeneratedBody program={UNKNOWN_COMPONENT} library={library} fallbackProgram={GOOD} />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<GeneratedBody program={GOOD_V2} library={library} fallbackProgram={GOOD} />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Spend by project, newest")).toBeInTheDocument();
    expect(slot("generated-body-fallback")).toBeNull();
  });

  it("reports nothing and renders nothing for an empty program", () => {
    const onRender = vi.fn();
    render(<GeneratedBody program={null} library={library} onRender={onRender} />);
    expect(slot("generated-body-content")).toBeNull();
    expect(slot("generated-body-failure")).toBeNull();
    expect(onRender).not.toHaveBeenCalled();
  });

  it("names the first reasons and counts the rest", () => {
    const many = [
      "root = Page([a, b, c, d])",
      'a = Markdown("one")',
      "b = Chart(1)",
      "c = Gauge(2)",
      "d = Map(3)",
    ].join("\n");
    render(<GeneratedBody program={many} library={library} />);
    const text = screen.getByRole("status").textContent ?? "";
    expect(text).toContain("Chart is not a component this view can use.");
    expect(text).toContain("Gauge is not a component this view can use.");
    expect(text).toMatch(/and 1 more\.$/);
    expect(text).not.toContain("Map");
  });

  it("passes className through", () => {
    render(<GeneratedBody program={GOOD} library={library} className="test-class" />);
    expect(slot("generated-body")!.className).toContain("test-class");
  });
});
