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
  pitfalls: [
    "Re-sorting the `models` array alphabetically before rendering — grouping is driven entirely by each model's `group` field and its first-seen order; alphabetizing upstream defeats the task-signature grouping this component exists to provide.",
    "Nesting an interactive row inside `dropdown`'s listbox. Select's own item is already the focusable `role=\"option\"` element, so rows there render entity-row without `onSelect` — passing one back in reintroduces the nested-interactive violation this component was built to avoid.",
    "Treating a plain-text settings-bar button as model selection (see A7 gen-settings-bar's own demo, which currently does this) instead of composing model-picker's `node-inline` presentation — that duplicates the picker's grouping and badges with an idiom that has neither.",
  ],
};
