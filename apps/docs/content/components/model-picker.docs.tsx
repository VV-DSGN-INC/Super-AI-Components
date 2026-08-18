import type { ComponentDocs } from "@/lib/component-docs";
import {
  ColorOnlyRuntimeDot,
  GroupedByTaskSignature,
  HardwareOnTheRuntimeBadge,
  PriceAsDisconnectedFootnote,
} from "./model-picker.examples";

/**
 * Seeded from docs/design-system/component-specs.md#e2-model-picker.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity live
 * in the ./model-picker.examples client sidecar and get referenced here as
 * zero-prop elements — see that file for why.
 */
export const ModelPickerDocs: ComponentDocs = {
  whatItIs:
    "The control for choosing which model a generation runs on, in three container shapes for three surfaces: a compact `dropdown` for a toolbar, `expanded-cards` for a dedicated model-selection screen, and a `node-inline` popover sized to sit inside a canvas or workflow node. All three show the same model list, grouped by task signature, with the same price/capability/runtime badges — only what holds the list changes.",
  whyItMatters:
    "Model choice is a real decision with real consequences for cost, speed and output shape, not a settings-menu afterthought — ElevenLabs Flows, Freepik, Tripo and Playground all give it a dedicated, badge-rich control rather than a bare text dropdown. Because the picker owns which capabilities a model has, it can drive the parameter strip that follows it (A7 gen-settings-bar) — selecting a model rewrites what settings even apply, so the picker has to be the single source of truth for that, not a plain label another control quietly duplicates.",
  evidence: ["ElevenLabs Flows", "Freepik", "Tripo", "Playground"],
  anatomy: [
    { slot: "model-picker", note: "Root wrapper; carries `data-presentation` for the active container." },
    { slot: "model-picker-group", note: "One task-signature group — a heading plus its models, in every presentation." },
    { slot: "model-picker-trigger", note: "The control that opens the list, in `dropdown` and `node-inline`. Its accessible name always includes the current selection." },
    { slot: "model-picker-content", note: "The popup/listbox surface holding the grouped rows, in `dropdown` and `node-inline`." },
    { slot: "model-picker-cards", note: "The Card wrapping a group's rows in `expanded-cards`." },
    { slot: "model-picker-item", note: "One model row inside `dropdown`'s listbox — a non-interactive entity-row, since Select's own option element is already interactive." },
    { slot: "model-picker-badges", note: "The shared badge row — runtime, capabilities, price — identical across all three presentations." },
    { slot: "model-picker-runtime-badge", note: "Local vs. cloud, with the hardware requirement folded into the badge's own text for local models." },
    { slot: "model-picker-capability-badge", note: "One badge per declared capability (resolution, audio, etc.)." },
  ],
  usage:
    "Reach for `dropdown` wherever a compact control needs to sit in a toolbar or composer alongside other settings; `expanded-cards` when model choice is the primary decision on a screen and there's room to show every badge at a glance; `node-inline` when the picker has to fit inside a canvas or workflow node without dominating it. Pass the same `models` array — with a `group` field for task signature — to any of the three; switching `presentation` never changes the data shape. Treat it as controlled: `selectedId` and `onSelect` are yours to own, same convention as workspace-switcher.",
  dos: [
    {
      text: "Group models by task signature (text→video, image→video) — never alphabetically. The signature is what makes the list scannable.",
      example: <GroupedByTaskSignature />,
    },
    {
      text: "Fold a local model's hardware requirement into the runtime badge itself, so it reads at a glance — never bury it in a tooltip or a specs page.",
      example: <HardwareOnTheRuntimeBadge />,
    },
  ],
  donts: [
    {
      text: "Don't signal local vs. cloud with a colour-only dot — a colourblind or screen-reader user gets nothing from it. The runtime badge always carries its own text.",
      example: <ColorOnlyRuntimeDot />,
    },
    {
      text: "Don't invent a second price idiom next to the model list — cost-chip already exists for this, and a disconnected footnote breaks the one-price-source rule E5/E1 depend on.",
      example: <PriceAsDisconnectedFootnote />,
    },
  ],
  accessibility: {
    keyboard: [
      "`dropdown` is one tab stop. The trigger opens the listbox on Enter, Space or Down; arrows move through options, typeahead jumps by first letter, Enter selects and Escape closes. The rows inside are non-interactive `entity-row` divs precisely so nothing nests a second control inside an option.",
      "`node-inline` is also one tab stop, but what it opens is not a listbox — it is a popover full of buttons. Arrows do nothing inside it; you Tab through the model rows one at a time, and Escape closes.",
      "`expanded-cards` has no trigger and no popup, so every model is its own tab stop in source order. Twelve models is twelve stops, and the group headings are not stops, so nothing lets you skip a task signature you do not care about.",
      "There is no `disabled` on any presentation and no way to mark a single model unavailable. A model you do not want chosen has to be left out of `models` entirely.",
      "The badges are never focusable. Runtime, capabilities and cost are read-only text in all three presentations.",
    ],
    screenReader: [
      "The trigger's accessible name is `\"{label}: {selected name}\"` — \"Model: Veo 3.1\" — falling back to the placeholder when nothing is selected, so the current choice is announced without opening anything. It is set with `aria-label`, which replaces the trigger's visible text rather than adding to it.",
      "In `dropdown` the task signatures are real `SelectGroup`s with a `SelectLabel`, so the grouping is announced. In `expanded-cards` and `node-inline` the heading is A12 `section-header`, whose title renders as a `<span>` — the grouping is visual there and announces as nothing.",
      "In `expanded-cards` and `node-inline` a row is `entity-row`'s button branch, so it announces as a toggle button with `aria-pressed`, not as an option in a list. There is no listbox/option pairing and no `aria-activedescendant`: three models are three independent toggle buttons that happen to be mutually exclusive by convention.",
      "A row's name is the whole row read out — title, description, then every badge. That is deliberate, because runtime is a real decision and not a footnote, but a model with four capabilities announces a long name every time it is passed.",
      "`node-inline`'s popup is `role=\"dialog\"` named from the trigger, so it announces as the model picker it is. The name is passed explicitly: Base UI renders the role unconditionally and the vendored `PopoverContent` supplies no name of its own, so an unnamed popup here would fail axe's `aria-dialog-name` rule — and would go unnoticed, because the `node-inline` story renders the trigger closed and axe never sees the popup at all.",
      "The runtime badge always carries its own text — \"Cloud\", or \"Local · 16GB VRAM\" — with the icon `aria-hidden`. Nothing about local versus cloud is signalled by colour or by glyph alone.",
      "Choosing a model announces the selection and nothing else. If the settings strip below rewrites itself in response, the live region belongs there.",
    ],
    focus: [
      "`dropdown` and `node-inline` both move focus into their popup on open and return it to the trigger on close, Escape included. `expanded-cards` moves focus nowhere: selecting a row leaves focus on that row, which is correct, because the row stays mounted.",
      "All three presentations are visibly focusable, but not with the same ring — `entity-row` ships its own `focus-visible:ring-2`, while the `dropdown` and `node-inline` triggers inherit the vendored SelectTrigger and Button rings.",
    ],
  },
  pitfalls: [
    "Re-sorting the `models` array alphabetically before rendering — grouping is driven entirely by each model's `group` field and its first-seen order; alphabetizing upstream defeats the task-signature grouping this component exists to provide.",
    "Nesting an interactive row inside `dropdown`'s listbox. Select's own item is already the focusable `role=\"option\"` element, so rows there render entity-row without `onSelect` — passing one back in reintroduces the nested-interactive violation this component was built to avoid.",
    "Treating a plain-text settings-bar button as model selection (see A7 gen-settings-bar's own demo, which currently does this) instead of composing model-picker's `node-inline` presentation — that duplicates the picker's grouping and badges with an idiom that has neither.",
  ],
};
