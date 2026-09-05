import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eraser, FileText, Languages, Maximize2, Mic, RefreshCw, Sparkles, Trash2, Wand2 } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { AiToolsMenu, type AiToolGroup } from "@/registry/super-ai/ai-tools-menu";
import { SkillMenu, type SkillMenuItem } from "@/registry/super-ai/skill-menu";
import { SkillMenuDocs } from "@/content/components/skill-menu.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof SkillMenu> = {
  title: "Super AI/Skill Menu",
  component: SkillMenu,
  parameters: { layout: "centered", docs: { page: componentDocsPage(SkillMenuDocs) } },
};

export default meta;
type Story = StoryObj<typeof SkillMenu>;

const SKILLS: SkillMenuItem[] = [
  {
    id: "summarize",
    title: "Summarize",
    description: "Condense a long document into key points",
    icon: <FileText aria-hidden />,
    preview: (
      <div className="space-y-1 text-sm">
        <p className="font-medium">Preview</p>
        <p className="text-muted-foreground">
          "The Q3 report shows revenue up 12%, driven mainly by the new APAC region..."
        </p>
      </div>
    ),
  },
  {
    id: "translate",
    title: "Translate",
    description: "Convert text between languages while preserving tone",
    icon: <Languages aria-hidden />,
    cost: 1,
    preview: (
      <div className="space-y-1 text-sm">
        <p className="font-medium">Preview</p>
        <p className="text-muted-foreground">"El informe del tercer trimestre muestra un aumento del 12%..."</p>
      </div>
    ),
  },
  {
    id: "voiceover",
    title: "Generate voiceover",
    description: "Turn a script into narration with a natural-sounding voice",
    icon: <Mic aria-hidden />,
    cost: 4,
    preview: <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm">Preview: waveform</div>,
  },
  {
    id: "remove-bg",
    title: "Remove background",
    description: "Cut a subject out onto a transparent background",
    icon: <Wand2 aria-hidden />,
    preview: <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm">Preview: cutout result</div>,
  },
];

/**
 * The menu with search, a preview pane and both authoring verbs, wired the way
 * a host wires it: `skills` as plain data, `onSelectSkill` to apply the pick.
 *
 * The play function pins the half of the spec's search rule this component
 * actually honours — "skills are discovered by what they do". Typing a word
 * that appears only in a description narrows the list to that one skill, and
 * the preview follows the survivor without a click.
 *
 * **The other half is missing, and is recorded rather than asserted.** The
 * spec says "search filters titles AND descriptions"; `CommandItem` is handed
 * `value={skill.id}` with the description as its only `keywords`, and cmdk
 * scores against those two, so the visible title is not in the search corpus
 * at all. A skill whose `id` does not contain the words a user would type is
 * unfindable by its own name. Fixing it means changing what the component
 * feeds cmdk, which is a behavioural change rather than one of the mechanical
 * repairs a story wave may land, so this story stops short of asserting the
 * miss — an assertion that a title filters its row *out* would pin the bug.
 * The docs module's screen-reader section already carries the same finding.
 */
export const Search: Story = {
  args: { skills: SKILLS, searchPlaceholder: "Search skills..." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox");

    await expect(canvas.getAllByRole("option")).toHaveLength(4);

    // "transparent" appears in exactly one description and in no id.
    await userEvent.type(input, "transparent");
    await waitFor(async () => {
      const options = canvas.getAllByRole("option");
      await expect(options).toHaveLength(1);
      await expect(options[0]).toHaveTextContent("Remove background");
    });

    // The survivor becomes active on its own — cmdk re-selects the first
    // visible item — so the preview pane is already showing what this skill
    // produces before anything has been clicked.
    const preview = canvasElement.querySelector<HTMLElement>('[data-slot="skill-menu-preview"]')!;
    await expect(preview).toHaveTextContent("Preview: cutout result");

    // Filtering to nothing is a rendered message and nothing else: cmdk's
    // Empty carries role="presentation", so it is not a status and not a live
    // region. A screen-reader user hears the listbox go from four options to
    // none and is told nothing about why.
    await userEvent.clear(input);
    await userEvent.type(input, "zzzz");
    await waitFor(async () => {
      await expect(canvas.queryAllByRole("option")).toHaveLength(0);
      await expect(canvas.getByText("No skills found.")).toBeInTheDocument();
    });

    // Left filtered, the list is empty and the preview holds the last active
    // skill — restore the story to the state its name describes.
    await userEvent.clear(input);
    await waitFor(async () => expect(canvas.getAllByRole("option")).toHaveLength(4));
  },
};

