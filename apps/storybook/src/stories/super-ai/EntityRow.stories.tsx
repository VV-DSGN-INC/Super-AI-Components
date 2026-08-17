import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bot, ChevronRight, FileText, Languages, Plug, Sparkles } from "lucide-react";
import * as React from "react";
import { expect, userEvent, within } from "storybook/test";

import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { FieldRow, UnitInput } from "@/registry/super-ai/field-row";
import { StatReadout } from "@/registry/super-ai/stat-readout";
import { EntityRowDocs } from "@/content/components/entity-row.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof EntityRow> = {
  title: "Super AI/Entity Row",
  component: EntityRow,
  parameters: { layout: "centered", docs: { page: componentDocsPage(EntityRowDocs) } },
};

export default meta;
type Story = StoryObj<typeof EntityRow>;

/**
 * The row is `w-full`, so every story has to say how wide "full" is. `max-w-sm`
 * is the menu width the demo already uses — a test condition, not a new design
 * value.
 */
function Menu({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-sm">{children}</div>;
}

/** A non-interactive row: no `onSelect`, so it renders as a plain container. */
export const Plain: Story = {
  render: (args) => (
    <Menu>
      <EntityRow {...args} />
    </Menu>
  ),
  args: {
    icon: <FileText aria-hidden className="size-4" />,
    title: "quarterly-review.pdf",
    description: "Attached to this thread",
  },
};

/**
 * `onSelect` turns the row into a `<button aria-pressed>`, and `selected`
 * paints it `bg-accent`.
 *
 * The trailing price is here on purpose. Muted text on the accent surface
 * measures 4.34:1 in this token set, and the caller — not the component —
 * is what puts `text-muted-foreground` inside the trailing slot. The row
 * answers that by rebinding `--muted-foreground` for its whole subtree
 * rather than restyling the two slots it owns, which is the only fix that
 * reaches markup it did not write. This story is what puts that under axe.
 */
export const Selectable: Story = {
  render: (args) => (
    <Menu>
      <EntityRow {...args} />
    </Menu>
  ),
  args: {
    icon: <Sparkles aria-hidden className="size-4" />,
    title: "Summarize",
    description: "Condense a long document",
    trailing: <span className="text-muted-foreground text-xs">4 credits</span>,
    selected: true,
    onSelect: () => {},
  },
};

/** A badge in the trailing slot — the row grid does not change to make room. */
export const WithBadge: Story = {
  render: (args) => (
    <Menu>
      <EntityRow {...args} />
    </Menu>
  ),
  args: {
    icon: <Bot aria-hidden className="size-4" />,
    title: "Fine-tune a model",
    description: "Train on your own examples",
    trailing: <Badge variant="secondary">Pro</Badge>,
  },
};

/**
 * A chevron in the trailing slot, on a row that opens a detail pane.
 *
 * Worth recording rather than only rendering: this row carries no
 * `aria-pressed` at all, and that is the point. Separating "the row acts" from
 * "the row navigates" used to be deferred here as an API change to a primitive
 * seventeen components compose. It has since been made: `selected` has no
 * default, so passing it — `true` or `false` — is what opts a row into toggle
 * semantics, and a navigation row like this one announces as a plain button.
 *
 * The story stays because the absence is the assertion. A regression that
 * restored the old default would be invisible in a screenshot and would show
 * up here.
 */
export const WithChevron: Story = {
  render: (args) => (
    <Menu>
      <EntityRow {...args} />
    </Menu>
  ),
  args: {
    icon: <Languages aria-hidden className="size-4" />,
    title: "Translate",
    description: "Convert between languages",
    trailing: <ChevronRight aria-hidden className="text-muted-foreground size-4" />,
    onSelect: () => {},
  },
  play: async ({ canvasElement }) => {
    // The assertion is an absence, which is why it needs writing down: a row
    // that navigates must not report a pressed state, and reinstating the old
    // `selected = false` default would silently bring one back.
    const row = within(canvasElement).getByRole("button", { name: /Translate/ });
    await expect(row.hasAttribute("aria-pressed")).toBe(false);
  },
};

/**
 * A switch in the trailing slot — and deliberately no `onSelect`.
 *
 * The switch is the control here, so the row must not also be one: a
 * `<button>` wrapping a `<button>` is invalid, doubles the tab stops and
 * trips axe's nested-interactive rule. `member-gate-row` and `env-status`
 * both compose A9 this way, and `action-stack` passes `onSelect`
 * conditionally for exactly this reason.
 *
 * The `aria-labelledby` is the second half of the pattern. The row gives the
 * trailing slot no accessible name, so the caller puts an id on the element
 * it passes as `title` and points the control at it — otherwise the switch
 * ships anonymous.
 */
export const WithSwitch: Story = {
  render: (args) => (
    <Menu>
      <EntityRow {...args} />
    </Menu>
  ),
  args: {
    icon: <Plug aria-hidden className="size-4" />,
    title: <span id="entity-row-with-switch-title">Slack</span>,
    description: "Post run summaries to a channel",
    trailing: <Switch aria-labelledby="entity-row-with-switch-title" defaultChecked />,
  },
};

/**
 * `disabled` has two renderings, and both are here because only one of them
 * is a real disabled control.
 *
 * With `onSelect`, the row is a `<button disabled>` — removed from the tab
 * order by the platform. Without it, there is no element that can carry the
 * attribute, so the row falls back to `aria-disabled`. That fallback is the
 * load-bearing part: before it, the 50% opacity was the whole signal, which
 * is invisible to assistive tech and reads to axe as ordinary low-contrast
 * text.
 */
export const Disabled: Story = {
  render: () => (
    <Menu>
      <EntityRow
        icon={<Bot aria-hidden className="size-4" />}
        title="Fine-tune a model"
        description="Requires a Pro plan"
        disabled
        onSelect={() => {}}
      />
      <EntityRow
        icon={<Sparkles aria-hidden className="size-4" />}
        title="Realtime voice"
        description="Not available in this workspace"
        disabled
      />
    </Menu>
  ),
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — one colour transition, no motion to suppress
 * The only timed rule in the file is `transition-colors` on the interactive
 * row's hover. There is no `animate-*`, no transform and no keyframe
 * anywhere in the component, so the media feature has nothing to act on and
 * the row branches on it nowhere. vitest.config.ts already runs every story
 * under Playwright's `reducedMotion: "reduce"`, so a story here would render
 * pixel-identically to `Selectable` and imply coverage it does not have.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, with the two direction-sensitive slots filled: a leading
 * icon and a trailing chevron.
 *
 * What mirrors correctly: the flex row reverses, so the icon lands on the
 * right and the chevron on the left, and the text block goes with it — the
 * row aligns with `text-start`, so the title and description sit against the
 * icon in both directions rather than staying pinned to the visual left.
 *
 * That alignment used to be `text-left`, and this story is where the gap was
 * recorded. It was declined at the time on a premise that has since expired —
 * "no component in this registry uses logical properties" — which was already
 * false when written: A5 `field-row` landed `text-end` and `pe-2` in the same
 * wave. The swap class is now sanctioned outright (CONTINUE.md §8, "Logical
 * properties"): physical→logical of this kind compiles to the same
 * declaration in LTR, so there is no risk to weigh against the RTL
 * correctness. Applied here rather than carried, because `entity-row` is
 * composed by seventeen other components and every one of them inherits it.
 *
 * What still does not mirror is caller markup: the chevron's own glyph is
 * flipped by the story below, not by the row, because `trailing` is whatever
 * the caller passes.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Menu>
        <EntityRow {...args} />
      </Menu>
    </div>
  ),
  args: {
    icon: <Languages aria-hidden className="size-4" />,
    title: "Translate",
    description: "Convert between languages",
    trailing: <ChevronRight aria-hidden className="rotate-180 text-muted-foreground size-4" />,
    onSelect: () => {},
  },
};

/**
 * How many tab stops does one row get? Exactly one — and which element owns
 * it is decided by whether `onSelect` was passed.
 *
 * Both shapes are rendered together because the answer only makes sense as a
 * pair. The first row is selectable, so the row *is* the control: one stop,
 * with nothing focusable inside it. The second row has a switch in its
 * trailing slot and no `onSelect`, so it renders as a plain container that
 * takes no focus at all and the switch is the only stop. Two rows, two
 * stops.
 *
 * The failure this pins is the third shape, which the component does not
 * prevent: `onSelect` *plus* an interactive trailing control nests a button
 * inside a button. That is one row with two stops, invalid HTML, and an axe
 * nested-interactive violation. `action-stack` already guards against it by
 * passing `onSelect` conditionally, and `member-gate-row` by omitting it
 * from its props entirely. There is no assertion here that the component
 * refuses it, because it does not — the gap is recorded in the docs page's
 * first don't and in the retrofit report.
 *
 * The loop is bounded by the expected stop count rather than run until focus
 * leaves the canvas: pinning the number fails when a stop is added as well
 * as when one is lost.
 */
export const KeyboardOrder: Story = {
  render: () => (
    <Menu>
      <EntityRow
        icon={<Sparkles aria-hidden className="size-4" />}
        title="Summarize"
        description="Condense a long document"
        trailing={<ChevronRight aria-hidden className="text-muted-foreground size-4" />}
        onSelect={() => {}}
      />
      <EntityRow
        icon={<Plug aria-hidden className="size-4" />}
        title={<span id="entity-row-keyboard-title">Slack</span>}
        description="Post run summaries to a channel"
        trailing={<Switch aria-labelledby="entity-row-keyboard-title" defaultChecked />}
      />
    </Menu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const rowButton = canvas.getByRole("button", { name: /Summarize/ });
    const toggle = canvas.getByRole("switch", { name: "Slack" });

    // The selectable row is the control — its chevron is markup, not a widget.
    await expect(rowButton.querySelectorAll("button, a[href], input, [tabindex]")).toHaveLength(0);

    // The switch row is a container: no `onSelect`, so no button, and the
    // element itself never enters the tab order.
    const rows = canvasElement.querySelectorAll('[data-slot="entity-row"]');
    await expect(rows).toHaveLength(2);
    await expect(rows[1].tagName).toBe("DIV");
    await expect(rows[1].hasAttribute("tabindex")).toBe(false);

    const stops = [rowButton, toggle];
    await expect(canvasElement.querySelectorAll("button, a[href], input")).toHaveLength(stops.length);

    for (const expected of stops) {
      await userEvent.tab();
      await expect(document.activeElement).toBe(expected);

      // Every stop is visibly focused, not merely focusable.
      const focused = document.activeElement as HTMLElement;
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }
  },
};

/** Harness for `Controlled`: the list owns the selection, as it does in a product. */
function SkillPicker() {
  const [applied, setApplied] = React.useState("summarize");
  const [pending, setPending] = React.useState<string | null>(null);

  const skills = [
    { id: "summarize", title: "Summarize", description: "Condense a long document" },
    { id: "translate", title: "Translate", description: "Convert between languages" },
  ];

  return (
    <div className="flex w-full max-w-sm flex-col items-start gap-2">
      {skills.map((skill) => (
        <EntityRow
          key={skill.id}
          data-skill-id={skill.id}
          title={skill.title}
          description={skill.description}
          selected={applied === skill.id}
          // Deliberately does not move `applied` — a pick is a request here,
          // the way it is when the row's owner has to confirm or persist it.
          onSelect={() => setPending(skill.id)}
        />
      ))}
      <p className="text-foreground text-xs">Pending: {pending ?? "none"}</p>
      <button
        type="button"
        onClick={() => pending && setApplied(pending)}
        className="focus-visible:ring-ring rounded-md border px-2 py-0.5 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        Apply pending skill
      </button>
    </div>
  );
}

/**
 * The selection belongs to the list, and the row never moves it.
 *
 * Clicking Translate fires `onSelect` and leaves `aria-pressed` exactly where
 * it was; the row changes only when the owner re-renders it with a new
 * `selected`. For a primitive that seventeen components compose, that is the
 * whole contract — a row holding its own selected state would put the
 * selection in two places at once and every one of those lists would have to
 * fight it.
 *
 * One clause of the convention's `Controlled` shape is not satisfiable, and
 * is worth naming rather than faking: `onSelect` is a bare `() => void`, so
 * no payload arrives with the callback. There is nothing for a consumer to
 * apply — the caller already knows which row it wired the handler to. The
 * assertions below cover the two clauses that are real and do not invent a
 * third.
 */
export const Controlled: Story = {
  render: () => <SkillPicker />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const summarize = canvasElement.querySelector('[data-skill-id="summarize"]')!;
    const translate = canvasElement.querySelector('[data-skill-id="translate"]')!;

    await expect(summarize).toHaveAttribute("aria-pressed", "true");
    await expect(translate).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(canvas.getByRole("button", { name: /Translate/ }));

    // The callback fired…
    await expect(canvas.getByText("Pending: translate")).toBeInTheDocument();
    // …and nothing moved, because the row does not own the value.
    await expect(summarize).toHaveAttribute("aria-pressed", "true");
    await expect(translate).toHaveAttribute("aria-pressed", "false");

    // Only the owner can move it.
    await userEvent.click(canvas.getByRole("button", { name: "Apply pending skill" }));
    await expect(summarize).toHaveAttribute("aria-pressed", "false");
    await expect(translate).toHaveAttribute("aria-pressed", "true");
  },
};

