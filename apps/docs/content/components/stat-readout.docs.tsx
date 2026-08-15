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
  pitfalls: [
    "A copyable item loses its copy control the moment its value is undefined — the guard is deliberate (there is nothing to put on the clipboard) but it means the row silently changes shape, so do not key a test or a layout on the button being there.",
    'Every copy control is labelled "Copy", with nothing identifying its row. A readout with a copyable seed and a copyable sampler gives a screen reader user two buttons with the same name and no way to tell them apart; until the label is row-scoped here, keep copy on a single field per readout where that matters.',
    "The copy handler stringifies the value with String(), so pass strings and numbers. A JSX element as `value` renders fine and copies the text [object Object], which nobody will notice until they paste.",
    "The clipboard write is optional-chained and unawaited: in a non-secure context, or when the permission is denied, the click is a silent no-op. If a confirmation matters, own it at the call site rather than expecting feedback from the component.",
    'The value is not pinned dir="ltr", unlike the numbers in cost-chip, credits-indicator and quota-meter. Inside an RTL page a composite numeric value such as "1024 × 1024" or "12 – 48" has its parts reordered by the bidi algorithm, because the neutral between two numbers takes the paragraph direction. Wrap such values yourself until the pin lands here.',
    'Passing your own data-slot erases stat-readout. Props spread after the component\'s own attributes, so `<StatReadout data-slot="asset-detail-params" />` removes the identity every test and style keys on. This has bitten three times in this repo; let the composed component keep its slot.',
  ],
};