/**
 * The differentiator, in the spec's own words: "a skill you cannot see the
 * output of is a name, not a choice." Pointing at a row swaps the right-hand
 * pane to that skill's output.
 *
 * The name of this state is the one thing about it that is misleading, and
 * worth reading past: the preview is not hover-driven. cmdk holds a single
 * "active value" that mouse hover and arrow keys both write to, and the
 * preview renders from that value, so a keyboard user browsing the list sees
 * exactly what a mouse user sees. `KeyboardOrder` below proves it rather than
 * claiming it.
 */
export const HoverPreview: Story = {
  args: { skills: SKILLS },
};

/**
 * The footer, which is always present and always two verbs: author the skill
 * yourself, or hand the job to the agent. It is the only part of the surface
 * that survives an empty `skills` array, and the reason the menu is never a
 * dead end for someone whose skill does not exist yet.
 *
 * Both buttons are vendored ghost `Button`s, so they are the only two stops in
 * this component that paint a focus ring — see `KeyboardOrder` for the one
 * that does not.
 */
export const NewSkillFooter: Story = {
  args: {
    skills: SKILLS,
    createLabel: "Create your own",
    generateLabel: "Have the agent build it",
    onCreateSkill: () => {},
    onGenerateSkill: () => {},
  },
};

/* -------------------------------------------------------------------------
 * Case stories — the situations this component meets in a product, as
 * opposed to the prop combinations above. See
 * docs/design-system/story-conventions.md for which of the eight apply.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — nothing here moves; there is no animate-* in the tree and no transition the component owns
 * `Command` is composed inline rather than through `CommandDialog`, so none
 * of the Base UI popup animation this repo has had to fight
 * (`data-open:animate-in` and the restated `motion-reduce:` pair that
 * `shortcuts-sheet` measured) is in play here — there is no popup. Nothing in
 * `skill-menu.tsx`, `CommandItem`, `CommandList` or `entity-row` as composed
 * here carries an `animate-*` or a `transition-*`: the rows are rendered
 * without `onSelect`, which is exactly the branch of `entity-row` that has no
 * `transition-colors`, and the active row is marked by a ring that appears
 * and disappears instantly.
 *
 * The one timed change anywhere in the subtree belongs to the two vendored
 * footer `Button`s, whose base class carries `transition-all` for a hover
 * colour crossfade and a 1px `active:translate-y-px` press. That is the
 * `reset-affordance` case with a press added: a colour fade moves no pixel,
 * and the press is a vendored primitive's uniform behaviour that every button
 * in the registry shares and none has ever suppressed. `motion-reduce:` is
 * sanctioned beside a transition a user perceives as motion — a thumb that
 * slides, a panel that grows (`pricing-table`) — and adding it to this
 * component's footer would document nothing about this component while
 * inventing a house rule for `Button` from the wrong place. Because
 * `vitest.config.ts` already runs every story under
 * `prefers-reduced-motion: reduce`, a story here would render pixel-identical
 * to `Search` and imply a branch that does not exist.
 *
 * // case-skip: Controlled — the active value is deliberately not exposed; `value`/`onValueChange` are omitted from the props type
 * `SkillMenuProps` extends the cmdk root's props with
 * `Omit<…, "children" | "value" | "onValueChange" | "label">`, so the one
 * controlled pair in the tree is removed from the public surface by the type
 * itself — a caller cannot pass it. The active (previewed) skill is internal
 * state, and the component deliberately *derives* it during render rather
 * than syncing it, so a parent could not hold it even by re-keying the
 * component. `onSelectSkill` fires with the whole `SkillMenuItem` a caller
 * needs to apply the pick, and carries no held value back: this is a picker
 * that reports a choice, not an input that owns one. With no value for a
 * parent to hold, the convention's three assertions — interaction alone does
 * not move the rendered value, the callback carries the payload, an unchanged
 * `value` holds the component fixed — have no subject.
 * ---------------------------------------------------------------------- */