/**
 * `description` is the optional text slot, and emptying it is not an edge
 * case — a real menu mixes rows that have one with rows that do not, and the
 * demo, `skill-menu` and `action-stack` all do.
 *
 * The spec's rule is that the row keeps its height anyway, via `min-h-14`, so
 * a mixed list reads as an even rhythm instead of a ragged one. The unit test
 * pins that the two rows carry identical classes; only a rendered story can
 * pin that they are actually the same height, which is what the play function
 * measures.
 *
 * Note what is *not* here: an icon-only row. `title` is required and is the
 * row's entire accessible name, so there is no unlabelled-tap-target case to
 * render — the way to produce one is to pass an empty `title`, which would
 * ship an axe violation into a gate running at `test: "error"`.
 */
export const EmptyLabel: Story = {
  render: () => (
    <Menu>
      <EntityRow
        data-row="described"
        icon={<Sparkles aria-hidden className="size-4" />}
        title="Summarize"
        description="Condense a long document"
        onSelect={() => {}}
      />
      <EntityRow
        data-row="bare"
        icon={<Languages aria-hidden className="size-4" />}
        title="Extract fields"
        onSelect={() => {}}
      />
    </Menu>
  ),
  play: async ({ canvasElement }) => {
    const described = canvasElement.querySelector('[data-row="described"]')!;
    const bare = canvasElement.querySelector('[data-row="bare"]')!;

    await expect(bare.querySelector('[data-slot="entity-row-description"]')).toBeNull();
    await expect(described.getBoundingClientRect().height).toBe(bare.getBoundingClientRect().height);
  },
};

