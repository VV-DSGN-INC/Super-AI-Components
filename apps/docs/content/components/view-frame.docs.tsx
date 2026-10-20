import type { ComponentDocs } from "@/lib/component-docs";
import {
  AskBarInTheFoot,
  AskBarOverTheBody,
  FailureStaysInBody,
  ModesLiveInActions,
  SecondScrollerInBody,
} from "./view-frame.examples";

/**
 * Seeded from docs/design-system/component-specs.md#r3-view-frame.
 *
 * No "use client" here: this module is plain data read by a Server Component.
 * Live examples live in ./view-frame.examples and arrive as zero-prop elements.
 */
export const ViewFrameDocs: ComponentDocs = {
  whatItIs:
    "The fixed chrome around a generated view: a header with a title, a scope and freshness line and a row of actions, one scrolling body, an optional slot for an ask bar, and a footer naming where the view came from and which version it is. A model or script writes the body. Everything around it keeps the same shape every time.",
  whyItMatters:
    "ChatGPT's canvas and Claude's artifacts panel both open generated work beside the conversation in a surface with its own title, version and actions. The frame is what makes a generated view feel like a place rather than a longer message: the same controls sit in the same spots whatever the body holds, and a view that fails or reruns changes only the body. Keeping view logic out of the frame is what lets one chrome serve a table today and a board tomorrow.",
  evidence: ["ChatGPT canvas", "Claude artifacts panel"],
  anatomy: [
    { slot: "view-frame", note: "Root section. Fills its container's height, with a card surface." },
    { slot: "view-frame-header", note: "Wraps. Holds the title, the description and the actions." },
    {
      slot: "view-frame-title",
      note: "The visible heading. Never narrower than a 14rem floor, so actions wrap below it first.",
    },
    {
      slot: "view-frame-description",
      note: "Scope and freshness, for example the projects covered and when it last ran.",
    },
    {
      slot: "view-frame-actions",
      note: "End-aligned. Full width and wrapping below 768px, beside the title from 768px.",
    },
    {
      slot: "button",
      note: "A ViewFrameAction: a ghost icon button with a required label, 44px below 768px.",
    },
    { slot: "view-frame-content", note: "The one scroll region. Focusable and named." },
    { slot: "view-frame-foot", note: "In-flow slot for an ask bar. Renders nothing without children." },
    {
      slot: "view-frame-footer",
      note: "Origin text at one end, version label at the other. The origin truncates.",
    },
  ],
  usage:
    "Give the frame a container with a height and nothing else: a narrow pane beside the chat column for the docked view, the full width for a page. Pass `title` so the section has a name, and draw the visible heading with ViewFrameTitle. Render mode tabs, Undo, Rerun, Pin and Close yourself inside ViewFrameActions, using ViewFrameAction for the icon buttons. Put the view in ViewFrameContent, a skeleton there while it reruns, an alert with a Retry button there when it fails. Put an ask bar in ViewFrameFoot only when the view takes questions.",
  dos: [
    {
      text: "Render mode tabs panelless inside the actions. The frame has no idea which mode is showing.",
      example: <ModesLiveInActions />,
    },
    {
      text: "Keep the chrome on failure and put the alert and Retry inside the body, so Close and Undo still work.",
      example: <FailureStaysInBody />,
    },
    {
      text: "Put the ask bar in the foot, in flow, so it never covers the last row.",
      example: <AskBarInTheFoot />,
    },
  ],
  donts: [
    {
      text: "Don't float the ask bar over the body. It hides the rows it sits on and the body has no idea it is there.",
      example: <AskBarOverTheBody />,
    },
    {
      text: "Don't nest a second scroller inside the body. The body already scrolls, and two scrollbars mean two tab stops.",
      example: <SecondScrollerInBody />,
    },
  ],
  accessibility: {
    keyboard: [
      "The frame adds one tab stop of its own: the content region, which is focusable so a keyboard user can scroll it with the arrow keys. Tab order is the header's controls in source order, then the content region and whatever is inside it, then the foot, then the footer, which has no controls.",
      "Each ViewFrameAction is a native button: Enter and Space activate it. A disabled action leaves the tab order.",
      "Escape does nothing. The frame does not close itself, and it does not move focus when it opens or closes.",
      "Arrow keys scroll the content region only while it has focus. Mode tabs you render in the actions bring their own arrow key behaviour.",
    ],
    screenReader: [
      "The root is a section with a name, so it is a region landmark. The name comes from `title`, or from your `aria-labelledby` when you pass one, which replaces `title` entirely. With neither, the section is unnamed and is not exposed as a landmark.",
      "ViewFrameTitle is an h2. The level is fixed. If the frame sits under an h2 on your page, render your own heading in the header instead of ViewFrameTitle.",
      "Each ViewFrameAction is named by `label` through aria-label, and `label` is also set as the title for sighted hover. The name never depends on the tooltip.",
      'The content region is a named region, "View content" by default. Two frames on one page both announce that name, so pass an `aria-label` that says what the body holds.',
      "No live region wraps the body. A rerun that swaps in a skeleton, and a failure that swaps in an alert, are announced only if the content you render carries role status or role alert. The vendored Alert has role alert; a skeleton set has nothing, so give it a status.",
      "The footer is a footer element inside a section, which exposes no landmark. Its two text parts read in order: origin, then version.",
    ],
    focus: [
      "Nothing in the frame moves focus. When a view closes, return focus to whatever opened it, which is usually the card in the thread.",
      "When a rerun replaces the body, focus on the Rerun button stays where it is. If you unmount the button while it runs, focus falls to the document.",
    ],
  },
  pitfalls: [
    "The frame fills its container with h-full. Give it a parent with a definite height, or the body stops scrolling and the frame grows with its content.",
    "Do not add overflow to anything inside the body unless you remove it from the body. Two scroll regions inside each other trap the wheel and double the tab stops.",
    "ViewFrameFoot renders nothing at all without children, not an empty bar. A falsy child such as `false` or `null` counts as no children, but an empty fragment does not.",
    "A long title wraps rather than truncates, and the actions wrap onto their own row first. Keep titles short anyway. The title is the only thing naming the view.",
    "ViewFrameAction takes a single icon as its child. Putting text in it makes a wide button on a 44px target and the label is no longer the only name.",
  ],
  variants: {
    none: "The frame has no look to choose. Docked and page are the container the caller supplies, not a prop, and mode tabs, rerunning and failed are children the caller renders in slots the frame already has.",
  },
  insteadUse: [
    {
      component: "browser-frame",
      when: "The content is a page the agent visited, shown as external. Browser frame marks its content as not ours; view frame wraps a view this product generated and keeps its actions.",
    },
    {
      component: "artifact-shell",
      when: "You need the index of everything generated, with a sidebar and a grid. View frame holds one generated view, not the library of them.",
    },
  ],
};