/**
 * Right-to-left, where a two-pane surface has one thing to get right above all
 * others: the seam. The list is the leading pane and the preview the trailing
 * one, so under `dir="rtl"` the list moves to the right of the frame and its
 * border has to move with it.
 *
 * One physical property was swapped to a logical one for this story, and it is
 * byte-identical in LTR: the list pane's `border-r` → `border-e`
 * (CONTINUE.md §8, "Logical properties"; `modality-rail` made the same swap
 * for the same reason). Without it the panes mirror and the rule stays pinned
 * to the visual left, drawing a line down the outside of the preview and
 * leaving the two panes touching where they meet.
 *
 * Mirrored by the parts, not by this file: `entity-row` already ships
 * `text-start`, so every title and description flips with the row, and the
 * icon leads on the right. `cost-chip` pins its amount with `dir="ltr"`, so
 * "1 credits" keeps its number before its unit rather than reading as
 * "credits 1" — a number and its unit are a Latin-ordered run even in an RTL
 * paragraph.
 *
 * **What this wrapper cannot reach.** The search field's magnifier sits in an
 * `InputGroupAddon`, which is ordered by `order-first` — direction-aware, so
 * the icon does move to the leading edge — but gutters itself with a physical
 * `pl-2` that `CommandInput` restates as `pl-2!`, and the field pads its own
 * input with `pl-1.5` from the same physical axis. Mirrored, the icon lands
 * against the field's right border with its gap on the inside. Both classes
 * live in vendored primitives (`command.tsx`, `input-group.tsx`) that this
 * component does not own and a story wave may not edit, so it is recorded
 * here rather than swept.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <SkillMenu {...args} />
    </div>
  ),
  args: { skills: SKILLS, onCreateSkill: () => {}, onGenerateSkill: () => {} },
};

/**
 * The keyboard model of a command list, which is not the keyboard model of a
 * menu: **the list is not in the tab sequence and never takes focus.** Three
 * stops exist — the search field and the two footer buttons — and browsing
 * happens from inside the field, with cmdk moving an active-descendant
 * pointer over the options. That is why counting tab stops through the rows
 * would prove nothing here; the play function asserts the list's own model
 * instead.
 *
 * What it pins: rows contribute zero tabbable elements (the reason
 * `entity-row` is composed without `onSelect` — a `<button>` inside a
 * `role="option"` would be a doubled stop and an axe `nested-interactive`
 * failure); Arrow Down and Arrow Up move `aria-activedescendant` and
 * `aria-selected` while focus stays in the field; Home and End jump to the
 * ends; and the preview pane follows the pointer, so arrowing reaches the
 * same state hovering does. The last is the load-bearing one — it is the
 * assertion that the docs page's first "don't" (a preview gated behind
 * `:hover`) has not quietly become true.
 *
 * **The second defect, found by writing the assertions above.**
 * `aria-activedescendant` is empty until the first arrow key, so on arrival a
 * screen-reader user is told the field controls a listbox and never told
 * which option is current — while the preview pane is already rendering that
 * option's output. It is a consequence of this component controlling cmdk's
 * `value`: cmdk sets `selectedItemId` only inside its own `setState("value")`,
 * and its select-the-first-item fallback runs only when the store's value is
 * empty, which a controlled `value` never is. The first Down repairs it, and
 * the assertion below is taken *after* that move for exactly that reason —
 * pinning the empty initial state would lock the bug in. Recorded, not fixed:
 * the repair is a change to how the component drives cmdk.
 *
 * **The defect this story found first, recorded and not pinned.** The first
 * and most important stop paints no focus ring. `InputGroup` keys its ring off
 * `has-[[data-slot=input-group-control]:focus-visible]`, and cmdk's input sets
 * `data-slot="command-input"` instead, so the selector never matches and the
 * field's own `outline-hidden` leaves nothing behind it. The two footer
 * buttons are asserted to paint rings below; the field is deliberately not
 * asserted either way, because pinning "no ring" would lock the bug in and
 * pinning "a ring" would fail. The fix belongs in the vendored `command.tsx`
 * or in a `data-slot` override here, both of which are behavioural changes
 * outside a story wave's remit. Already recorded in the docs module's focus
 * notes.
 */
