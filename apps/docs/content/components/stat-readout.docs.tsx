import type { ComponentDocs } from "@/lib/component-docs";

import { StatReadout } from "@/registry/super-ai/stat-readout";

/**
 * Seeded from docs/design-system/component-specs.md#a10-stat-readout.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). No ./stat-readout.examples sidecar either — every
 * example below is static markup, the only callback in the component is the
 * copy button's own internal click, and nothing here needs a prop that
 * carries a handler. The sidecar is optional; this component does not earn
 * one. Same shape as cost-chip.docs.tsx.
 */
export const StatReadoutDocs: ComponentDocs = {
  whatItIs:
    "A description list of label→value rows for the metadata hanging off a result: model, seed, sampler, guidance, duration, dimensions. Column count is a prop rather than a second component, so the same rows read as a two-column grid in a wide panel and as a stacked list in a sidebar. Individual values can carry a copy control, and a value that is absent prints an em-dash instead of leaving the cell blank.",
  whyItMatters:
    "This is the recipe card. Midjourney, Playground and Freepik all attach seed, sampler, guidance and model to the generated asset, because the thing that makes a good result useful is being able to run it again — and you cannot run it again from a screenshot. That is also why copy is a per-value affordance rather than a single Copy all: the seed is the field people actually re-enter. Five components in this registry compose it rather than laying out their own key/value grid (asset-detail, run-inspector, source-panel, escalation-handoff, waveform-editor), which is what keeps a run's parameters looking the same wherever they surface.",
  evidence: ["Midjourney", "Playground", "Freepik"],
  anatomy: [
    {
      slot: "stat-readout",
      note: "The <dl> itself, and the grid that positions every row. Do not pass your own data-slot: props spread after this attribute, so yours replaces it.",
    },
    {
      slot: "stat-readout-label",
      note: "The <dt>. Muted, unstyled otherwise — the label carries no weight so the value can.",
    },
    {
      slot: "stat-readout-value",
      note: "The <dd>. A flex row holding the value and, when the item is copyable, the copy control beside it.",
    },
    {
      slot: "stat-readout-copy",
      note: "The copy control. Rendered only when the item sets copyable AND has a value — a missing value has nothing to copy, so the button is absent rather than inert.",
    },
  ],
  usage:
    "Reach for it wherever a result carries read-only metadata a user might need to read back or reproduce: the parameters pane of an asset detail, a run inspector's metadata tab, the ingestion stats under a source. Pass `items` as `{ label, value }` pairs in the order they should be read, mark the reproducibility fields (`seed`, `sampler`, `model`) `copyable`, and drop to `columns={1}` when the container is too narrow for a label column — roughly a sidebar. Reach elsewhere when the rows are not simply reported: `field-row` when a value is editable, `slot-summary` when each value needs a source mark and a correction affordance, `quota-meter` when the number is measured against a limit. The test is whether anything can act on the number. If it can, this is the wrong component.",
  dos: [
    {
      text: "Keep a field in the list when it exists but is unset, and let it render the em-dash — a row that says nothing is set is information; a row that was silently dropped is not.",
      example: (
        <StatReadout
          className="w-full max-w-xs"
          items={[
            { label: "Model", value: "flux-1-dev" },
            { label: "Guidance", value: "3.5" },
            { label: "Negative", value: undefined },
          ]}
        />
      ),
    },
    {
      text: "Mark the fields a result can be reproduced from as `copyable`, and pass them as plain strings — seed and sampler exist to be re-entered somewhere else.",
      example: (
        <StatReadout
          className="w-full max-w-xs"
          items={[
            { label: "Seed", value: "884201773", copyable: true },
            { label: "Sampler", value: "dpmpp_2m", copyable: true },
            { label: "Steps", value: "28" },
          ]}
        />
      ),
    },
  ],
  donts: [
    {
      text: 'Do not substitute a stand-in for a missing value. A zero is a number somebody will paste back into a seed field, and "N/A" is three characters saying what one glyph already says.',
      example: (
        <StatReadout
          className="w-full max-w-xs"
          items={[
            { label: "Seed", value: "0" },
            { label: "Negative", value: "N/A" },
            { label: "Sampler", value: "" },
          ]}
        />
      ),
    },
    {
      text: "Do not put a sentence in the value column of a two-column readout. Nothing here truncates, so a long value wraps into a paragraph, the label track widens to compete with it, and the row rhythm that made the grid scannable is gone.",
      example: (
        <StatReadout
          className="w-full max-w-xs"
          items={[
            { label: "Model", value: "flux-1-dev" },
            {
              label: "Negative",
              value: "blurry, low contrast, watermark, extra fingers, text artifacts, oversaturated colors",
            },
          ]}
        />
      ),
    },
  ],
  accessibility: {
    keyboard: [
      "The readout has exactly as many tab stops as it has copyable items with a value. Mark nothing `copyable` and it is entirely inert; mark six fields copyable and the reader tabs through six controls to get past a block of read-only text.",
      "The copy control is a real `<button type=\"button\">`, so Space and Enter fire it. Nothing else is bound — no arrow-key movement between rows, no select-all, no Escape, and no keyboard route to the value itself other than reading it.",
      "A copyable item with an undefined value renders no button rather than a disabled one, so the tab count changes with the data. Do not key a test or a layout on the control being there.",
      "There is no `disabled` prop anywhere in this component. If a value must not be copied, leave `copyable` off — there is no inert state to fall back on.",
    ],
    screenReader: [
      "It is a real `<dl>` with `<dt>`/`<dd>` pairs, so each value is programmatically the description of its label and a row announces as \"Seed, 884201773\" rather than as two loose runs of text. That association survives `columns={1}`, where the grid stacks but the markup does not change.",
      'A missing value is an em-dash character, which most screen readers announce as "dash" or skip entirely. It reads as deliberate on screen; through audio it can read as an empty cell, so do not rely on it to communicate "not set" where that fact matters.',
      'Every copy control is labelled with the bare string "Copy" — the label is not scoped to its row. A readout with a copyable seed and a copyable sampler gives two buttons with the same name and nothing to tell them apart in a screen reader\'s element list. Until that is fixed here, keep copy on one field per readout wherever it matters.',
      'The glyph inside the copy button is `aria-hidden`, so the name is the `aria-label` alone; there is no visible text on the control for a voice-control user to say beyond "Copy".',
      "Copying announces nothing. There is no live region and no confirmation, and the clipboard write is optional-chained and unawaited — in a non-secure context or with the permission denied, the click is a silent no-op that assistive tech reports exactly as it reports a success.",
      "`label` and `value` are both `ReactNode`, so an element in either is announced by name-from-content — but `String(value)` is what reaches the clipboard, and an element stringifies to `[object Object]`. What is heard and what is pasted can therefore differ.",
    ],
    focus: [
      "Nothing here moves focus, but the rows are keyed by array index (`key={i}`), so removing or reordering `items` does not move the DOM — it rewrites it in place. Focus stays on the button at that position, which now belongs to a different stat, and because every copy button is named \"Copy\" nothing announces the swap.",
      "The copy control ships its own `focus-visible:ring-2`. It is the only focusable element here, so the readout has a visible focus style without any work at the call site.",
    ],
  },
  pitfalls: [
    "A copyable item loses its copy control the moment its value is undefined — the guard is deliberate (there is nothing to put on the clipboard) but it means the row silently changes shape, so do not key a test or a layout on the button being there.",
    'Every copy control is labelled "Copy", with nothing identifying its row. A readout with a copyable seed and a copyable sampler gives a screen reader user two buttons with the same name and no way to tell them apart; until the label is row-scoped here, keep copy on a single field per readout where that matters.',
    "The copy handler stringifies the value with String(), so pass strings and numbers. A JSX element as `value` renders fine and copies the text [object Object], which nobody will notice until they paste.",
    "The clipboard write is optional-chained and unawaited: in a non-secure context, or when the permission is denied, the click is a silent no-op. If a confirmation matters, own it at the call site rather than expecting feedback from the component.",
    'The value is not pinned dir="ltr", unlike the numbers in cost-chip, credits-indicator and quota-meter. Inside an RTL page a composite numeric value such as "1024 × 1024" or "12 – 48" has its parts reordered by the bidi algorithm, because the neutral between two numbers takes the paragraph direction. Wrap such values yourself until the pin lands here.',
    'Passing your own data-slot erases stat-readout. Props spread after the component\'s own attributes, so `<StatReadout data-slot="asset-detail-params" />` removes the identity every test and style keys on. This has bitten three times in this repo; let the composed component keep its slot.',
  ],
};
