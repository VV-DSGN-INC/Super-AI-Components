import type { ComponentDocs } from "@/lib/component-docs";

import { AiNode } from "@/registry/super-ai/ai-node";

/** Seeded from docs/design-system/component-specs.md#g2-ai-node. Static examples only; no sidecar. */
export const AiNodeDocs: ComponentDocs = {
  whatItIs:
    "The card every node on the canvas is made of: a header with the title, model label and status badge, a media slot, a body slot, an optional footer that can dock inside the card or float below it as a pill, and two whole-card states, locked and failed, that replace or annotate the body. It is one component with slots, not ten presets.",
  whyItMatters:
    "ElevenLabs Flows and Freepik Flows ship one node shell and fill it per modality, and the recut that produced this catalog took Flow Kit from twenty-five items to nine plus a hook on exactly that observation. The shell owns status, selection, locking and failure so that thirteen modality presets cannot each draw a slightly different error banner.",
  evidence: ["ElevenLabs Flows", "Freepik Flows"],
  anatomy: [
    {
      slot: "ai-node",
      note: 'The card: a group named "<title> node, <status>", with data-status and data-node-id. Width comes from size, never from content.',
    },
    {
      slot: "ai-node-header",
      note: "Title, model label with the Local suffix, and a compact node-status badge.",
    },
    { slot: "ai-node-media", note: "The result. Phase 2's modality-node puts result-card here." },
    { slot: "ai-node-body", note: "The controls. Phase 2 puts media-prompt-bar (node-embedded) here." },
    { slot: "ai-node-error", note: "The failed banner, three lines max, painted from --destructive at 10%." },
    {
      slot: "ai-node-footer",
      note: "The docked footer under a border: run-button and gen-settings-bar in phase 2.",
    },
    {
      slot: "ai-node-menu",
      note: "The same footer as a floating pill below the card when menuPlacement is floating.",
    },
    {
      slot: "ai-node-frame",
      note: "The wrapper that stacks card and pill in floating placement. Only present then.",
    },
    {
      slot: "ai-node-locked",
      note: "Replaces media and body when status is locked; lockedCta replaces its copy.",
    },
  ],
  usage:
    'Use it as the shell for any node component; do not draw a node card of your own. Pass `status` straight from useFlowRunner, `selected` from the canvas, and fill the slots with shipped components: media-prompt-bar for the prompt, result-card for the result, run-button and gen-settings-bar in the footer. Pick `menuPlacement="floating"` when the settings pill should read as attached to the canvas rather than inside the card, which is the FilmMaker placement. Give it the size the modality needs; width is not content-driven.',
  dos: [
    {
      text: "Let the shell own failure: pass `error` and the banner appears under the body with the status ring.",
      example: (
        <AiNode
          id="doc-failed"
          title="Image"
          modelLabel="Flux 1.1"
          status="failed"
          size="sm"
          error="Provider rate limit exceeded, retry in 30 seconds."
        >
          <div className="bg-muted aspect-video w-full rounded-md" />
        </AiNode>
      ),
    },
  ],
  donts: [
    {
      text: "Don't render a footer and a floating menu from two different sources; there is one `footer` prop and `menuPlacement` only moves it.",
      example: (
        <AiNode
          id="doc-floating"
          title="Speech"
          status="done"
          size="sm"
          menuPlacement="floating"
          footer={<span className="text-muted-foreground text-xs">Eleven v3</span>}
        >
          <div className="bg-muted h-8 w-full rounded-md" />
        </AiNode>
      ),
    },
  ],
  accessibility: {
    keyboard: [
      "The card itself is not focusable and has no keys. Every tab stop inside a node belongs to slot content: the run button, the prompt, the settings bar. Selection by keyboard is the canvas's job.",
    ],
    screenReader: [
      'The card is a group whose name is the title plus the status word, so arriving on it reads "Video node, Running". The header\'s badge is aria-live polite, so a status change is announced once.',
      'The locked block replaces the body entirely; a locked node announces its title, the status "Upgrade to run", and then the lock copy or the lockedCta you pass.',
    ],
  },
  pitfalls: [
    "selected and the status ring share the same ring slot; selected wins and hides the status ring on purpose, because a selected node is being looked at and its badge still shows the status.",
    "In floating placement the group no longer contains the footer. A test that looks for the run button inside the group finds nothing; query the ai-node-frame instead.",
    "Width is fixed by size (280, 320 or 420). A footer wider than that overflows; the phase 1 story RunButtonInFooter measures E5 at sm and records the result in CONTINUE.md §8.",
  ],
};