export const KeyboardOrder: Story = {
  args: { skills: SKILLS, onCreateSkill: () => {}, onGenerateSkill: () => {} },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("combobox");
    const list = canvas.getByRole("listbox");
    const preview = canvasElement.querySelector<HTMLElement>('[data-slot="skill-menu-preview"]')!;

    // The rows hold nothing focusable. This is the contract behind composing
    // entity-row without onSelect, and it is invisible in a screenshot.
    await expect(
      list.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])'),
    ).toHaveLength(0);

    // Three stops in the whole component, in DOM order: the field, then the
    // two footer verbs.
    const stops = Array.from(
      canvasElement.querySelectorAll<HTMLElement>("input, button, a[href], [tabindex]"),
    ).filter((el) => el.tabIndex >= 0);
    await expect(stops).toHaveLength(3);
    await expect(stops[0]).toBe(input);

    const activeOption = () => list.querySelector<HTMLElement>('[role="option"][aria-selected="true"]');

    input.focus();
    await waitFor(async () => expect(activeOption()).toHaveTextContent("Summarize"));

    // Arrow Down moves the pointer and leaves focus where it was — the whole
    // point of an aria-activedescendant list.
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(async () => expect(activeOption()).toHaveTextContent("Translate"));
    await expect(document.activeElement).toBe(input);
    await expect(input).toHaveAttribute("aria-activedescendant", activeOption()!.id);

    // …and the preview follows it. Hover is not the only way in.
    await expect(preview).toHaveTextContent("El informe del tercer trimestre");

    await userEvent.keyboard("{ArrowUp}");
    await waitFor(async () => expect(activeOption()).toHaveTextContent("Summarize"));

    await userEvent.keyboard("{End}");
    await waitFor(async () => expect(activeOption()).toHaveTextContent("Remove background"));
    await userEvent.keyboard("{Home}");
    await waitFor(async () => expect(activeOption()).toHaveTextContent("Summarize"));
    await expect(document.activeElement).toBe(input);

    // Tabbing off the field skips the list entirely and lands on the footer.
    // Both stops there are real buttons, and both paint a ring — asserted
    // because they are the only two stops in this component that do.
    for (const label of ["Create your own", "Have the agent build it"]) {
      await userEvent.tab();
      const focused = document.activeElement as HTMLElement;
      await expect(focused).toBe(canvas.getByRole("button", { name: label }));
      await expect(focused.matches(":focus-visible")).toBe(true);
      const style = getComputedStyle(focused);
      await expect(style.boxShadow !== "none" || style.outlineStyle !== "none").toBe(true);
    }
  },
};

/**
 * Skills stripped to the one field that is required. No description, no icon,
 * no cost chip, and no preview — which is a real shape, because a
 * freshly-authored skill has a name before it has anything else.
 *
 * Two things are visible here and nowhere else. `entity-row`'s `min-h-14`
 * holds a description-less row to the same height as a described one, so a
 * menu of mixed rows is never ragged — at the cost of a list that is mostly
 * whitespace when every row is bare. And the preview pane falls back to
 * `previewEmptyMessage` rather than going blank, so the right-hand half of
 * the component still says what it is for.
 *
 * **The finding, which is about search rather than layout.** `description` is
 * the only thing this component passes to cmdk as `keywords`, so dropping it
 * leaves a row whose entire search corpus is its `id`. Combined with the gap
 * recorded on `Search` — the visible title is not in the corpus either — a
 * title-only skill is findable by nothing the user can see. The two omissions
 * are individually defensible and compound into a row that search cannot
 * reach. Not asserted here, because the assertion would pin the behaviour.
 */
export const EmptyLabel: Story = {
  args: {
    skills: [
      { id: "summarize", title: "Summarize" },
      { id: "translate", title: "Translate" },
      { id: "voiceover", title: "Generate voiceover" },
      { id: "remove-bg", title: "Remove background" },
    ],
    onCreateSkill: () => {},
    onGenerateSkill: () => {},
  },
};

/**
 * A ~90-character skill name and a ~90-character description in a pane fixed at
 * `w-72` — 288px, minus the icon, the gap and the cost chip.
 *
 * The answer the component actually gives is truncation, twice over:
 * `entity-row` puts `truncate` on both its title and its description spans,
 * so each collapses to a single ellipsed line and the row keeps its height
 * and its rhythm. Nothing wraps and nothing scrolls sideways. The cost chip
 * is `shrink-0`, so the price never truncates — the row gives up name before
 * it gives up price, which is the right trade for a surface where the number
 * is the thing being compared.
 *
 * The cost of that answer is what this story is for: at this width the two
 * long rows are indistinguishable from each other after the first few words,
 * and the preview pane is the only place the difference is legible. It is an
 * argument for the preview, not a defect — but a host with genuinely long
 * skill names needs to know the list will not carry them.
 */
export const LongContent: Story = {
  args: {
    skills: [
      {
        id: "meeting-digest",
        title:
          "Summarize a long research thread and list every open decision that still needs an owner",
        description:
          "Condenses a multi-hour transcript into decisions, owners, and the questions nobody answered",
        icon: <FileText aria-hidden />,
        cost: 12,
        preview: (
          <div className="space-y-1 text-sm">
            <p className="font-medium">Preview</p>
            <p className="text-muted-foreground">
              "Three decisions, two owners named. Open: who signs off on the APAC pricing change?"
            </p>
          </div>
        ),
      },
      {
        id: "voiceover",
        title: "Generate a natural-sounding voiceover from a script and match it to the cut",
        description: "Turns a script into narration and lines the takes up against an existing edit",
        icon: <Mic aria-hidden />,
        cost: 4,
        preview: <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm">Preview: waveform</div>,
      },
      ...SKILLS.slice(0, 2),
    ],
    onCreateSkill: () => {},
    onGenerateSkill: () => {},
  },
};