/**
 * A 90-character title, which is what a row gets when the entity it names is
 * a file or a user-written prompt rather than a verb.
 *
 * The row's answer is to truncate, not wrap: `entity-row-title` and
 * `entity-row-description` are both `truncate`, and the height stays fixed.
 * The trailing slot is `shrink-0`, so every bit of the pressure lands on the
 * title — a longer badge makes the title shorter, never the other way round.
 * That is the fact `task-tray`'s and `generation-queue`'s stories both point
 * back at, and this is where it is actually measured.
 */
export const LongContent: Story = {
  render: (args) => (
    <Menu>
      <EntityRow {...args} />
    </Menu>
  ),
  args: {
    icon: <FileText aria-hidden className="size-4" />,
    title: "Summarize the quarterly review and list every decision that still needs an owner",
    description: "quarterly-review-final-v3-with-comments.pdf",
    trailing: <Badge variant="secondary">Queued</Badge>,
    onSelect: () => {},
  },
  play: async ({ canvasElement }) => {
    const title = canvasElement.querySelector('[data-slot="entity-row-title"]') as HTMLElement;
    const row = canvasElement.querySelector('[data-slot="entity-row"]') as HTMLElement;

    // Clipped, not wrapped — and the row is still one row tall.
    await expect(title.scrollWidth).toBeGreaterThan(title.clientWidth);
    await expect(row.getBoundingClientRect().height).toBe(56);
  },
};

