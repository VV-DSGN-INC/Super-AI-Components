import type { ComponentDocs } from "@/lib/component-docs";
import {
  CitationIsDecoration,
  CitationResolvesToItsSource,
  OutputsLandInTheStudioPane,
  OutputsOpenSomewhereElse,
} from "./notebook-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O13 `notebook-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence` and
 * the rest directly. Live examples live in the ./notebook-shell.examples client
 * sidecar and arrive here as zero-prop elements.
 */
export const NotebookShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for grounded generation: the documents you uploaded on the left, a conversation about them in the middle with a composer under it, and a menu of things the notebook can make on the right. It is a block, not a component — it owns arrangement and nothing else. K5 source-panel fills the left pane, AI Elements' conversation and message carry the turns, K7 answer-block renders a grounded answer with K6 citation-ref markers inside it, D1 and D3 are the composer, and C3 feature-card-row plus F1 result-card are the studio. Each of them keeps its own props, its own state model and its own accessibility contract.",
  whyItMatters:
    "NotebookLM is the reference, and it is a genuinely distinct archetype rather than a chat window with a file drawer bolted on: sources are first-class citizens, so the shell has to hold three things at once and let any of them be empty. That is the decision worth copying. On first load all three panes are empty simultaneously — no sources, no conversation, nothing generated — and that is the state most new users actually meet, so it is the one the layout is designed around rather than the one it degrades into. The second is that citations resolve backwards into the source pane. A marker that names its document and scrolls it into view is what makes an answer auditable; the same marker rendered as decoration is just a claim with a small number after it.",
  evidence: ["NotebookLM"],
  anatomy: [
    {
      slot: 'data-region="sources"',
      note: "K5 source-panel with its own heading and add-source slot, or K5's own L1 when nothing is ingested. Scrolls, so it carries a tab stop and a name.",
    },
    {
      slot: 'data-region="chat"',
      note: "AI Elements' Conversation. role=log, named, its own tab stop, sticks to bottom. Falls to L1 when there are no turns.",
    },
    {
      slot: 'data-region="composer"',
      note: "D1 media-prompt-bar with D3 chips, N3 underneath. A sibling of the chat pane, never inside its scroll container.",
    },
    {
      slot: 'data-region="studio-outputs"',
      note: "C3 feature-card-row as the menu of output types, F1 result-cards underneath, L1 when nothing has been generated.",
    },
    { slot: "notebook-shell", note: "Root. Three columns above lg, a stack below it." },
    {
      slot: "notebook-shell-turn",
      note: "One turn — AI Elements' Message. Carries data-message-id and data-role.",
    },
    {
      slot: "notebook-shell-jump-status",
      note: "Announces which source a citation just scrolled into view.",
    },
    { slot: "notebook-shell-output-types", note: "The menu half of the studio pane." },
    { slot: "notebook-shell-outputs", note: "The results half. Never replaces the menu above it." },
  ],
  usage:
    "Reach for it when answers have to be traceable to documents the user supplied. Everything is a prop: `sources` fills the left pane and is the list citations resolve against, `messages` fills the middle, `outputTypes` is the studio menu and `outputs` is what it produced. Give an assistant turn `claims` rather than `content` when the answer is grounded — each claim carries its citations, and K7 adds the warning when some of them are not sourced. A citation names a `sourceId`, not a callback: the shell finds that source, labels the marker with its name, scrolls the left pane to it and announces the move. Wire `sourcesAction` and `sourcesEmptyAction` with the same verb, since the empty pane is the version most first-time users see. The shell holds no notebook state of its own — ingest, retry, composer value and generation all stay wherever your data already lives.",
  dos: [
    {
      text: "Give a citation a source and a quote, so a reader can check the claim without leaving the answer.",
      example: <CitationResolvesToItsSource />,
    },
    {
      text: "Generate into the studio pane, under the menu that offered the output.",
      example: <OutputsLandInTheStudioPane />,
    },
  ],
  donts: [
    {
      text: "Don't render a marker that is not a control — a superscript that names nothing cannot be verified and cannot be reached by keyboard.",
      example: <CitationIsDecoration />,
    },
    {
      text: "Don't send a generated output to its own surface; the studio stops being a place where things accumulate the moment you do.",
      example: <OutputsOpenSomewhereElse />,
    },
  ],
  pitfalls: [
    "K5 source-panel stamps no per-source identifier on its rows, so the citation jump finds its target by position in the `sources` array you handed the shell. It cannot drift — the two lists are the same list — but it does mean a citation cannot address a source K5 has not rendered, and re-ordering `sources` between renders moves the target. K5 growing a `data-source-id` on its row, plus a `highlightedSourceId` prop, would turn this into an attribute lookup and let the destination visibly light up rather than only scroll.",
    "A citation whose `sourceId` is not in `sources` renders as K6's `unresolved` state on purpose, complete with an accessible name saying the source is unavailable. That is the intended behaviour, not a bug to route around — but it means filtering `sources` per message, or lazily loading them, will make perfectly good citations look broken. Pass the whole source list.",
    "K5 is `max-w-md`, which is right for the panel it was specified as and wrong for a pane that is the width of a column. The shell releases the cap at the call site. If you re-wrap the sources region, keep that override or the panel will stop short of the pane it sits in.",
    "C3's carousel arrows are positioned three rem outside the row, which is correct on a page with margins and invisible inside a twenty-rem studio pane. The shell pulls them inside with a descendant variant on C3's own class list. If you restyle the output-type menu, restyle the arrows too, or they will be clipped.",
    "AI Elements is written against Radix-flavoured shadcn and this registry is Base UI, so the vendored `message` carries two local `asChild` → `render=` edits. Installing notebook-shell through shadcn fetches AI Elements' file from its own registry, not this repo's patched copy — in a Base UI project, expect to make the same two edits.",
    "`use-stick-to-bottom` owns an element between the conversation root and its content and sets no overflow on it, so without a `scrollClassName` the chat pane does not scroll, it grows. Because that element is not yours, the region's accessible name and tab stop live on the conversation root instead — moving the overflow without moving those two fails axe's scrollable-region-focusable rule.",
    "D1 is the media-generation omnibox, so it offers a negative-prompt field a notebook composer has no use for. The shell suppresses that control through a descendant variant on D1's own class list, and a `composer.className` you pass is merged after the shell's — override the same utility and the control comes back.",
    "Three panes side by side stop working well before the phone breakpoint, so below `lg` the shell stacks them in reading order and moves the scroll to the root. The panes lose their independent scrollers there by design; anything you anchor to the bottom of a pane will scroll away with the page. The `Responsive` story sets the viewport through Storybook's manager, which the vitest story runner has no equivalent of — that story is checked at default width by the gate and by hand at 375px by a human.",
  ],
};
