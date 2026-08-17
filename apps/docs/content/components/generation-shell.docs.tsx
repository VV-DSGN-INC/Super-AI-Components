import type { ComponentDocs } from "@/lib/component-docs";
import {
  CostAndGenerateAreOneRow,
  EmptyPaneIsAnInertBox,
  EmptyPaneTeachesTheTool,
  GenerateAtTheEndOfTheScroll,
} from "./generation-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O6 `generation-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and the rest directly. Live examples live in the
 * ./generation-shell.examples client sidecar and arrive here as zero-prop
 * elements.
 */
export const GenerationShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for a single-purpose AI tool: a title bar, a config column on the left, a results canvas on the right, and one row at the foot of the config column holding the price and the button that spends it. It is a block, not a component — it owns arrangement and nothing else. The panel, the preset grid, the model picker, the parameter rows, the run button, the cost chip, the result cards, the results grid, the empty state and the credits indicator are all already-shipped components, each keeping its own props, state model and accessibility contract.",
  whyItMatters:
    "Freepik's apps, Tripo, Playground, getimg and Simplified all ship this exact layout, which makes it the default packaging for a single-purpose AI tool and the cheapest shell in the catalog to stand up. Two of its decisions carry the weight. The price and the Generate button are one row pinned below the config column's scroll, so nobody ever commits to a spend they had to scroll away from to read — separate them and you have built a tool that quotes a number in one place and charges it in another. And the empty right pane is a before → after example pair rather than a grey box, because on day one that pane is the entire product: it has to teach what the tool does in the two seconds before someone types anything.",
  evidence: ["Freepik apps", "Tripo", "Playground", "getimg", "Simplified"],
  anatomy: [
    {
      slot: 'data-region="topbar"',
      note: "B7 app-topbar titled with the tool, carrying M2 credits-indicator in its trailing slot.",
    },
    {
      slot: 'data-region="config-panel"',
      note: "E1 generation-panel: dropzone, directions, E4 presets, then E2 + E3 in settings.",
    },
    {
      slot: 'data-region="cost-generate"',
      note: "A2 cost-chip and E5 run-button as one row, inside E1's pinned footer — outside its scroll.",
    },
    {
      slot: 'data-region="result-canvas"',
      note: "F2 generation-grid of F1 result-cards, or L1's example pair. Scrolls, so it is focusable and named.",
    },
    { slot: "generation-shell", note: "Root. Full height, no scroll of its own — the two panes scroll independently." },
    { slot: "data-result-id", note: "On each F1 card, so a result can be addressed without reaching for its index." },
  ],
  usage:
    "Reach for it when your product does one thing to one input and shows you the output. Everything is a prop: `panel` is forwarded whole to E1, `presets` fills E4, `models` fills E2, `parameters` takes E3's own row components, `run` is forwarded whole to E5, and `results` (or `resultGroups`) fills F2. The prices are the shell's, not the children's — set `cost`, `costUnit` and `balance` once and they feed the chip, the shortfall wording on a blocked run and the credits indicator from one place, which is what stops a tool quoting two different numbers. Pass `examplePair` before you pass anything else: it is what the pane shows on day one, and day one is the version most people see. The shell holds no state, so directions, preset, model, parameters, run state and selection all stay wherever your data already lives.",
  dos: [
    {
      text: "Keep the price and Generate in one row below the panel's scroll, so the number is on screen at the moment of commitment.",
      example: <CostAndGenerateAreOneRow />,
    },
    {
      text: "Fill the empty canvas with a before → after pair — it teaches the tool faster than any description.",
      example: <EmptyPaneTeachesTheTool />,
    },
  ],
  donts: [
    {
      text: "Don't let Generate be the last item in a scrolling column, with the cost stranded somewhere above it.",
      example: <GenerateAtTheEndOfTheScroll />,
    },
    {
      text: "Don't ship an inert box that names the emptiness; it describes the state instead of the product.",
      example: <EmptyPaneIsAnInertBox />,
    },
  ],
  accessibility: {
    keyboard: [
      "Tab order follows the DOM, which is the whole left column before any result: topbar actions, then the credits indicator, then every open stage of the config panel, then the cost-and-Generate row, then the canvas. There is no skip link, so reaching the third result means tabbing past the entire panel.",
      "The results canvas is itself a tab stop. It scrolls, so it carries `tabIndex={0}` and a name — that is what keeps a scrollable region reachable — and it means one stop lands on the pane before any card inside it.",
      'Nothing here has arrow-key navigation. Once the canvas has focus it takes the usual page keys; the grid inside it is a `role="list"` with no roving tabindex.',
      "The shell binds no keys of its own. There is no Escape to leave select mode and no shortcut to Generate — every stop belongs to a composed component.",
    ],
    screenReader: [
      'The canvas is a `<section>` with an accessible name, which makes it a `region` landmark called "Results" by default. Rename it with `resultsLabel` when the tool makes something more specific than results.',
      'A run in flight is announced by E5\'s own live region, and a failed run by its `role="alert"`. Nothing announces the result *arriving* — the grid has no live region, so a finished batch appears in a pane the user is not in and says nothing.',
      "The price is announced once, from one number. `cost` feeds A2's chip in the pinned row and E5's shortfall wording, which is why the shell never passes `cost` down to E5; do it yourself and the same price is announced twice from two chips.",
      "Toggling select mode changes what each card's control means — open-this-result becomes select-this-result — without moving it or announcing anything. The bulk toolbar appearing above the grid is the only signal, and it is not live.",
      "The empty pane is a full L1 with a before → after pair, and that pair announces as whatever you put in it. Give the two images real alt text, or the thing that teaches the tool teaches nothing.",
    ],
    focus: [
      "Pressing Generate disables the button that was pressed — E5 sets `disabled` while estimating or running — so focus falls to `<body>` and the next Tab restarts at the top of the shell. The Cancel button that appears beside it is a different element and does not inherit the focus.",
      "The shell moves focus nowhere at all. It holds no state, so every moment that ought to move focus — results arriving, select mode ending, a run failing — is left to your handlers.",
      "Every focus ring in the shell belongs to a composed child. The one focusable element the shell owns is the canvas, and it has no `focus-visible` style of its own, so tabbing into it shows whatever the browser's default outline provides.",
    ],
  },
  pitfalls: [
    "E1 generation-panel already has a cost + Generate footer of its own, driven by its `cost` and `costUnit` props. This shell deliberately leaves those unset and fills only E1's `generate` slot, because E1 renders its chip as a sibling of that slot — using both would put the price outside the `cost-generate` region and leave the region holding a button with no number beside it. If you compose E1 directly somewhere else, pick one or the other; do not use both.",
    "E5 run-button renders an A2 chip of its own whenever it is given a `cost` and is idle, done or failed, and it has no way to be told not to. This shell therefore never passes `cost` to E5 — it hands it a pre-formatted `insufficientMessage` built from the same numbers instead. Pass `run={{ cost: 55 }}` yourself and you will get two chips showing the same price. The real fix belongs upstream: E5 wants a `showCost` escape hatch.",
    "The cost row lands in shadcn `CardFooter`, which paints `bg-muted/50`, and everything in that row is composed — E5's shortfall line and its locked reason are both `text-muted-foreground` spans inside E5 that no `className` from here can reach. The row rebinds `--muted-foreground` to `--foreground` so every descendant repaints at once. Restyle the row and keep that rebinding, or you reintroduce a 4.34:1 pairing that no static check will catch.",
    "F2's empty affordance is an in-grid tile by design, which means it occupies one column of a four-up grid. A before → after pair in a quarter-width cell is unreadable, so the shell widens only the empty cell with `col-span-full` through a descendant variant. If you restyle the canvas, restyle that inner cell rather than the wrapper — the wrapper is not the element that columns.",
    "The panel's pinning is only as good as its height. E1 keeps Generate out of its scrolling body, but if the panel itself has no bounded height it simply grows and the footer goes below the fold — exactly the failure the spec names. This shell bounds it at every width (half the shell when stacked, full height beside the canvas); a `panel.className` that reintroduces `h-auto` on a page that scrolls undoes it silently.",
    "`parameters` takes E3's row components — `<ParameterSlider />`, `<ParameterSegmented />`, `<ParameterTabs />` — not a whole `<ParameterPanel />`. The shell owns the panel around them so the group-level reset wires to `onResetParameters`; nesting a second panel gives you two headers and two reset affordances for one set of rows.",
    "O6's `Filled by:` list does not name B7 app-topbar, but it declares a topbar region — so this shell composes B7 rather than hand-rolling a header, and reports the addition. If your tool genuinely has no title bar, leave the region mounted and empty rather than removing it; a region that appears from nowhere cannot teach that it exists.",
    "The `Responsive` story resizes the Storybook canvas only. The vitest runner behind the accessibility gate has no manager to resize an iframe, so it renders and axe-checks that story at the browser's default width — the stacked narrow layout here was verified by hand, not by a gate.",
  ],
};
