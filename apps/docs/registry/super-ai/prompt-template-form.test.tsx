import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { expectAccessibleName } from "@/lib/test-utils";

import { PromptTemplateForm, type TemplateSegment } from "./prompt-template-form";

const BRIEF: TemplateSegment[] = [
  "Write a ",
  {
    id: "tone",
    label: "Tone",
    kind: "select",
    options: ["friendly", "formal", "playful"],
    defaultValue: "friendly",
  },
  " announcement for ",
  { id: "audience", label: "Audience", kind: "text", required: true, placeholder: "who it is for" },
  " about ",
  { id: "topic", label: "Topic", kind: "text", required: true },
  ".",
];

const NO_DEFAULT: TemplateSegment[] = [
  "Summarise ",
  { id: "doc", label: "Document", kind: "text", required: true },
  " for ",
  { id: "reader", label: "Reader", kind: "text" },
  ".",
];

function preview(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-slot="prompt-template-form-preview-text"]')!;
}

describe("PromptTemplateForm", () => {
  it("renders the empty state: every required blank is asked for and the preview shows the hole", () => {
    render(<PromptTemplateForm template={NO_DEFAULT} />);

    const doc = screen.getByRole("textbox", { name: "Document" });
    expect(doc).toHaveValue("");
    expect(screen.getByText("Required")).toBeInTheDocument();
    // Nothing is flagged before the person has tried anything.
    expect(doc).not.toHaveAttribute("aria-invalid");
    expect(preview()).toHaveTextContent("Summarise [Document] for .");
  });

  it("renders the partially-filled state: the preview follows each keystroke", async () => {
    const user = userEvent.setup();
    render(<PromptTemplateForm template={NO_DEFAULT} />);

    await user.type(screen.getByRole("textbox", { name: "Document" }), "the Q3 report");
    expect(preview()).toHaveTextContent("Summarise the Q3 report for .");
    expect(screen.queryByText("Required")).not.toBeInTheDocument();
  });

  it("renders the complete state: onRun receives exactly the text the preview shows", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<PromptTemplateForm template={NO_DEFAULT} onRun={onRun} />);

    await user.type(screen.getByRole("textbox", { name: "Document" }), "the Q3 report");
    await user.type(screen.getByRole("textbox", { name: "Reader" }), "the board");
    await user.click(screen.getByRole("button", { name: "Run prompt" }));

    const sent = onRun.mock.calls[0]![0] as string;
    expect(sent).toBe("Summarise the Q3 report for the board.");
    expect(preview().textContent).toBe(sent);
    expect(onRun.mock.calls[0]![1]).toEqual({ doc: "the Q3 report", reader: "the board" });
  });

  it("an empty optional blank is left out of the sent prompt without doubling spaces", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(
      <PromptTemplateForm
        template={["Draft a ", { id: "kind", label: "Kind", kind: "text" }, " note"]}
        onRun={onRun}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Run prompt" }));
    expect(onRun).toHaveBeenCalledWith("Draft a note", { kind: "" });
  });

  it("renders the with-defaults state: a default is marked in text, and editing it makes it the person's", async () => {
    const user = userEvent.setup();
    render(<PromptTemplateForm template={BRIEF} />);

    const tone = screen.getByRole("combobox", { name: "Tone" });
    expect(within(tone).getByText("friendly")).toBeInTheDocument();
    const row = document.querySelector('[data-slot="prompt-template-form-blank"]')!;
    expect(row).toHaveAttribute("data-source", "default");
    expect(within(row as HTMLElement).getByText("Default")).toBeInTheDocument();
    expect(preview()).toHaveTextContent("Write a friendly announcement");
    expectAccessibleName(tone, "Tone");
    expect(tone).toHaveAccessibleDescription("Default");

    await user.click(tone);
    await user.click(await screen.findByRole("option", { name: "formal" }));

    expect(preview()).toHaveTextContent("Write a formal announcement");
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
    expect(row).toHaveAttribute("data-source", "entered");
  });

  it("renders the missing-required state: marked in place, run blocked, focus on the first blank", async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<PromptTemplateForm template={BRIEF} onRun={onRun} />);

    await user.click(screen.getByRole("button", { name: "Run prompt" }));

    expect(onRun).not.toHaveBeenCalled();
    const audience = screen.getByRole("textbox", { name: "Audience" });
    const topic = screen.getByRole("textbox", { name: "Topic" });
    expect(audience).toHaveAttribute("aria-invalid", "true");
    expect(topic).toHaveAttribute("aria-invalid", "true");
    // Text, not just the red border, says what is wrong and where.
    expect(audience).toHaveAccessibleDescription("Still needed");
    expect(audience).toHaveFocus();
    expect(screen.getByText("2 still needed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run prompt" })).toBeEnabled();
  });

  it("showMissing marks the blanks before anything is attempted", () => {
    render(<PromptTemplateForm template={BRIEF} showMissing />);
    expect(screen.getByRole("textbox", { name: "Audience" })).toHaveAttribute("aria-invalid", "true");
  });

  it("clearing a required blank marks it straight away", async () => {
    const user = userEvent.setup();
    render(<PromptTemplateForm template={NO_DEFAULT} />);
    const doc = screen.getByRole("textbox", { name: "Document" });
    await user.type(doc, "x");
    expect(doc).not.toHaveAttribute("aria-invalid");
    await user.clear(doc);
    expect(doc).toHaveAttribute("aria-invalid", "true");
  });

  it("renders the multi-step state: a carried value says where it came from and stays editable", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    render(
      <PromptTemplateForm
        step={{ current: 2, total: 3, label: "Outline" }}
        template={[
          "Outline an article about ",
          { id: "topic", label: "Topic", kind: "text", required: true, carriedFrom: "Brief" },
          " for ",
          { id: "audience", label: "Audience", kind: "text", required: true, carriedFrom: "Brief" },
          ".",
        ]}
        defaultValues={{ topic: "heat pumps", audience: "first-time buyers" }}
        onValuesChange={onValuesChange}
      />,
    );

    expect(screen.getByText("Step 2 of 3 · Outline")).toBeInTheDocument();
    const topic = screen.getByRole("textbox", { name: "Topic" });
    expect(topic).toHaveValue("heat pumps");
    expect(topic).toHaveAccessibleDescription("From Brief");
    expect(screen.getAllByText("From Brief")).toHaveLength(2);

    await user.type(topic, "!");
    expect(topic).toHaveValue("heat pumps!");
    expect(onValuesChange).toHaveBeenLastCalledWith({ topic: "heat pumps!", audience: "first-time buyers" });
    // Edited, so it is no longer the carried value.
    expect(screen.getAllByText("From Brief")).toHaveLength(1);
    expect(preview()).toHaveTextContent("Outline an article about heat pumps! for first-time buyers.");
  });

  it("layout inline: each blank is a control named by its label, not by the prose around it", () => {
    render(<PromptTemplateForm layout="inline" template={BRIEF} />);

    const audience = screen.getByRole("textbox", { name: "Audience" });
    expectAccessibleName(audience, "Audience");
    expectAccessibleName(screen.getByRole("combobox", { name: "Tone" }), "Tone");
    // The control sits inside the sentence, between its two text segments.
    expect(audience.closest('[data-slot="prompt-template-form-template"]')).toHaveTextContent(
      "announcement for",
    );
    expect(document.querySelector('[data-slot="field-row"]')).toBeNull();
    expect(document.querySelector('[data-slot="prompt-template-form"]')).toHaveAttribute(
      "data-layout",
      "inline",
    );
  });

  it("layout stacked: each blank is a labelled A6 field-row", () => {
    render(<PromptTemplateForm layout="stacked" template={BRIEF} />);

    expect(document.querySelectorAll('[data-slot="field-row"]')).toHaveLength(3);
    const audience = screen.getByLabelText("Audience");
    expect(audience).toBe(screen.getByRole("textbox", { name: "Audience" }));
    expect(document.querySelector('[data-slot="prompt-template-form"]')).toHaveAttribute(
      "data-layout",
      "stacked",
    );
  });

  it("the preview is a polite live region named for what it is", () => {
    render(<PromptTemplateForm template={NO_DEFAULT} />);
    const region = screen.getByRole("status", { name: "Prompt preview" });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toBe(preview());
  });

  it("a controlled form does not move until the host applies the change", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();
    const { rerender } = render(
      <PromptTemplateForm template={NO_DEFAULT} values={{ doc: "A" }} onValuesChange={onValuesChange} />,
    );

    await user.type(screen.getByRole("textbox", { name: "Document" }), "B");
    expect(onValuesChange).toHaveBeenCalledWith({ doc: "AB" });
    expect(screen.getByRole("textbox", { name: "Document" })).toHaveValue("A");

    rerender(
      <PromptTemplateForm template={NO_DEFAULT} values={{ doc: "AB" }} onValuesChange={onValuesChange} />,
    );
    expect(screen.getByRole("textbox", { name: "Document" })).toHaveValue("AB");
  });

  it("passes className through", () => {
    render(<PromptTemplateForm template={NO_DEFAULT} className="test-class" />);
    expect(document.querySelector('[data-slot="prompt-template-form"]')!.className).toContain("test-class");
  });
});
