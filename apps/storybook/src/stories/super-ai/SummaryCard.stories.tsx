import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { settledFocusRing } from "@/lib/focus-ring";
import { AnswerBlock } from "@/registry/super-ai/answer-block";
import { SourceCards } from "@/registry/super-ai/source-cards";
import { SummaryCard, type SummaryPoint, type SummaryQuote } from "@/registry/super-ai/summary-card";
import { SummaryCardDocs } from "@/content/components/summary-card.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SummaryCard> = {
  title: "Super AI/Summary Card",
  component: SummaryCard,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SummaryCardDocs) } },
  // The card is `w-full max-w-md`; inside the centred layout a percentage width
  // has nothing to resolve against, so every story gets a definite parent.
  decorators: [
    (Story) => (
      <div className="w-[28rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SummaryCard>;

const SCOPE = { kind: "document", title: "leave-policy-emea.docx", href: "#leave-policy-emea" } as const;

/* An HR policy, the same corpus the retrieval stories use, so the Boundary
 * story can put this card beside K7 and K8 over one set of facts. */
const SHORT: SummaryPoint[] = [
  {
    id: "s1",
    text: "Parental leave is 16 weeks at full pay, starting within 12 months of the birth or placement.",
  },
];

const DETAILED: SummaryPoint[] = [
  { id: "d1", text: "Parental leave is 16 weeks at full pay for employees in the EMEA entities." },
  { id: "d2", text: "The first four weeks are taken in one block that begins within 12 months." },
  { id: "d3", text: "The remaining weeks can be split into blocks of at least one week." },
];

const KEY_POINTS: SummaryPoint[] = [
  { id: "k1", text: "16 weeks at full pay." },
  { id: "k2", text: "First four weeks in one block." },
  { id: "k3", text: "Remaining weeks in blocks of one week or more." },
];

const CITED: SummaryPoint[] = [
  { id: "c1", text: "Parental leave is 16 weeks at full pay.", citations: [1] },
  { id: "c2", text: "The first four weeks are taken in one block.", citations: [2] },
  { id: "c3", text: "Contractors are not covered by the policy." },
];

const QUOTES: SummaryQuote[] = [
  {
    id: "q1",
    text: "Eligible employees receive 16 weeks of parental leave at 100% of base salary.",
    locator: "leave-policy-emea.docx, section 2.1",
  },
  {
    id: "q2",
    text: "The initial four-week block is continuous and must begin within 12 months.",
    locator: "leave-policy-emea.docx, section 2.3",
  },
];

/** The host's marker. The card decides where it sits; this is the host's half. */
function Marker({ index }: { index: number }) {
  return (
    <button
      type="button"
      aria-label={`Source ${index}`}
      className="focus-visible:ring-ring ms-1 rounded-sm px-1 text-xs underline focus-visible:ring-2 focus-visible:outline-none"
    >
      {index}
    </button>
  );
}

/* -------------------------------------------------------------------------
 * Declared states.
 * ---------------------------------------------------------------------- */

/**
 * Regeneration in flight. The body becomes a polite status line with two
 * placeholder lines, and the card keeps its frame, label and depth control, so
 * a reader who just changed depth sees the card working rather than vanish.
 */
export const Generating: Story = {
  args: { scope: SCOPE, depth: "short", state: "generating", onDepthChange: fn() },
};

/**
 * The resting card at the detailed depth: the scope stated in text and linked,
 * the summarized label, and the three presets with the current one pressed.
 */
export const Ready: Story = {
  args: { scope: SCOPE, depth: "detailed", state: "ready", points: DETAILED, onDepthChange: fn() },
};

/**
 * Points with sources. Each point lists the indices it rests on and the card
 * puts the host's marker at the end of that point. The third point cites
 * nothing and shows no marker, which is the honest picture.
 */
export const Attributed: Story = {
  args: {
    scope: SCOPE,
    depth: "detailed",
    state: "attributed",
    points: CITED,
    renderCitation: (index) => <Marker index={index} />,
    onDepthChange: fn(),
  },
};

/**
 * For text where rewording changes the meaning: the key passages as they
 * stand, framed by one line saying they are quoted. Locators say where each sits.
 */
export const QuoteAndCondense: Story = {
  args: {
    scope: { kind: "section", title: "2 Entitlement", href: "#leave-policy-emea-2" },
    depth: "short",
    state: "quote-and-condense",
    quotes: QUOTES,
    onDepthChange: fn(),
  },
};

/**
 * A card in a dense list: the first point and an expand control. The depth
 * presets are held back until the card opens, so the collapsed height is one point.
 */
export const Collapsed: Story = {
  args: { scope: SCOPE, depth: "detailed", state: "collapsed", points: DETAILED, onDepthChange: fn() },
};

/**
 * Automatic summaries are off. The card stays in the layout and says so, with
 * the way back. There is no AI label because nothing was summarized.
 */
export const TurnedOff: Story = {
  args: { scope: SCOPE, state: "turned-off", onTurnOn: fn() },
};

/**
 * The third depth. Key points render as a list of short fragments, which is
 * the scanning form; the other two depths render paragraphs.
 */
export const DepthKeyPoints: Story = {
  args: { scope: SCOPE, depth: "key-points", points: KEY_POINTS, onDepthChange: fn() },
};

/* -------------------------------------------------------------------------
 * Case stories. See docs/design-system/story-conventions.md.
 *
 * All eight are written below; none is skipped.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left. The header row, the footer and the marker spacing all use
 * logical properties (`gap`, `ps-5` on the list, `ms-*` on the marker), so the
 * label leads on the right and the key-point bullets sit on the right edge.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <SummaryCard
        {...args}
        scope={SCOPE}
        depth="key-points"
        state="attributed"
        points={CITED}
        renderCitation={(index) => <Marker index={index} />}
        onTurnOff={fn()}
      />
    </div>
  ),
};

/**
 * The only motion is the placeholder pulse in `generating`, and it carries
 * `motion-reduce:animate-none` on each line. The run forces
 * `prefers-reduced-motion: reduce`, so the play reads the computed
 * `animation-name` back rather than trusting the class.
 */
export const ReducedMotion: Story = {
  args: { scope: SCOPE, depth: "short", state: "generating", onDepthChange: fn() },
  play: async ({ canvasElement }) => {
    const lines = canvasElement.querySelectorAll('[data-slot="skeleton"]');
    await expect(lines).toHaveLength(2);
    for (const line of lines) await expect(getComputedStyle(line).animationName).toBe("none");
  },
};

/**
 * The tab order, in reading order: the link back to the source, the depth
 * control as one stop (the roving tab stop rests on the first preset, whichever is selected), the host's markers in
 * the order they appear, then the footer action. Every stop shows a ring that
 * `settledFocusRing` waits for, not a shadow string that is present when off.
 */
export const KeyboardOrder: Story = {
  args: {
    scope: SCOPE,
    depth: "detailed",
    state: "attributed",
    points: CITED,
    renderCitation: (index) => <Marker index={index} />,
    onDepthChange: fn(),
    onTurnOff: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stops = [
      canvas.getByRole("link", { name: "leave-policy-emea.docx" }),
      canvas.getByRole("button", { name: "Short" }),
      canvas.getByRole("button", { name: "Source 1" }),
      canvas.getByRole("button", { name: "Source 2" }),
      canvas.getByRole("button", { name: "Turn off summaries" }),
    ];
    for (const stop of stops) {
      const before = document.activeElement;
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).not.toBe(before));
      await expect(document.activeElement).toBe(stop);
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
    }
  },
};

