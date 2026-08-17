import type { ComponentDocs } from "@/lib/component-docs";
import {
  CarefulWorkBelowTheRule,
  NoPrices,
  OneFlatList,
  SelectionNamed,
} from "./ai-tools-menu.examples";

/**
 * Seeded from docs/design-system/component-specs.md#i4-ai-tools-menu.
 *
 * No "use client" here: plain data read by a Server Component. Live examples
 * live in ./ai-tools-menu.examples and cross over as zero-prop elements.
 */
export const AiToolsMenuDocs: ComponentDocs = {
  whatItIs:
    "The AI actions that belong to a selected object — remove the background of this image, expand this frame, regenerate this layer — grouped by intent, with each row carrying the price of running it. It renders as a dropdown from a trigger (the AI entry on a context toolbar always opens this) or as an inline panel, and the row set is data you derive from what is selected.",
  whyItMatters:
    "Canva Magic, Fotor's AI tools, Spline AI and CapCut's AI effects all converge on the same move: AI stops being a chat window and attaches to objects. The selection is the prompt context, so the surface has to say what it is acting on — a menu that opens identically over three different layers is a menu you cannot trust. Grouping by intent keeps a five-second retouch and a four-thousand-credit regeneration from sitting adjacent, which is why the expensive and irreversible work goes below a rule rather than being sorted somewhere in the middle. And because each action spends, each row shows what it spends: the same failure F4 action-stack was built against, where four cheap-looking clicks are four charges. This is F4's shape reused deliberately — identical rows, identical prop names, identical locked behaviour — because a menu of what to do next to a result and a menu of what to do to a selected object are conceptually the same component wearing different context.",
  evidence: ["Canva Magic", "Fotor AI tools", "Spline AI", "CapCut AI effects"],
  anatomy: [
    { slot: "ai-tools-menu", note: "The root. Carries `data-presentation` for menu or inline." },
    {
      slot: "ai-tools-menu-selection",
      note: "What the actions will run against. Also the source of the surface's accessible name.",
    },
    {
      slot: "ai-tools-menu-trigger",
      note: "Menu mode only. Renders your own element rather than wrapping it.",
    },
    { slot: "ai-tools-menu-content", note: "The dropdown surface in menu mode." },
    {
      slot: "ai-tools-menu-group",
      note: "One intent. Carries `data-destructive` when it holds the expensive or irreversible work.",
    },
    {
      slot: "ai-tools-menu-group-label",
      note: "The group's visible heading; the group repeats it as its accessible label.",
    },
    { slot: "ai-tools-menu-rule", note: "The rule between groups, in inline mode." },
    {
      slot: "entity-row",
      note: "One action, rendered as A9 unchanged. Identified by `data-tool-action`, and marked `data-locked` or `data-destructive`.",
    },
    {
      slot: "cost-chip",
      note: "A2 in the row's trailing slot, with text from the shared cost formatter.",
    },
    {
      slot: "ai-tools-menu-locked",
      note: "The word Locked, so the padlock is never the only signal.",
    },
  ],
  usage:
    "Build `groups` from the selected object's type — an image gets Remove background and Magic expand, a text frame gets a different array — and pass the object itself as `selection` so the surface can name it. Group by intent and give each group a label; mark the group holding expensive or irreversible work `destructive` and it moves below every other group with a rule above it, whatever order you declared it in. Give every action that bills a `cost`; `per` renders the rate form (\"900 credits/min\"). Mark tier-gated actions `locked` rather than filtering them out: they stay visible with their price but cannot be chosen. Use `presentation=\"menu\"` with a `trigger` when it hangs off a context toolbar, and `\"inline\"` when it is a panel in its own right.",
  dos: [
    {
      text: "Name the object the actions will run against — the selection is the prompt context, not background information.",
      example: <SelectionNamed />,
    },
    {
      text: "Put the expensive and irreversible work in its own group below the rule, so a retouch and a full regeneration are never adjacent.",
      example: <CarefulWorkBelowTheRule />,
    },
  ],
  donts: [
    {
      text: "Don't ship one flat list — with no grouping and no selection named, a destructive row sits one mis-click below a harmless one.",
      example: <OneFlatList />,
    },
    {
      text: "Don't drop the prices; a 2,400-credit regeneration should not read like the free rows above it.",
      example: <NoPrices />,
    },
  ],
  accessibility: {
    keyboard: [
      "In menu mode the closed surface is one tab stop — the trigger. Enter, Space or Down opens it; Up and Down walk every row in every group, typing a letter jumps to one, Enter or Space runs it, Escape closes.",
      "The arrow walk crosses group boundaries without stopping. The rule and the group label are not focusable, so nothing on the keyboard marks the moment you cross from the safe group into the destructive one — position is a sighted signal here.",
      "A locked or disabled row stays in the walk, marked `aria-disabled` rather than removed, so the row you cannot run is still discoverable from the keyboard.",
      "In inline mode there is no arrow navigation at all: each actionable row is its own tab stop inside nested `role=\"group\"` wrappers. Four groups of three actions is twelve Tab presses with no way to skip a group.",
      "A locked or inline-disabled row is not a tab stop in inline mode — it renders as a `div`, not a button — so the keyboard passes straight over the gated capability the component exists to advertise.",
    ],
    screenReader: [
      "The surface is named from the selection: \"AI tools for Hero image\". In menu mode that means clearing Base UI's default `aria-labelledby`, which is what stops three menus on one canvas announcing the same trigger word.",
      "The visible selection header is `aria-hidden` on purpose — its words already reach assistive tech through that name, so it is not read twice. The consequence is that with no `selection` prop the surface announces the bare \"AI tools\" and nothing states what is selected.",
      "Group labels are `aria-hidden` too; each group carries the same words as its `aria-label`. A group given `actions` but no `label` is an unnamed group, which announces as an unlabelled boundary rather than as \"Careful work\".",
      "In inline mode every actionable row is a `<button>` with `aria-pressed=\"false\"` from the composed `entity-row`, so Remove background announces as an unpressed toggle rather than as a one-shot action.",
      "A row's name is its whole content read as one string — title, description, price, and the word Locked. The padlock and the coin glyph are both `aria-hidden`.",
      "`data-destructive` is a styling hook and reaches no assistive technology. A destructive row announces exactly like a safe one; the word in the group label is the only thing that says otherwise.",
      "Nothing announces that an action started, finished or spent anything. Put the live region on the canvas or the queue that receives the result.",
    ],
    focus: [
      "In menu mode, running an action closes the menu and returns focus to the trigger — usually the AI entry on a context toolbar, which is where the next selection is made.",
      "In inline mode a row that your handler removes takes focus with it, and nothing restores it: focus falls to `<body>` and the next Tab restarts from the top of the page.",
      "Interactive rows carry `entity-row`'s `focus-visible:ring-2`. The trigger does not — it is your element, so its focus style is yours to supply.",
    ],
  },
  pitfalls: [
    "Destructive is never signalled by colour here. `text-destructive` measures 4.0:1 on its own and worse over a translucent destructive tint, and the accessibility baseline forbids colour as a sole signal in any case — so the state is carried by position below the rule, by the group's label, by the row's icon and by `data-destructive`. If you restyle it, keep a non-colour signal.",
    "In menu mode the rows are deliberately not interactive themselves: the menu item is the control, and A9 rendering its own button inside one would nest two interactives and fail the accessibility gate. If you fork this component, keep that split.",
    "`locked` and `disabled` both make a row unactionable but mean different things — `locked` is a tier fact worth an upgrade prompt, `disabled` a temporary condition. Only `locked` gets the padlock and the word.",
    "The menu's accessible name comes from the selection, which means clearing Base UI's default `aria-labelledby` on the popup. Reinstate that and every instance on the canvas announces the same trigger word instead of the object it belongs to.",
    "The cost text is produced by `formatCost`, not by A2's own `{amount} {unit}` template — the formatted string is passed as the chip's `amount` with the unit suppressed. That is what lets the rate form render today, and it should be simplified once A2 takes a `Cost` directly. The same call site also passes `text-foreground`, because A2's own muted-text-on-muted-background pairing fails contrast wherever it is composed.",
    "An action with no `cost` renders no chip rather than a zero — correct for genuinely free work, and a silent bug if you simply forgot to price it.",
    "This component and F4 `action-stack` share a row implementation by duplication, not by import: F4's root owns its own dropdown, so it cannot be nested once per group. Change the row here and change it there too, or lift it into a module both can import.",
  ],
};
