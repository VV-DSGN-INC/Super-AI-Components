import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { CitationRef } from "@/registry/super-ai/citation-ref";
import { ContentCredentials, type ContentCredentialsRecord } from "@/registry/super-ai/content-credentials";
import { StatReadout } from "@/registry/super-ai/stat-readout";
import { ContentCredentialsDocs } from "@/content/components/content-credentials.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

/**
 * Fixtures are records a C2PA-aware pipeline could emit. The issuer is a
 * placeholder name on purpose: no real organisation is made to vouch for
 * anything here. The model is one this repo's other fixtures already use.
 */
const SIGNED: ContentCredentialsRecord = {
  status: "verified",
  issuer: "Example Issuer CA",
  model: "Flux 1.1 Pro",
  generatedAt: "2026-10-12T09:30:00Z",
};

const HISTORY: ContentCredentialsRecord = {
  ...SIGNED,
  origin: "ai-edited",
  edits: [
    { action: "Generated", by: "Flux 1.1 Pro", at: "2026-10-12T09:30:00Z" },
    { action: "Cropped", by: "Crop tool", at: "2026-10-12T09:41:00Z" },
    { action: "Generative fill", by: "Inpaint tool", at: "2026-10-12T10:05:00Z" },
  ],
};

const meta: Meta<typeof ContentCredentials> = {
  title: "Super AI/Content Credentials",
  component: ContentCredentials,
  parameters: { layout: "centered", docs: { page: componentDocsPage(ContentCredentialsDocs) } },
  // The panel portals below the mark; leave it room so the story is not clipped.
  decorators: [
    (Story) => (
      <div className="flex min-h-80 w-96 items-start justify-center">
        <Story />
      </div>
    ),
  ],
  args: { trigger: "hover-card", defaultOpen: true, credentials: SIGNED },
};

export default meta;
type Story = StoryObj<typeof ContentCredentials>;

/**
 * The signature checks out. Publisher, model and time come through the
 * shared stat grid, under a heading that names the verdict. Verification says
 * who attached the credentials, not that the content is accurate, and the note
 * says so.
 */
export const Verified: Story = {};

/**
 * Metadata is present but the signature failed. The fields stay visible, since
 * hiding them would remove the evidence, but the publisher row relabels
 * itself "Claimed publisher" and the note tells the reader to treat the
 * details as a claim.
 */
export const Unverified: Story = {
  args: { credentials: { ...SIGNED, status: "unverified", origin: "ai-generated" } },
};

/**
 * The credentials were removed. This is a different claim from "human-made"
 * and the copy refuses that reading in terms. Nothing else is shown: a record
 * that no longer exists cannot vouch for a publisher or a model.
 */
export const Stripped: Story = {
  args: { credentials: { status: "stripped" } },
};

/**
 * Verified and declared AI-generated. `origin` is independent of `status`, so
 * the AI row appears here as the issuer's attested statement, not as a guess.
 */
export const AiGenerated: Story = {
  args: { credentials: { ...SIGNED, origin: "ai-generated" } },
};

/**
 * A person's asset that AI changed afterwards. The AI row reads "Edited with
 * AI" and the model row is the one that did the editing, not necessarily the
 * one that made the original.
 */
export const AiEdited: Story = {
  args: { credentials: { ...SIGNED, origin: "ai-edited", model: "Inpaint tool" } },
};

/**
 * The Footprints form: every step, oldest first, each attributed. The list is
 * a real ordered list rendered in the order given. The component never
 * re-sorts, because the order is part of the record.
 */
export const WithHistory: Story = {
  args: { credentials: HISTORY },
};

/* Case stories. See docs/design-system/story-conventions.md. All eight names apply to this component, so none is skipped. */

/**
 * Right-to-left. The mark renders inside the `dir="rtl"` wrapper, so it is the
 * part this story can judge: its glyph leads from the right edge.
 *
 * The panel cannot be judged here, for the reason ModelPicker's RTL story
 * records: it portals to `document.body`, outside the wrapper, so its computed
 * direction reads back `ltr`. In a real app `dir` sits on `<html>` and the
 * portal inherits it. What the story can pin is that the edit list indents
 * with a logical property (`ps-4`), so a future edit to `pl-4` breaks this
 * story and nothing else. Opening the panel also puts it under axe.
 */