/**
 * Depth is controlled by the host. Pressing "Key points" calls
 * `onDepthChange("key-points")` and nothing else: the pressed button stays on
 * Short until the host passes the new depth, and un-pressing the current depth
 * calls nothing.
 */
export const Controlled: Story = {
  args: { scope: SCOPE, depth: "short", points: SHORT, onDepthChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Key points" }));
    await expect(args.onDepthChange).toHaveBeenCalledTimes(1);
    await expect(args.onDepthChange).toHaveBeenCalledWith("key-points");
    await expect(canvas.getByRole("button", { name: "Short" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Short" }));
    await expect(args.onDepthChange).toHaveBeenCalledTimes(1);
  },
};

/**
 * The one optional text slot is a quote's locator. Without it the figcaption
 * is not rendered at all, so a bare quotation sits alone and no empty line
 * holds space under it.
 */
export const EmptyLabel: Story = {
  args: {
    scope: SCOPE,
    depth: "short",
    state: "quote-and-condense",
    quotes: QUOTES.map(({ id, text }) => ({ id, text })),
    onDepthChange: fn(),
  },
};

/**
 * A 90-character source title and a long point. Both wrap: the scope sentence
 * and the points use `break-words`, so a filename with no spaces breaks at the
 * edge instead of pushing the card wider.
 */
export const LongContent: Story = {
  args: {
    scope: {
      kind: "document",
      title: "employee-handbook-2026-emea-parental-leave-and-flexible-working-supplement-final-v3.pdf",
      href: "#handbook",
    },
    depth: "short",
    points: [
      {
        id: "long",
        text: "Employees who joined before the policy took effect keep their previous entitlement until it lapses, and any leave already booked is honoured under the old terms.",
      },
    ],
    onDepthChange: fn(),
  },
};

/**
 * 375px. The depth presets wrap rather than scroll, the footer actions wrap,
 * and nothing is wider than the frame. The wrapper constrains width only; no
 * breakpoint in this component changes layout.
 */
export const Mobile: Story = {
  render: (args) => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full">
      <SummaryCard
        {...args}
        scope={SCOPE}
        depth="key-points"
        state="attributed"
        points={CITED}
        renderCitation={(index) => <Marker index={index} />}
        onTurnOff={fn()}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = canvasElement.querySelector<HTMLElement>('[data-testid="mobile-frame"]')!;
    await expect(frame.scrollWidth).toBeLessThanOrEqual(frame.clientWidth);
  },
};

/**
 * Three components that put generated text about sources on screen. The
 * choosing rule is what the reader already has:
 *
 * - **Summary card** condenses one named source the reader already holds.
 * - **Answer block** answers a question from sources retrieved for it, with a
 *   citation on each claim and a verdict on coverage.
 * - **Source cards** show the set retrieval found, with no generated prose.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Summary card: one source, condensed</p>
        <SummaryCard scope={SCOPE} depth="short" points={SHORT} onDepthChange={fn()} />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Answer block: a question, answered from sources</p>
        <AnswerBlock
          claims={[
            {
              id: "length",
              text: "Statutory parental leave in the EMEA entities is 16 weeks at full pay.",
              citations: [
                {
                  id: "length-1",
                  label: "1",
                  source: "leave-policy-emea.docx",
                  quote: "Eligible employees receive 16 weeks of parental leave at 100% of base salary.",
                },
              ],
            },
          ]}
        />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Source cards: what retrieval found</p>
        <SourceCards
          sources={[
            { id: "s1", title: "leave-policy-emea.docx", relevance: "high", used: true },
            { id: "s2", title: "benefits-faq.md", relevance: "medium" },
          ]}
        />
      </section>
    </div>
  ),
};
