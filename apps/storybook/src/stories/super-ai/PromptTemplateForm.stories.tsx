import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";

import { PromptTemplateForm } from "@/registry/super-ai/prompt-template-form";
import type { TemplateSegment } from "@/registry/super-ai/prompt-template-form";
import { SlotSummary } from "@/registry/super-ai/slot-summary";
import { PromptTemplateFormDocs } from "@/content/components/prompt-template-form.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof PromptTemplateForm> = {
  title: "Super AI/Prompt Template Form",
  component: PromptTemplateForm,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PromptTemplateFormDocs) } },
};

export default meta;
type Story = StoryObj<typeof PromptTemplateForm>;

/** A product announcement. Two blanks are required; tone is a pick with no default here. */
const ANNOUNCEMENT: TemplateSegment[] = [
  "Write a ",
  { id: "tone", label: "Tone", kind: "select", options: ["friendly", "formal", "playful"] },
  " announcement for ",
  { id: "audience", label: "Audience", kind: "text", required: true, placeholder: "who it is for" },
  " about ",
  { id: "topic", label: "Topic", kind: "text", required: true, placeholder: "what changed" },
  ".",
];

/** The same sentence with the template choosing the tone. */
const ANNOUNCEMENT_WITH_DEFAULT: TemplateSegment[] = ANNOUNCEMENT.map((segment) =>
  typeof segment !== "string" && segment.id === "tone" ? { ...segment, defaultValue: "friendly" } : segment,
);

/**
 * Nothing filled in. Every required blank says "Required" in plain text but is
 * not flagged: an untouched form is not a mistake, so red waits for an attempt
 * to run. The preview already shows the sentence with the holes bracketed, so
 * the person sees the shape of what they are building before typing a word.
 */
export const Empty: Story = {
  args: { template: ANNOUNCEMENT, layout: "stacked" },
};

/**
 * Some blanks answered, some not. The preview follows each keystroke, and a
 * required blank that still has no value stays bracketed in it. This is the
 * state most people spend most of their time in, so the preview is the thing
 * that has to read well.
 */
export const PartiallyFilled: Story = {
  args: {
    template: ANNOUNCEMENT,
    layout: "inline",
    defaultValues: { tone: "formal", audience: "enterprise admins" },
  },
};

/**
 * Every required blank has a value, so Run is live and the preview holds no
 * brackets. What the preview shows here is character for character what
 * `onRun` receives; there is one function behind both.
 */
export const Complete: Story = {
  args: {
    template: ANNOUNCEMENT,
    layout: "stacked",
    defaultValues: { tone: "friendly", audience: "existing customers", topic: "the new export formats" },
    onRun: fn(),
  },
};

/**
 * The template has chosen the tone. The blank wears a Default mark until the
 * person edits it, the way D7 slot-summary marks a defaulted slot, so a person
 * can tell what they chose from what the template chose. Editing it, even to
 * the same word, makes it theirs and the mark goes.
 */
export const WithDefaults: Story = {
  args: { template: ANNOUNCEMENT_WITH_DEFAULT, layout: "inline" },
};

/**
 * Both required blanks are empty and the form has been told to say so. Each is
 * marked where it sits with the words "Still needed" and `aria-invalid`, the
 * count appears beside Run, and pressing Run would refuse and move focus to
 * the first one. Run is deliberately not disabled: a dead button cannot say
 * why, and cannot take anyone to the blank that is missing.
 */
export const MissingRequired: Story = {
  args: { template: ANNOUNCEMENT_WITH_DEFAULT, layout: "stacked", showMissing: true, onRun: fn() },
};

/**
 * Step two of a brief, outline, draft flow. The topic and audience arrive from
 * the Brief step, each marked "From Brief" so the person knows where they came
 * from, and each is an ordinary editable field. Editing one drops its mark:
 * from that moment it is no longer the carried value.
 */
