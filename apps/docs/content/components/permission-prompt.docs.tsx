import type { ComponentDocs } from "@/lib/component-docs";
import {
  ArgumentsHiddenUntilExpanded,
  EqualWeightVerbs,
  InlineGrantList,
  SubordinateEditFirst,
} from "./permission-prompt.examples";

/**
 * Seeded from docs/design-system/component-specs.md#n8-permission-prompt.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples that need interactivity live
 * in the ./permission-prompt.examples client sidecar and get referenced here
 * as zero-prop elements — see that file for why.
 */
export const PermissionPromptDocs: ComponentDocs = {
  whatItIs:
    "A modal gate that pauses a tool-calling agent before it does something consequential and asks a human to decide. It states the action in plain language, the full arguments, and the reason the agent believes the step is needed, then offers four ways forward: allow this call once, always allow it going forward, deny it, or edit the arguments before approving.",
  whyItMatters:
    "This is the single most important missing pattern in the catalog — every tool-calling agent needs a moment where a consequential action pauses for a human, and the population of agent frameworks (OpenAI Agents SDK, Microsoft Agent Framework, LangChain, Laravel AI SDK, Claude Code) converges on the same four verbs. Most confirmation dialogs collapse to yes/no, which forces a choice between blocking the agent's whole line of work (deny) or accepting it exactly as proposed (allow) — there's no way to say \"almost, but change this argument first.\" Edit-first is what turns the gate into a collaboration instead of a wall, which is why it is built to carry the same visual weight as Allow once rather than being a small link beside two real buttons.",
  evidence: ["OpenAI Agents SDK", "Microsoft Agent Framework", "LangChain", "Laravel AI SDK", "Claude Code"],
  anatomy: [
    {
      slot: "permission-prompt",
      note: "The dialog surface itself — an AlertDialogContent with this component's identity.",
    },
    {
      slot: "permission-prompt-header",
      note: "Title (the action, in plain language) and the optional reason.",
    },
    {
      slot: "permission-prompt-arguments",
      note: "The full call arguments, hidden until the expand toggle is pressed.",
    },
    {
      slot: "permission-prompt-arguments-expand",
      note: "The explicit expand control — carries aria-expanded and aria-controls.",
    },
    {
      slot: "permission-prompt-arguments-list",
      note: "The argument key/value pairs, rendered only once expanded.",
    },
    {
      slot: "permission-prompt-editor",
      note: "The inline editor Edit first swaps in, one field per argument.",
    },
    {
      slot: "permission-prompt-actions",
      note: "The footer holding all four verbs (or Back / Approve edited while editing).",
    },
    {
      slot: "permission-prompt-deny",
      note: "Terminal. The dialog's own Close path — the safest verb to press.",
    },
    {
      slot: "permission-prompt-always-allow",
      note: "Writes a standing grant. Emits the choice only — builds no grant UI.",
    },
    {
      slot: "permission-prompt-edit-first",
      note: "Same Button variant and size as Allow once — never subordinated.",
    },
    {
      slot: "permission-prompt-allow-once",
      note: "Terminal. Approves this one call; nothing persists past it.",
    },
  ],
  usage:
    "Reach for it anywhere an agent is about to take a consequential, hard-to-reverse action — sending a message, writing a file, spending money, running a command — and a human needs to see it before it happens. Pass `action` as a plain-language description of the call and `args` as the real arguments it will run with; never paraphrase or drop arguments to save space, since the truncate-then-expand pattern already handles length. Wire `onAlwaysAllow` to write a grant in your permission store, then let N9 `autonomy-selector` be where that grant gets reviewed and revoked — this component's job ends at emitting the choice.",
  dos: [
    {
      text: "Keep Edit first rendered with the same weight as Allow once — both are ways to keep the agent's work moving, and only Deny and Always allow read as different from that pair.",
      example: <EqualWeightVerbs />,
    },
    {
      text: "Pass the real, full arguments and let the built-in expand toggle handle length — never truncate or summarize them yourself before they reach this component.",
      example: <ArgumentsHiddenUntilExpanded />,
    },
  ],
  donts: [
    {
      text: "Don't demote edit-first to a text link or a smaller button beside two solid ones — PermissionPrompt's own Edit first always matches Allow once's variant and size, so this shape only happens if it's rebuilt by hand.",
      example: <SubordinateEditFirst />,
    },
    {
      text: "Don't render a grant list or a Revoke control inside the prompt when Always allow fires — that review-and-revoke surface belongs to N9 autonomy-selector, and duplicating it here creates two disagreeing views of the same grants.",
      example: <InlineGrantList />,
    },
  ],
  accessibility: {
    keyboard: [
      "Five tab stops in the default shape: the arguments toggle, then Deny, Always allow, Edit first, Allow once. Omit `args` and it is four. Switch into Edit first and the count becomes one textarea per argument plus Back and Approve edited — and Deny leaves the footer entirely while you are editing.",
      "The dialog is modal and traps focus, so Tab cycles inside it and never reaches the page behind. Clicking the backdrop does nothing: this is an alert dialog, and pointer dismissal is disabled by design.",
      "Escape closes the dialog without calling `onDeny`. Deny itself is an `AlertDialogCancel`, so pressing it both closes the surface and reports the refusal — but Escape reaches the same close path without the handler, which leaves the agent's call neither approved nor refused. Treat `onOpenChange(false)` as a refusal too if Escape has to count as a no.",
      "Only Deny closes the dialog — it is the `AlertDialogCancel`, the dialog's own Close. Allow once, Always allow, Edit first, Back and Approve edited are ordinary buttons that fire their handler and leave the dialog open, so drive `open` yourself if approving should dismiss the gate.",
      "Space and Enter activate every verb, and the arguments toggle. There are no accelerators — no A for allow, no D for deny — and no arrow keys anywhere.",
      "The footer is `flex-col-reverse` below the `sm` breakpoint, so on a narrow screen the visual order runs Allow once at the top down to Deny at the bottom while the tab order still runs Deny first. Reading order and tab order disagree there, and the most consequential verb is the one nearest the thumb.",
    ],
    screenReader: [
      'The surface is `role="alertdialog"`, named by `action` and described by `reason` when you pass one. Omit `reason` and the dialog has a name and no description, leaving the plain-language action to do all the work.',
      "The arguments toggle carries `aria-expanded` and `aria-controls`. The list it points at is not in the DOM while collapsed, so in the state a user meets first `aria-controls` references an id that does not exist.",
      'The toggle\'s own label carries the count and the state — "Show all 4 arguments" or "Show argument" collapsed, "Hide arguments" expanded. Expanding inserts the list silently; the toggle\'s state change is the only announcement.',
      "Arguments render as a definition list, each key a `<dt>` and each value a `<dd>`, both monospace with `break-all` on the value. A long path or a JSON blob is read as one unbroken run, so short, speakable keys are worth more here than they look.",
      'In the editor each argument gets a real `<label for>` whose text is the raw key. "path", "body", "recipient" is what the human hears, so pass keys you would be happy to read aloud.',
      "Nothing announces the swap between the four verbs and the editor. The footer's contents change under the user with no live region, so someone who pressed Edit first hears nothing until they navigate to find out what happened.",
    ],
    focus: [
      "Opening moves focus into the dialog — to its first tabbable element, which is the arguments toggle when `args` is present and Deny otherwise. Closing returns focus to whatever opened it.",
      "Pressing Edit first unmounts the button that had focus and the component places focus nowhere afterwards, leaving it to the dialog's focus trap rather than to the first argument field. A human who asked to edit still has to Tab into the editor they just opened; Back has the same shape in reverse.",
      "In edit mode there is no Close in the footer at all, so Escape becomes the only way out — and, per the keyboard notes, it reports nothing.",
      "Every control draws the vendored `Button`'s `focus-visible` ring, so focus is visible without a global style. The one exception is whatever you pass as `trigger`, which keeps its own.",
    ],
  },
  pitfalls: [
    "Wiring Allow once and Always allow to the exact same handler as a shortcut. They mean different things downstream — one grant should never be written when the human only meant to approve a single call.",
    "Treating Deny as needing confirmation or a second step before it closes. The whole point of making it the dialog's own Close path is that it is always safe and immediate to press.",
    "Building the standing-grant list, revoke buttons, or a denylist next to this component instead of routing to N9 autonomy-selector. A surface that can grant permanent access but never show or revoke it is a one-way door.",
    'Summarizing or eliding arguments before passing them in `args` (e.g. "…and 3 more fields"). The component\'s expand toggle exists specifically so the human can always reach the full, real arguments — pre-truncating upstream defeats it.',
  ],
};
