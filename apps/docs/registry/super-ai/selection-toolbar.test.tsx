import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Languages } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { MAX_TOOLBAR_ACTIONS } from "./context-toolbar";
import { SelectionToolbar, type SelectionIntent } from "./selection-toolbar";

const SELECTION =
  "The current process is not optimal and could probably be improved in a number of ways.";

function bar() {
  return screen.getByRole("toolbar");
}

function root() {
  return document.querySelector('[data-slot="selection-toolbar"]')!;
}

describe("SelectionToolbar", () => {
  it("renders the improve state as the first, structurally distinct verb", async () => {
    const onIntent = vi.fn();
    const user = userEvent.setup();
    render(<SelectionToolbar selectionText={SELECTION} onIntent={onIntent} />);

    expect(bar()).toHaveAccessibleName("AI writing tools");

    const buttons = within(bar()).getAllByRole("button");
    // Improve rides I3's AI slot, so it is index 0 whatever else is in the bar,
    // and it is a different element than the plain verbs rather than a
    // differently-coloured one.
    expect(buttons[0]).toHaveAttribute("data-slot", "context-toolbar-ai");
    expect(buttons[0]).toHaveAccessibleName("Improve");
    expect(within(bar()).getByRole("button", { name: "Shorten" })).toHaveAttribute(
      "data-slot",
      "context-toolbar-action",
    );

    await user.click(buttons[0]);
    expect(onIntent).toHaveBeenCalledWith({ verb: "improve", selectionText: SELECTION });
  });

  it("renders the shorten state as a plain verb that asks rather than edits", async () => {
    const onIntent = vi.fn();
    const user = userEvent.setup();
    render(<SelectionToolbar selectionText={SELECTION} onIntent={onIntent} />);

    const shorten = within(bar()).getByRole("button", { name: "Shorten" });
    expect(shorten).toHaveTextContent("Shorten");

    await user.click(shorten);
    expect(onIntent).toHaveBeenCalledWith({ verb: "shorten", selectionText: SELECTION });
  });

  it("renders the expand state", async () => {
    const onIntent = vi.fn();
    const user = userEvent.setup();
    render(<SelectionToolbar selectionText={SELECTION} onIntent={onIntent} />);

    await user.click(within(bar()).getByRole("button", { name: "Expand" }));
    expect(onIntent).toHaveBeenCalledWith({ verb: "expand", selectionText: SELECTION });
  });

  it("renders the tone-submenu state: one verb, a menu of tones behind it", async () => {
    const onIntent = vi.fn();
    const user = userEvent.setup();
    render(<SelectionToolbar selectionText={SELECTION} onIntent={onIntent} />);

    // Tone is a single button, not five tone buttons competing in the bar.
    expect(within(bar()).queryByRole("button", { name: "Friendly" })).not.toBeInTheDocument();

    await user.click(within(bar()).getByRole("button", { name: "Tone" }));

    const menu = await screen.findByRole("menu");
    expect(within(menu).getAllByRole("menuitem")).toHaveLength(5);

    await user.click(within(menu).getByRole("menuitem", { name: "Friendly" }));
    expect(onIntent).toHaveBeenCalledWith({
      verb: "tone",
      tone: "friendly",
      selectionText: SELECTION,
    });
  });

  it("renders the custom-prompt state as a named dialog with free text, not a navigation", async () => {
    const onIntent = vi.fn();
    const user = userEvent.setup();
    render(<SelectionToolbar selectionText={SELECTION} onIntent={onIntent} />);

    await user.click(within(bar()).getByRole("button", { name: "Custom prompt" }));

    // A Base UI popup is role="dialog"; an unnamed one fails axe outright.
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveAccessibleName("Custom instruction");

    const input = within(dialog).getByRole("textbox");
    await user.type(input, "Rewrite this for a customer email");
    await user.click(within(dialog).getByRole("button", { name: "Rewrite" }));

    expect(onIntent).toHaveBeenCalledWith({
      verb: "custom",
      prompt: "Rewrite this for a customer email",
      selectionText: SELECTION,
    });
    // Submitting closes the surface; the toolbar itself stays where it was.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(bar()).toBeInTheDocument();
  });

  it("emits an intent and never replaces the selected text", async () => {
    const intents: SelectionIntent[] = [];
    const user = userEvent.setup();
    render(
      <div>
        <p data-testid="document">{SELECTION}</p>
        <SelectionToolbar selectionText={SELECTION} onIntent={(intent) => intents.push(intent)} />
      </div>,
    );

    await user.click(within(bar()).getByRole("button", { name: "Improve" }));
    await user.click(within(bar()).getByRole("button", { name: "Shorten" }));

    // The whole contract of family K: a rewrite comes back as a K3 diff the
    // reader can reject. The toolbar has no write path — no `value`, no
    // `onReplace` — so the prose is untouched by definition.
    expect(screen.getByTestId("document")).toHaveTextContent(SELECTION);
    expect(intents).toEqual([
      { verb: "improve", selectionText: SELECTION },
      { verb: "shorten", selectionText: SELECTION },
    ]);
  });

  it("composes I3 rather than restating it", () => {
    render(<SelectionToolbar selectionText={SELECTION} />);

    // I3's own slot survives inside K4's root — the composition is visible in
    // the DOM, not just in the import list.
    expect(root().querySelector('[data-slot="context-toolbar"]')).toBeInTheDocument();
    expect(bar()).toHaveAttribute("data-selection", "text");
    expect(bar()).toHaveAttribute("data-placement", "above");
  });

  it("reserves the popup verbs out of I3's ceiling, so eight buttons stays eight", async () => {
    const user = userEvent.setup();
    const extras = Array.from({ length: 12 }, (_, i) => ({
      id: `extra-${i}`,
      label: `Extra ${i}`,
      icon: <Languages />,
    }));
    const onIntent = vi.fn();
    render(<SelectionToolbar actions={extras} onIntent={onIntent} />);

    // Improve + Shorten + Expand + three extras + Tone + Custom prompt = 8,
    // plus the overflow trigger, which is an affordance rather than a verb.
    expect(within(bar()).getAllByRole("button")).toHaveLength(MAX_TOOLBAR_ACTIONS + 1);
    // Tone and Custom prompt are never the ones pushed out.
    expect(within(bar()).getByRole("button", { name: "Tone" })).toBeInTheDocument();
    expect(within(bar()).getByRole("button", { name: "Custom prompt" })).toBeInTheDocument();

    await user.click(within(bar()).getByRole("button", { name: "More actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Extra 11" }));
    expect(onIntent).toHaveBeenCalledWith({
      verb: "action",
      id: "extra-11",
      selectionText: undefined,
    });
  });

  it("holds the bar in place while a rewrite is in flight, and says so", async () => {
    const onIntent = vi.fn();
    const user = userEvent.setup();
    render(<SelectionToolbar selectionText={SELECTION} pending="improve" onIntent={onIntent} />);

    expect(root()).toHaveAttribute("data-pending", "improve");
    expect(root()).toHaveAttribute("aria-busy", "true");
    // Announced, not silently swapped in — and the message names the contract.
    expect(screen.getByRole("status")).toHaveTextContent(
      "Improving the selection. The result will arrive as a change you can review.",
    );

    // A toolbar item stays focusable while disabled so keyboard travel does not
    // skip it; a second request is refused all the same.
    expect(within(bar()).getByRole("button", { name: "Shorten" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await user.click(within(bar()).getByRole("button", { name: "Improve" }));
    await user.click(within(bar()).getByRole("button", { name: "Shorten" }));
    expect(onIntent).not.toHaveBeenCalled();
  });

  it("drops the tone verb entirely when a product has no tones", () => {
    render(<SelectionToolbar tones={[]} />);

    expect(within(bar()).queryByRole("button", { name: "Tone" })).not.toBeInTheDocument();
    expect(within(bar()).getByRole("button", { name: "Custom prompt" })).toBeInTheDocument();
  });

  it("lets a host drive which surface is open", async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<SelectionToolbar open={null} onOpenChange={onOpenChange} />);

    await user.click(within(bar()).getByRole("button", { name: "Tone" }));
    // Controlled means controlled: the request is reported and nothing opens
    // until the host says so.
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith("tone"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    rerender(<SelectionToolbar open="custom" onOpenChange={onOpenChange} />);
    expect(await screen.findByRole("dialog")).toHaveAccessibleName("Custom instruction");
    expect(root()).toHaveAttribute("data-surface", "custom");
  });

  it("renames every verb without changing what it emits", async () => {
    const onIntent = vi.fn();
    const user = userEvent.setup();
    render(
      <SelectionToolbar
        improveLabel="Améliorer"
        shortenLabel="Raccourcir"
        toneLabel="Ton"
        customLabel="Instruction"
        label="Outils de rédaction"
        onIntent={onIntent}
      />,
    );

    expect(bar()).toHaveAccessibleName("Outils de rédaction");
    await user.click(within(bar()).getByRole("button", { name: "Raccourcir" }));
    expect(onIntent).toHaveBeenCalledWith({ verb: "shorten", selectionText: undefined });
  });

  it("passes className through", () => {
    render(<SelectionToolbar className="test-class" />);
    expect(document.querySelector('[data-slot="selection-toolbar"]')!.className).toContain(
      "test-class",
    );
  });
});