/**
 * 375px, in the arrangement A9 actually ships in: a stack of rows in a menu
 * or a settings pane, one of them carrying a control.
 *
 * At this width the row has no horizontal scroll and never gets one, because
 * the title column is `min-w-0 flex-1` and gives way while the icon and the
 * trailing slot hold their intrinsic size. The visible consequence is that
 * the second line disappears first: on a phone, a description is the part of
 * a row you should assume nobody reads in full.
 */
export const Mobile: Story = {
  render: () => (
    <div className="w-[375px] max-w-full">
      <EntityRow
        icon={<Plug aria-hidden className="size-4" />}
        title={<span id="entity-row-mobile-title">Slack</span>}
        description="Post run summaries to a channel"
        trailing={<Switch aria-labelledby="entity-row-mobile-title" defaultChecked />}
      />
      <EntityRow
        icon={<FileText aria-hidden className="size-4" />}
        title="quarterly-review-final-v3-with-comments.pdf"
        description="Attached to this thread"
        trailing={<Badge variant="secondary">Pro</Badge>}
      />
      <EntityRow
        icon={<Bot aria-hidden className="size-4" />}
        title="Fine-tune a model"
        description="Requires a Pro plan"
        disabled
      />
    </div>
  ),
};

/**
 * The three row-shaped primitives in family A, side by side. They are drawn
 * alike on purpose and they are not interchangeable; the choosing rule is
 * what the line is *about*.
 *
 * - **Entity row (A9)** names a thing that exists — a skill, a connector, a
 *   file, a provider. Acting on it picks the thing or toggles the thing.
 * - **Field row (A6)** names a setting and edits its value. The label is not
 *   a thing you can select; it is the name of a number you can change.
 * - **Stat readout (A10)** names a fact about a finished result. It is a
 *   `<dl>` — nothing here is actionable at all, and a missing value prints an
 *   em-dash rather than disappearing.
 *
 * The short test is the tense. If the line would still make sense with
 * nothing configured and nothing generated, it is an entity row. If it only
 * exists because you are configuring a run, it is a field row. If it only
 * exists because a run finished, it is a stat readout.
 *
 * The mistake this prevents is the common one: reaching for A9 with a switch
 * in the trailing slot to build a settings pane. A switch on an entity row
 * turns the *entity* on — the Slack connector, the gated feature. A switch
 * that sets a parameter of the thing you are about to run belongs in a field
 * row, where the label is not pretending to be a selectable object.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Entity row — names a thing</p>
        <EntityRow
          icon={<Plug aria-hidden className="size-4" />}
          title={<span id="entity-row-boundary-title">Slack</span>}
          description="Post run summaries to a channel"
          trailing={<Switch aria-labelledby="entity-row-boundary-title" defaultChecked />}
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Field row — names a setting</p>
        <FieldRow label="Temperature" hint="Higher values wander further from the prompt.">
          {(id, describedBy) => (
            <UnitInput id={id} aria-describedby={describedBy} unit="x" defaultValue={0.7} />
          )}
        </FieldRow>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Stat readout — names a fact</p>
        <StatReadout
          items={[
            { label: "Seed", value: "184203", copyable: true },
            { label: "Sampler", value: "Euler a" },
            { label: "Steps", value: "30" },
            { label: "Guidance" },
          ]}
        />
      </section>
    </div>
  ),
};
