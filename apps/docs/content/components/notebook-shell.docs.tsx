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
  accessibility: {
    keyboard: [
      "Three tab stops before any control: each pane carries `tabIndex={0}` because each pane scrolls. Below `lg` the panes stop scrolling independently and the root takes over, but the three stops remain — on a phone they are three Tabs that do nothing.",
      "A citation marker is a real `<button>`, so Enter and Space jump the left pane. `loading` and `unresolved` markers are still focusable buttons with no `onClick`, so they take a tab stop and do nothing when pressed.",
      "That makes an answer expensive to tab through. Citations are inline in the claim text, so a five-claim answer with two citations each is ten stops inside one message, with no way to skip a turn.",
      "The composer is D1 with its negative-prompt toggle removed by `display:none`, so it is genuinely gone from the tab order rather than hidden and still reachable. Enter asks, Shift+Enter breaks the line.",
      "The studio's output-type menu is C3's carousel: a `role=\"region\"` with its own Left/Right handling, two arrow buttons, then one stop per card.",
      "Nothing in the shell handles Escape, and the citation jump has no keyboard route back to the sentence you were reading other than Shift+Tab.",
    ],
    screenReader: [
      "Four regions, named three different ways: sources by `aria-label={sourcesLabel}`, chat by `aria-label={chatLabel}` on AI Elements' Conversation (which also brings `role=\"log\"`), studio by `aria-labelledby` onto its own `<h2>` — and the composer by nothing at all. `data-region=\"composer\"` is a bare div with no role and no name.",
      "A resolved citation announces as its label and nothing else, which is usually a bare number. `aria-label` is set only in the `unresolved` state (\"Citation 3 — source unavailable\"), so the broken citations are the ones that announce best.",
      "The source name and the quoted passage live in a hover card, and Base UI's preview card wires no `aria-describedby` back to the trigger and gives its popup no role. It does open on keyboard focus, but its contents are an unassociated portal at the end of the document — a screen-reader user hears \"3, button\" and has to go looking for the quote. That is the gap between the shell's promise that an answer is auditable and what assistive tech is actually handed.",
      "The jump itself is announced: `notebook-shell-jump-status` is an sr-only `role=\"status\"` reading \"Showing {source} in {sourcesLabel}\". It has to be, because the jump only scrolls the left pane and never moves focus there.",
      "K7's coverage warning is ordinary text inside the answer, read in document order after the claims — \"Some claims here aren't sourced\", or \"Nothing in this answer is sourced\". It is not a live region, so it is announced when the reader reaches it rather than when the answer lands.",
      "K5 gives each source an sr-only `role=\"status\"` for its ingest stage and a `role=\"progressbar\"` named for the source and the stage, so a panel of four in-flight sources is not four identical \"Loading\" bars. Ingest is the one thing in this shell that announces itself as it happens.",
      "The composer's own live region announces \"Generating…\" and then falls silent when the answer arrives. The chat pane's `role=\"log\"` is what covers the arrival, and only for screen readers that follow logs.",
    ],
    focus: [
      "A citation jump moves the scroll and not the focus. The left pane scrolls the matching row into view and the status region names it, while focus stays on the marker in the middle pane — deliberate, since you are still mid-sentence, but it means the only keyboard route into the source you just surfaced is back through the pane's own tab stop.",
      "The jump target is found by position in the `sources` array, not by an identifier on the row, so re-ordering `sources` between renders moves where the scroll lands. K5 growing a `data-source-id`, plus a `highlightedSourceId`, would let the destination visibly light up instead of only scrolling.",
      "The three pane tab stops are bare `tabIndex={0}` containers with no `focus-visible` style, so tabbing into a pane shows nothing. Every actual control — citations, chips, cards, composer buttons — brings its own ring.",
      "The shell unmounts nothing that had focus. The focus loss here comes from the composer: D1 disables its textarea while `generating`, which drops focus to `<body>` mid-run.",
    ],
  },
  pitfalls: [
    "K5 source-panel stamps no per-source identifier on its rows, so the citation jump finds its target by position in the `sources` array you handed the shell. It cannot drift — the two lists are the same list — but it does mean a citation cannot address a source K5 has not rendered, and re-ordering `sources` between renders moves the target. K5 growing a `data-source-id` on its row, plus a `highlightedSourceId` prop, would turn this into an attribute lookup and let the destination visibly light up rather than only scroll.",
    "A citation whose `sourceId` is not in `sources` renders as K6's `unresolved` state on purpose, complete with an accessible name saying the source is unavailable. That is the intended behaviour, not a bug to route around — but it means filtering `sources` per message, or lazily loading them, will make perfectly good citations look broken. Pass the whole source list.",
    "K5 is `max-w-md`, which is right for the panel it was specified as and wrong for a pane that is the width of a column. The shell releases the cap at the call site. If you re-wrap the sources region, keep that override or the panel will stop short of the pane it sits in.",
    "C3 already positions its own carousel arrows inside its own box by default — top-anchored, over the icon or thumbnail above a card's title. Inside a twenty-rem studio pane that still lands on the first card, since the card is the full width of the pane. The shell moves them again, above the row onto its header line, with a descendant variant on C3's own class list. If you restyle the output-type menu, restyle the arrows too, or they will fall back inside the row, over a card.",
    "AI Elements is written against Radix-flavoured shadcn and this registry is Base UI, so the vendored `message` carries two local `asChild` → `render=` edits. Installing notebook-shell through shadcn fetches AI Elements' file from its own registry, not this repo's patched copy — in a Base UI project, expect to make the same two edits.",
    "`use-stick-to-bottom` owns an element between the conversation root and its content and sets no overflow on it, so without a `scrollClassName` the chat pane does not scroll, it grows. Because that element is not yours, the region's accessible name and tab stop live on the conversation root instead — moving the overflow without moving those two fails axe's scrollable-region-focusable rule.",
    "D1 is the media-generation omnibox, so it offers a negative-prompt field a notebook composer has no use for. The shell suppresses that control through a descendant variant on D1's own class list, and a `composer.className` you pass is merged after the shell's — override the same utility and the control comes back.",
    "Three panes side by side stop working well before the phone breakpoint, so below `lg` the shell stacks them in reading order and moves the scroll to the root. The panes lose their independent scrollers there by design; anything you anchor to the bottom of a pane will scroll away with the page. The `Responsive` story sets the viewport through Storybook's manager, which the vitest story runner has no equivalent of — that story is checked at default width by the gate and by hand at 375px by a human.",
  ],
};