export const RTL: Story = {
  args: { credentials: HISTORY },
  render: (args) => (
    <div dir="rtl" className="flex min-h-80 w-96 items-start justify-center">
      <ContentCredentials {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const mark = canvasElement.querySelector<HTMLElement>('[data-slot="content-credentials-mark"]')!;
    await expect(getComputedStyle(mark).direction).toBe("rtl");
    const glyph = mark.querySelector<SVGElement>("svg")!;
    const markBox = mark.getBoundingClientRect();
    await expect(glyph.getBoundingClientRect().left).toBeGreaterThan(markBox.left + markBox.width / 2);

    const list = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="content-credentials-history"] ol');
      if (!el) throw new Error("the panel never opened");
      return el;
    });
    await expect(list).toHaveClass("ps-4");
    await expect(list).not.toHaveClass("pl-4");
  },
};

/**
 * The panel's open transition is the only motion. It comes from the shared
 * hover-card primitive, and the call site restates the paired
 * `motion-reduce:data-open:animate-none` form (the bare form is inert on a Base UI popup). The test
 * runner emulates reduced motion, so this reads `animation-name` back rather
 * than trusting the class.
 */
export const ReducedMotion: Story = {
  play: async () => {
    const popup = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="hover-card-content"]');
      if (!el) throw new Error("the card never opened");
      return el;
    });
    await expect(getComputedStyle(popup).animationName).toBe("none");
  },
};

/**
 * One tab stop: the mark. Focusing it opens the hover-card with no pointer,
 * which is the spec's keyboard requirement for the hover-card form. For the
 * popover form, Enter opens the panel with focus inside it and Escape returns
 * focus to the mark. Both stops show a ring, because the mark sets
 * `focus-visible:ring-2`.
 */
export const KeyboardOrder: Story = {
  args: { defaultOpen: false },
  render: (args) => (
    <div className="flex min-h-80 w-96 flex-col items-start gap-6">
      <ContentCredentials {...args} trigger="hover-card" />
      <ContentCredentials {...args} trigger="popover" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const marks = canvas.getAllByRole("button");
    await expect(marks).toHaveLength(2);

    await userEvent.tab();
    await expect(document.activeElement).toBe(marks[0]);
    await expect(marks[0]!.matches(":focus-visible")).toBe(true);
    await waitFor(() => {
      if (!document.querySelector('[data-slot="hover-card-content"]')) throw new Error("not open yet");
    });
    const ring = getComputedStyle(marks[0]!);
    await expect(ring.boxShadow !== "none" || ring.outlineStyle !== "none").toBe(true);

    await userEvent.tab();
    await waitFor(() => expect(document.activeElement).toBe(marks[1]));
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      if (!document.querySelector('[data-slot="popover-content"]')) throw new Error("popover not open yet");
    });
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.activeElement).toBe(marks[1]));
  },
};

/**
 * Open state is controlled through `open` / `onOpenChange`. Here `open` is
 * pinned to false: clicking the mark reports the request (`true`) and the
 * panel stays closed, and an unrelated re-render of the parent holds it
 * closed. The host owns the value.
 */
export const Controlled: Story = {
  args: { trigger: "popover", defaultOpen: undefined, open: false, onOpenChange: fn() },
  render: function ControlledRender(args) {
    const [renders, setRenders] = React.useState(0);
    return (
      <div className="flex min-h-80 w-96 flex-col items-start gap-3">
        <ContentCredentials {...args} />
        <button
          type="button"
          onClick={() => setRenders((n) => n + 1)}
          className="border-border text-foreground focus-visible:ring-ring rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          Re-render ({renders})
        </button>
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Verified/ }));
    // Base UI passes (open, eventDetails); the open flag is the first argument.
    await waitFor(() => expect(args.onOpenChange).toHaveBeenCalled());
    const [openArg] = (args.onOpenChange as ReturnType<typeof fn>).mock.calls[0] as [boolean];
    await expect(openArg).toBe(true);
    await expect(document.querySelector('[data-slot="content-credentials-panel"]')).toBeNull();

    await userEvent.click(canvas.getByRole("button", { name: /Re-render/ }));
    await expect(document.querySelector('[data-slot="content-credentials-panel"]')).toBeNull();
  },
};