export const MultiStep: Story = {
  args: {
    layout: "inline",
    step: { current: 2, total: 3, label: "Outline" },
    template: [
      "Outline an article about ",
      { id: "topic", label: "Topic", kind: "text", required: true, carriedFrom: "Brief" },
      " for ",
      { id: "audience", label: "Audience", kind: "text", required: true, carriedFrom: "Brief" },
      " in ",
      {
        id: "sections",
        label: "Sections",
        kind: "select",
        options: ["three sections", "five sections", "seven sections"],
        defaultValue: "five sections",
      },
      ".",
    ],
    defaultValues: { topic: "heat pumps", audience: "first-time buyers" },
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as opposed
 * to the prop combinations above. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — no animate-* class and no transition that moves anything
 * The only motion class in prompt-template-form.tsx's own markup is none: the
 * form, marks and preview appear and change without animating (grep for
 * `animate-` and `transition` returns nothing in that file). The vendored
 * Input's `transition-colors` only crossfades a border colour, and the select
 * popup's open/close animation is the vendored SelectContent's own, which
 * already restates `motion-reduce:data-open:animate-none`. A story here would
 * render identically to `Complete`.
 *
 * // case-skip: EmptyLabel — `label` is required on every blank
 * A blank without a label has no accessible name in `inline`, and the type
 * does not allow it. The optional text slots (`placeholder`, `runLabel`) fall
 * back to the label and to "Run prompt", so there is no unnamed rendering.
 * ------------------------------------------------------------------------- */

/**
 * Under `dir="rtl"`. The stacked rows are a grid and a flex row, so the label
 * column, the control and the mark trade sides on their own with no physical
 * `left` or `right` anywhere in the file. The text a person types stays in its
 * own direction; the preview is plain flowing text and follows the document.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" data-testid="rtl-frame">
      <PromptTemplateForm {...args} />
    </div>
  ),
  args: {
    template: ANNOUNCEMENT_WITH_DEFAULT,
    layout: "stacked",
    defaultValues: { audience: "design leads" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frame = canvas.getByTestId("rtl-frame");
    await expect(getComputedStyle(frame).direction).toBe("rtl");

    // The label column sits at the inline start, which is the visual right.
    const label = canvas.getByText("Audience", { selector: "label" });
    const input = canvas.getByRole("textbox", { name: "Audience" });
    await expect(label.getBoundingClientRect().left).toBeGreaterThan(input.getBoundingClientRect().left);
  },
};

/**
 * The tab sequence is the blanks in source order and then Run: four stops
 * here, in both layouts. Every stop paints a focus ring that focus caused. The
 * mark and the preview are never stops. A refused Run moves focus once, to the
 * first required blank that is empty, and the story walks that too.
 */
export const KeyboardOrder: Story = {
  args: { template: ANNOUNCEMENT_WITH_DEFAULT, layout: "stacked", onRun: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const stops = [
      canvas.getByRole("combobox", { name: "Tone" }),
      canvas.getByRole("textbox", { name: "Audience" }),
      canvas.getByRole("textbox", { name: "Topic" }),
      canvas.getByRole("button", { name: "Run prompt" }),
    ];

    for (const stop of stops) {
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).toBe(stop));
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
    }

    // One more tab leaves the component; the preview was never a stop.
    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);

    // Run with the blanks empty: refused, and focus goes to the first gap.
    await userEvent.click(canvas.getByRole("button", { name: "Run prompt" }));
    await expect(args.onRun).not.toHaveBeenCalled();
    await waitFor(() => expect(document.activeElement).toBe(stops[1]));
    await expect(stops[1]).toHaveAttribute("aria-invalid", "true");
  },
};

/**
 * `values` in, `onValuesChange(record)` out. The form keeps no copy of any
 * value: typing reports the full next record and the field stays where the
 * caller left it until the caller passes the new record back. The play types
 * into a form whose `values` never change, checks the callback carries what a
 * caller needs to apply the edit, and checks the field held.
 */
export const Controlled: Story = {
  args: {
    template: ANNOUNCEMENT_WITH_DEFAULT,
    layout: "stacked",
    values: { audience: "design leads" },
    onValuesChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const audience = canvas.getByRole("textbox", { name: "Audience" });

    await userEvent.type(audience, "!");

    await expect(args.onValuesChange).toHaveBeenLastCalledWith({ audience: "design leads!" });
    await expect(audience).toHaveValue("design leads");
    await expect(canvas.getByRole("status", { name: "Prompt preview" })).toHaveTextContent(
      "for design leads about",
    );
  },
};

/**
 * A 90-character audience. A text input cannot wrap, so the field keeps its
 * width and scrolls the text inside it; the full value is always readable in
 * the preview, which wraps (`break-words`, `whitespace-pre-wrap`) instead of
 * growing the form sideways. That is the reason the preview exists next to the
 * blanks and not only at the end.
 */
export const LongContent: Story = {
  args: {
    template: ANNOUNCEMENT_WITH_DEFAULT,
    layout: "stacked",
    defaultValues: {
      audience: "engineering managers at mid-sized logistics companies who have never used an AI assistant",
      topic: "the new export formats",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const preview = canvas.getByRole("status", { name: "Prompt preview" });
    await expect(preview).toHaveTextContent("never used an AI assistant about the new export formats.");
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="prompt-template-form"]')!;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
  },
};

/**
 * 375px, the `inline` layout, with a default, a carried value and a missing
 * one. The sentence wraps and each blank is capped at `max-w-full`, so the
 * page does not scroll sideways. This is a width wrapper rather than a phone:
 * nothing in the component keys on a breakpoint, so the box is the whole test.
 * `stacked` is the better choice at this width once there are four blanks or
 * more, because the sentence gets hard to follow when every other word is a
 * control.
 */
export const Mobile: Story = {
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <PromptTemplateForm {...args} />
    </div>
  ),
  args: {
    template: ANNOUNCEMENT_WITH_DEFAULT,
    layout: "inline",
    showMissing: true,
    defaultValues: { audience: "design leads" },
  },
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("mobile-frame");
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

/**
 * Four ways to put values in front of a model, and the rule for choosing:
 *
 * - **Prompt template form** asks for the variables *before* the run. The
 *   person fills named blanks and reads the assembled prompt.
 * - **Slot summary** reads values back *after* the system understood a
 *   request, marking which it inferred, so the person can correct one before
 *   anything happens.
 *
 * If the person is supplying the words, it is a template. If the system
 * supplied them and the person is auditing, it is a slot summary. Generation
 * settings (temperature, seed) are neither: they live in a parameter panel.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Prompt template form: the person fills the blanks
        </p>
        <PromptTemplateForm
          layout="stacked"
          template={ANNOUNCEMENT_WITH_DEFAULT}
          defaultValues={{ audience: "design leads", topic: "the new export formats" }}
        />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Slot summary: the system read the request back</p>
        <SlotSummary
          slots={[
            { id: "audience", label: "Audience", value: "design leads", source: "stated", required: true },
            {
              id: "topic",
              label: "Topic",
              value: "the new export formats",
              source: "stated",
              required: true,
            },
            { id: "tone", label: "Tone", value: "friendly", source: "defaulted" },
          ]}
          onCorrect={() => {}}
        />
      </section>
    </div>
  ),
};