/**
 * 375px, and the finding is that the two panes do not become one. The frame is
 * `flex-row` with no responsive branch: the list keeps its `w-72 shrink-0`
 * 288px and the preview takes what is left, which at this width is about 87px
 * before its own padding. There is no horizontal scroll — `min-w-0` lets the
 * preview compress rather than push — so nothing looks broken, and the
 * component's whole reason for existing has been squeezed into a column too
 * narrow to read.
 *
 * The play function pins both halves: the frame does not overflow, and the
 * preview is narrower than the list it is meant to explain. The second
 * assertion is the one that would catch a fix — a stacked or
 * preview-on-demand layout at this width would invert it.
 *
 * Recorded rather than fixed: a responsive branch is a design decision about
 * what a two-pane picker becomes on a phone (stack, drawer, or preview on
 * select), not a mechanical repair a story wave may land.
 */
export const Mobile: Story = {
  args: { skills: SKILLS, onCreateSkill: () => {}, onGenerateSkill: () => {} },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <SkillMenu {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="skill-menu"]')!;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);

    const preview = canvasElement.querySelector<HTMLElement>('[data-slot="skill-menu-preview"]')!;
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="command-list"]')!;
    await expect(preview.getBoundingClientRect().width).toBeLessThan(
      list.getBoundingClientRect().width,
    );
  },
};

/**
 * D6 beside I4 `ai-tools-menu`, its nearest twin in the catalog. They are
 * built from the same parts — A9 `entity-row` rows with A2 `cost-chip` in the
 * trailing slot — and a screenshot of either could be mistaken for the other.
 *
 * The choosing rule is what the surface is scoped to:
 *
 * - **Skill menu** is scoped to the *library*. It is opened from a composer,
 *   the skills in it exist independently of anything on screen, and there are
 *   enough of them that search and a preview earn their space. Its footer
 *   exists because the answer to "my skill isn't here" is to author one.
 * - **AI tools menu** is scoped to the *selection*. "The selection is the
 *   prompt context" — the rows are derived from what is highlighted, the
 *   surface names that object, and it is short enough to be grouped by intent
 *   with the expensive and irreversible options below a rule. No search, no
 *   preview, no authoring.
 *
 * If the row set changes when the user clicks something else, it is I4. If a
 * search field would help, it is D6 — a menu you need to search is a menu too
 * long to be scoped to one object.
 */
export const Boundary: Story = {
  render: () => {
    const groups: AiToolGroup[] = [
      {
        id: "edit",
        label: "Edit this image",
        actions: [
          {
            id: "remove-bg",
            title: "Remove background",
            description: "Cut the subject out",
            icon: <Eraser aria-hidden className="size-4" />,
          },
          {
            id: "expand",
            title: "Magic expand",
            description: "Paint beyond the frame",
            icon: <Maximize2 aria-hidden className="size-4" />,
            cost: { amount: 17 },
          },
        ],
      },
      {
        id: "generate",
        label: "Generate from it",
        actions: [
          {
            id: "variations",
            title: "Variations",
            description: "Four more like this",
            icon: <Sparkles aria-hidden className="size-4" />,
            cost: { amount: 55 },
          },
        ],
      },
      {
        id: "careful",
        label: "Costly or irreversible",
        destructive: true,
        actions: [
          {
            id: "regenerate",
            title: "Regenerate from scratch",
            description: "Discards every edit on this layer",
            icon: <RefreshCw aria-hidden className="size-4" />,
            cost: { amount: 2400 },
          },
          {
            id: "clear",
            title: "Clear the layer",
            description: "Cannot be undone",
            icon: <Trash2 aria-hidden className="size-4" />,
          },
        ],
      },
    ];

    return (
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <section className="flex flex-col gap-2">
          <p className="text-foreground text-xs font-medium">
            D6 skill menu — scoped to the library, searchable, previewed
          </p>
          <SkillMenu skills={SKILLS} onCreateSkill={() => {}} onGenerateSkill={() => {}} />
        </section>

        <section className="flex flex-col gap-2">
          <p className="text-foreground text-xs font-medium">
            I4 AI tools menu — scoped to the selection, grouped by intent
          </p>
          <div className="w-72 rounded-xl border p-1">
            <AiToolsMenu
              presentation="inline"
              groups={groups}
              selection={{
                label: "Hero shot, layer 3",
                type: "Image",
                icon: <FileText aria-hidden className="size-4" />,
              }}
              onAction={() => {}}
            />
          </div>
        </section>
      </div>
    );
  },
};
