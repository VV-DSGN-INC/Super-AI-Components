import type { Meta, StoryObj } from "@storybook/react-vite";
import { ImagePlus, Sparkles } from "lucide-react";
import { expect, userEvent, within } from "storybook/test";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { GenerationGrid } from "@/registry/super-ai/generation-grid";
import { PaywallMessage } from "@/registry/super-ai/paywall-message";
import { RateLimitBanner } from "@/registry/super-ai/rate-limit-banner";
import { SafetyBlock } from "@/registry/super-ai/safety-block";
import { EmptyStateDocs } from "@/content/components/empty-state.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { expectPerceptibleFocus } from "@/lib/focus-treatment";

/** Decorative stand-in for one half of a transformation. */
function Swatch({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <div
      aria-hidden
      className={`flex aspect-video items-center justify-center text-xs text-foreground ${
        dim ? "bg-foreground/5" : "bg-foreground/15"
      }`}
    >
      {label}
    </div>
  );
}

const meta: Meta<typeof EmptyState> = {
  title: "Super AI/Empty State",
  component: EmptyState,
  parameters: { layout: "centered", docs: { page: componentDocsPage(EmptyStateDocs) } },
  decorators: [
    (Story) => (
      <div className="w-[44rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/** A whole route with nothing in it. The heading keeps document structure intact. */
export const Page: Story = {
  args: {
    size: "page",
    icon: <ImagePlus />,
    title: <h2 className="text-lg font-medium tracking-tight">No renders yet</h2>,
    description: "Describe a shot and every result lands here.",
    action: (
      <Button>
        <Sparkles aria-hidden />
        Generate a render
      </Button>
    ),
    secondaryAction: <Button variant="ghost">Browse presets</Button>,
  },
};

/** A sidebar or pane. Same slots as the page state — only the frame changes. */
export const Panel: Story = {
  args: {
    size: "panel",
    icon: <ImagePlus />,
    title: "Nothing pinned",
    description: "Pin a render to keep it beside your work.",
    action: (
      <Button size="sm" variant="outline">
        Pin a render
      </Button>
    ),
  },
};

/**
 * A tile in the grid&apos;s first cell. The grid keeps its columns; the empty
 * state never becomes a page takeover.
 */
export const InGrid: Story = {
  render: () => (
    <GenerationGrid
      density="comfortable"
      items={[] as { id: string }[]}
      getItemId={(item) => item.id}
      renderItem={() => null}
      empty={
        <EmptyState
          size="in-grid"
          icon={<ImagePlus />}
          title="No renders yet"
          description="Your results appear here."
          action={
            <Button size="sm" variant="outline">
              Generate a render
            </Button>
          }
        />
      }
    />
  ),
};

/** Before to after — the strongest form for a generation tool. */
export const ExamplePair: Story = {
  args: {
    size: "panel",
    title: "Try a relight",
    description: "Upload a shot and change the lighting without reshooting.",
    examplePair: {
      before: { content: <Swatch label="source photo" dim />, label: "Your photo" },
      after: { content: <Swatch label="relit render" />, label: "Relit" },
      caption: "Prompt: warm rim light, dusk",
    },
    action: (
      <Button size="sm">
        <Sparkles aria-hidden />
        Upload a photo
      </Button>
    ),
  },
};

/* -------------------------------------------------------------------------
 * Case stories — see docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing here animates
 * The only moving part in the tree would be a caller-supplied `action`,
 * whose motion is that component's concern, not this one's.
 *
 * // case-skip: Controlled — no value, onChange or onSelect anywhere in the props
 * Every prop is either static content (`title`, `description`, `icon`) or a
 * caller-supplied node (`action`, `secondaryAction`, `examplePair`) whose
 * own interaction handling belongs to whatever was passed in, not to
 * `EmptyState` itself. There is no selection or value here for external
 * state to drive.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, on the example-pair form, because that is the only variant
 * with a direction to get wrong. The pair reads before → after, and the
 * order of the two figures carries that meaning — the arrow is explicitly
 * `aria-hidden` decoration.
 *
 * Which is what makes this worth rendering: flex reverses the two figures
 * under `dir="rtl"` so the reading order stays correct, but the arrow is a
 * `lucide` `ArrowRight` with a static `rotate-90 sm:rotate-0`, and a glyph
 * rotated by class does not know about direction. Check that it is not
 * pointing from "after" back to "before".
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <EmptyState {...args} />
    </div>
  ),
  args: {
    size: "panel",
    title: "Try a relight",
    description: "Upload a shot and change the lighting without reshooting.",
    examplePair: {
      before: { content: <Swatch label="source photo" dim />, label: "Your photo" },
      after: { content: <Swatch label="relit render" />, label: "Relit" },
      caption: "Prompt: warm rim light, dusk",
    },
    action: (
      <Button size="sm">
        <Sparkles aria-hidden />
        Upload a photo
      </Button>
    ),
  },
};

/**
 * Both actions present. The component owns exactly one keyboard fact and it
 * is an ordering one: `action` renders before `secondaryAction` in the DOM,
 * so the primary verb is the first thing a keyboard user reaches. Since
 * `EmptyContent` is `flex-row flex-wrap`, visual order and tab order agree
 * here — and the assertion below is what keeps them agreeing if someone
 * later reaches for `flex-row-reverse` to move the primary button right.
 *
 * The ring check is `expectPerceptibleFocus`, which measures blur and spread
 * rather than asking whether a box-shadow string exists. Both buttons clear
 * it, including the `ghost` secondary — worth knowing, because a ghost button
 * paints no surface of its own and the ring is the only thing that marks it.
 */
export const KeyboardOrder: Story = {
  args: {
    size: "page",
    icon: <ImagePlus />,
    title: <h2 className="text-lg font-medium tracking-tight">No renders yet</h2>,
    description: "Describe a shot and every result lands here.",
    action: (
      <Button>
        <Sparkles aria-hidden />
        Generate a render
      </Button>
    ),
    secondaryAction: <Button variant="ghost">Browse presets</Button>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole("button");

    await expect(buttons).toHaveLength(2);
    await expect(buttons[0]).toHaveAccessibleName("Generate a render");
    await expect(buttons[1]).toHaveAccessibleName("Browse presets");

    // The KeyboardOrder must-show: every stop is visibly focused. The ring is
    // measured rather than merely present — see `expectPerceptibleFocus`.
    await userEvent.tab();
    while (document.activeElement && canvasElement.contains(document.activeElement)) {
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      await expectPerceptibleFocus(focused);
      await userEvent.tab();
    }
  },
};

/**
 * Title only: no `icon`, no `description`, no `action`. Every one of those
 * is optional, and this is what the component renders when a surface has
 * nothing useful to add — an in-grid cell, or a panel whose CTA would just
 * repeat a button already on screen.
 *
 * The thing to check is that it degrades to a single balanced line rather
 * than a frame with reserved space in it, since `EmptyHeader` and
 * `EmptyContent` are both omitted entirely rather than rendered empty.
 */
export const EmptyLabel: Story = {
  args: {
    size: "panel",
    title: "Nothing pinned",
  },
};

/**
 * A 90-character description against a title long enough to wrap. Both are
 * author-supplied, and both run through the vendored `empty` primitive's
 * `text-balance`, which distributes a wrapped line evenly instead of leaving
 * one word stranded. That is the behaviour worth seeing, and it only shows
 * up past the wrap point.
 */
export const LongContent: Story = {
  args: {
    size: "page",
    icon: <ImagePlus />,
    title: <h2 className="text-lg font-medium tracking-tight">No renders match the filters you have applied</h2>,
    description:
      "Clear a filter or widen the date range, and any render that matches will appear here automatically.",
    action: <Button variant="outline">Clear filters</Button>,
  },
};

/**
 * 375px, on the example-pair form. The pair is `flex-col` below the `sm`
 * breakpoint and `sm:flex-row` above it, so at this width it stacks — and
 * the arrow picks up its `rotate-90`, turning a left-to-right transformation
 * into a top-to-bottom one. The stacked form is what most people see, and no
 * other story in this file renders it.
 */
export const Mobile: Story = {
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <EmptyState {...args} />
    </div>
  ),
  args: {
    size: "panel",
    title: "Try a relight",
    description: "Upload a shot and change the lighting without reshooting.",
    examplePair: {
      before: { content: <Swatch label="source photo" dim />, label: "Your photo" },
      after: { content: <Swatch label="relit render" />, label: "Relit" },
      caption: "Prompt: warm rim light, dusk",
    },
    action: (
      <Button size="sm">
        <Sparkles aria-hidden />
        Upload a photo
      </Button>
    ),
  },
};

/**
 * Four surfaces that all say "there is nothing here for you". They differ by
 * why, and the why decides what the user can do next:
 *
 * - **Empty state** — nothing exists yet, and the user can create it. The
 *   CTA repeats the primary verb of the surface it stands in for. This is
 *   the only one of the four that is not a refusal.
 * - **Paywall message** — it exists, the plan does not cover it. It holds
 *   the work: the prompt and the model stay on the card so upgrading is
 *   resuming rather than retyping.
 * - **Rate limit banner** — temporarily unavailable, and the wait is a
 *   number. It names which of two constraints fired, because telling someone
 *   they overspent their quota when the model is merely busy sends them to
 *   buy an upgrade that fixes nothing.
 * - **Safety block** — refused on policy. It must read as visibly not the
 *   assistant talking: different container, named source, and always a
 *   compliant path out.
 *
 * The deciding question is what changes the outcome: making something
 * (empty), paying (paywall), waiting (rate limit), or rephrasing (safety).
 * If the answer is "nothing the user can do", none of these four is right.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Empty state — nothing yet, and you can make it</p>
        <EmptyState
          size="panel"
          icon={<ImagePlus />}
          title="No renders yet"
          description="Describe a shot and every result lands here."
          action={
            <Button size="sm">
              <Sparkles aria-hidden />
              Generate a render
            </Button>
          }
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Paywall message — it exists, your plan does not cover it</p>
        <PaywallMessage
          state="locked-model"
          prompt="Rooftop garden at golden hour, shallow depth of field"
          model="Render XL"
          // Required by the type, and that is the point: the agent's own
          // words are what keep this a turn in a conversation rather than an
          // interstitial. None of the other three take a prop like it.
          before="I can run this, but Render XL isn't on your current plan."
          onUpgrade={() => {}}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Rate limit banner — available again in a known time</p>
        <RateLimitBanner cause="provider-capacity" remainingSeconds={180} onNotifyMe={() => {}} />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Safety block — refused on policy, with a way forward</p>
        <SafetyBlock
          variant="input-blocked"
          policy="Likeness of a real person"
          alternatives="Describe the lighting and composition instead, and generate an unnamed subject."
        />
      </section>
    </div>
  ),
};
