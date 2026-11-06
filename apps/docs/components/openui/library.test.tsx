import "./no-devtools";

import { createParser, Renderer } from "@openuidev/react-lang";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { catalog, catalogEntry, enumFor } from "./catalog";
import { BOARD, briefs } from "./fixtures";
import { exposedSurfaces, openuiLibrary, ROOT, systemPrompt } from "./library";
import { components, surfaceSlugs } from "./surfaces";

describe("devtools auto-mount guard", () => {
  it("sets the flag before react-lang's web entry evaluates", () => {
    expect((globalThis as Record<symbol, unknown>)[Symbol.for("openui.devtools.autoMount")]).toBe(true);
  });
});

describe("catalog helpers", () => {
  it("resolves a slug and throws on an unknown one", () => {
    expect(catalogEntry("stat-readout").name).toBe("Stat Readout");
    expect(() => catalogEntry("no-such-component")).toThrow(/no-such-component/);
  });

  it("builds an enum from a catalog axis, keeps its default, and can exclude values", () => {
    const size = enumFor("empty-state", "size", { exclude: ["page"] });
    const raw = size as unknown as { unwrap?: () => { options?: string[] }; options?: string[] };
    const inner = typeof raw.unwrap === "function" ? raw.unwrap() : raw;
    expect(inner.options).toEqual(["panel", "in-grid"]);
    expect(() => enumFor("empty-state", "colour")).toThrow(/colour/);
  });
});

describe("openuiLibrary", () => {
  it("roots at Page and names every surface once, between 15 and 20 of them", () => {
    expect(openuiLibrary.root).toBe(ROOT);
    const names = Object.keys(openuiLibrary.components);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBeGreaterThanOrEqual(15);
    expect(names.length).toBeLessThanOrEqual(20);
  });

  it("maps every surface, and every registry-backed one names a shipped leaf the catalog has", () => {
    for (const c of components) expect(c.name in surfaceSlugs, c.name).toBe(true);
    for (const s of exposedSurfaces) {
      if (!s.slug) continue;
      const entry = catalog.components.find((c) => c.slug === s.slug);
      expect(entry, s.name).toBeDefined();
      // Blocks and shells are never surfaces.
      expect(entry?.layer, s.name).not.toBe("block");
    }
  });

  it("carries the meta's per-value intent into the schema the prompt prints", () => {
    const byName = (name: string) => exposedSurfaces.find((s) => s.name === name)!;
    expect([...byName("Stats").enums.columns!].sort()).toEqual(["1", "2"]);
    expect(byName("Empty").enums.size).toEqual(["panel", "in-grid"]);
    expect(byName("Heading").enums.size).toEqual(["default", "sm"]);
    const intent = catalogEntry("empty-state").variants[0]!.values.find((v) => v.value === "in-grid")!.intent;
    expect(systemPrompt).toContain(intent.slice(0, 40));
  });

  it("generates a system prompt that names every surface", () => {
    for (const c of components) expect(systemPrompt).toContain(c.name);
  });

  it("control: the parser reports a component the library lacks", () => {
    const parser = createParser(openuiLibrary.toJSONSchema());
    const result = parser.parse([`root = Page([x])`, `x = Chart("revenue")`].join("\n"));
    expect(result.meta.errors.length).toBeGreaterThan(0);
  });
});

describe("rendering", () => {
  it("renders the status brief's table and stats from the board", () => {
    render(<Renderer response={briefs[0]!.response(BOARD)} library={openuiLibrary} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    for (const t of BOARD) expect(screen.getByRole("cell", { name: t.title })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="stat-readout"]')).not.toBeNull();
  });

  it("a Button sends its action through onAction", () => {
    const onAction = vi.fn();
    render(<Renderer response={briefs[0]!.response(BOARD)} library={openuiLibrary} onAction={onAction} />);
    fireEvent.click(screen.getByRole("button", { name: "Add a task" }));
    expect(onAction.mock.calls[0]?.[0].humanFriendlyMessage).toBe("Add a task");
  });

  it("the form submits typed and picked values through onAction", () => {
    const onAction = vi.fn();
    render(<Renderer response={briefs[1]!.response(BOARD)} library={openuiLibrary} onAction={onAction} />);
    fireEvent.change(screen.getByLabelText("Task"), { target: { value: "Write the runbook" } });
    fireEvent.click(screen.getByRole("radio", { name: "Wu" }));
    fireEvent.click(screen.getByRole("radio", { name: "To do" }));
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(onAction).toHaveBeenCalledTimes(1);
    const event = onAction.mock.calls[0]?.[0];
    // formState is keyed by form name, then field name, each { value, componentType }.
    expect(event.formName).toBe("add-task");
    expect(event.formState?.["add-task"]?.title?.value).toBe("Write the runbook");
    expect(event.formState?.["add-task"]?.owner?.value).toBe("Wu");
    expect(event.formState?.["add-task"]?.status?.value).toBe("To do");
  });

  it("a Card drops a Card child even when the parser lets it through", () => {
    const program = [
      `root = Page([outer])`,
      `outer = Card("Outer", "d", [inner])`,
      `inner = Card("Inner", "d", [m])`,
      `m = Markdown("hello")`,
    ].join("\n");
    render(<Renderer response={program} library={openuiLibrary} />);
    expect(screen.queryByText("Inner")).toBeNull();
  });
});