/**
 * Every field is optional except `status`. A verified record with nothing else
 * renders the heading and the note and no grid: the em-dash rows of the stat
 * grid are not shown for fields the record never had. The play function opens
 * nothing; it asserts the grid is absent so a future change that renders empty
 * rows is caught.
 */
export const EmptyLabel: Story = {
  args: { credentials: { status: "verified" } },
  play: async () => {
    await waitFor(() => {
      if (!document.querySelector('[data-slot="content-credentials-panel"]')) throw new Error("not open yet");
    });
    await expect(document.querySelector('[data-slot="stat-readout"]')).toBeNull();
  },
};

/**
 * Author-supplied strings of about 90 characters in the publisher, model and an
 * edit. The panel is a fixed 20rem and wraps them (`break-words`) rather than
 * truncating, so nothing a reader needs to check is hidden behind an ellipsis.
 * The assertion reads the full text back from the DOM.
 */
export const LongContent: Story = {
  args: {
    credentials: {
      ...SIGNED,
      issuer: "Example Issuer Certificate Authority for Newsroom Photography and Illustration Desks",
      model: "Example diffusion model checkpoint 2026-09 fine-tuned for editorial illustration, v3",
      edits: [
        {
          action: "Generative fill over the lower third to extend the background and remove the caption",
          by: "Inpaint tool",
        },
      ],
    },
  },
  play: async () => {
    const panel = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="content-credentials-panel"]');
      if (!el) throw new Error("not open yet");
      return el;
    });
    await expect(panel.textContent).toContain("Newsroom Photography and Illustration Desks");
    await expect(panel.textContent).toContain("remove the caption");
    await expect(getComputedStyle(panel).overflowWrap).toBe("break-word");
  },
};

/**
 * 375px. The panel portals to the body, so a wrapper cannot constrain it;
 * this story resizes the test iframe itself and asserts the open popover sits
 * inside the viewport. The panel is `max-w-[calc(100vw-2rem)]`, which is what
 * keeps a 20rem card from overflowing a phone.
 */
export const Mobile: Story = {
  args: { credentials: HISTORY, trigger: "popover", defaultOpen: false },
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Verified/ }));
    const popup = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="popover-content"]');
      if (!el) throw new Error("not open yet");
      return el;
    });
    const rect = popup.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * Four things in this catalog show provenance-shaped facts, and they get
 * confused because each is "the details behind a thing":
 *
 * - **Content credentials** (this) answers *can I trust where this media came
 *   from*: publisher, model, time, edit trail and a signature verdict.
 * - **Stat readout** is the bare key-value grid this composes. Use it alone
 *   when there is nothing to verify.
 * - **Citation ref** backs a claim in text with a quoted passage. Use it when
 *   the thing being checked is a sentence, not a file.
 * - **Asset detail** and **run inspector** are the whole lightbox and the trace
 *   span; both are surfaces that can host this panel, not substitutes for it.
 */
export const Boundary: Story = {
  args: { defaultOpen: false },
  render: (args) => (
    <div className="flex w-full max-w-lg flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Content credentials: where did this media come from
        </p>
        <ContentCredentials {...args} credentials={HISTORY} />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Stat readout: plain facts, nothing to verify</p>
        <StatReadout
          items={[
            { label: "Model", value: "Flux 1.1 Pro" },
            { label: "Seed", value: "482913" },
          ]}
        />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Citation ref: where did this sentence come from</p>
        <p className="text-foreground text-sm">
          Every component ships with its story and its registry entry in the same commit.
          <CitationRef
            label="1"
            source="CLAUDE.md, Conventions"
            quote="Every component ships with its story and its registry entry in the same commit."
          />
        </p>
      </section>
    </div>
  ),
};
