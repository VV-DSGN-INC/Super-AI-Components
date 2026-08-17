import type { ComponentDocs } from "@/lib/component-docs";
import {
  BodyBranchedOnMode,
  ModeSwitchWithoutNavigation,
  SameBodyBothWidths,
  SwapsContentOnSecondClick,
} from "./detail-view-shell.examples";

/**
 * Seeded from docs/design-system/component-specs.md#p2-detail-view-shell.
 * Plain data read by a Server Component.
 *
 * No "use client" here: component-docs.tsx destructures this object directly.
 * The shell is controlled, so every example needs `onOpenChange` at minimum —
 * a handler cannot cross the server/client boundary from this file, so the
 * examples live in the ./detail-view-shell.examples client sidecar and arrive
 * here as zero-prop elements.
 */
export const DetailViewShellDocs: ComponentDocs = {
  whatItIs:
    "The chrome around any record detail, in three opening modes: a centred dialog, a right-docked panel that leaves the collection live, and a plain container that fills its route. The body is two named slots — `attributes` for what the record is, `conversation` for what happened to it — collapsing to one column below 720px of measured container width.",
  whyItMatters:
    "How a record opens is a separate decision from how the collection is browsed, and treating it as one is what makes a shell reusable. Notion ships exactly this as a per-view setting — side peek, center peek and full page — and its three options map one-for-one onto these three modes. The distinction that earns its keep is overlay: because the collection behind stays interactive, clicking a second record swaps this panel's content instead of closing it, which turns triage from open-read-close-open into a single sweep. Only fullscreen owns a URL, and it owns it in the host — a detail shell that reaches for a router is a shell that works in one framework.",
  evidence: ["Notion", "ClickUp", "Airtable"],
  anatomy: [
    { slot: "detail-view-shell", note: "The frame. Carries `data-mode` so a consumer can style per mode." },
    { slot: "detail-content", note: "The measured element. Carries `data-size` — `wide` or `narrow`." },
    { slot: "detail-tabs", note: "Both tab levels: channel strip, and the collapsed Details/Activity pair." },
    { slot: "detail-fields", note: "The attributes list. A `<dl>` that nests its own two-to-one collapse." },
  ],
  usage:
    "Hold `open` and `mode` yourself, or install the `use-view-mode` contract to persist mode per entity. Put what the record *is* in `attributes` and what *happened to it* in `conversation`; omit `conversation` entirely for a one-column detail view. `collapse` picks what a narrow container does with the conversation — `tabs` (the default) or `stack`. In fullscreen the route is the open state, so `open` is ignored and the host owns the URL.",
  dos: [
    {
      text: "Let the same body render in all three modes — collapse is measured from the container, so nothing needs a per-mode variant.",
      example: <SameBodyBothWidths />,
    },
    {
      text: "Keep the collection mounted behind overlay mode; swapping content on a second click is the reason overlay exists.",
      example: <SwapsContentOnSecondClick />,
    },
  ],
  donts: [
    {
      text: "Don't branch the body on `mode`. A 480px popup and a 480px overlay are the same layout problem.",
      example: <BodyBranchedOnMode />,
    },
    {
      text: "Don't put routing inside the shell — fullscreen's URL belongs to the page that hosts it.",
      example: <ModeSwitchWithoutNavigation />,
    },
  ],
  accessibility: {
    keyboard: [
      "Escape closes the shell in popup mode (a real Dialog) and in overlay mode — but overlay's handler is bound to the `<aside>` itself, so it only fires while focus is **inside** the panel. Press Escape while working in the collection behind it and nothing happens. Fullscreen has no Escape at all; closing it is the host's route change.",
      "Popup mode ships no close button: `showCloseButton` is off, so Escape and an outside click are the only dismissals the shell provides. Put a close control in your `header` or a mouse user is stuck.",
      "The panes themselves are tab stops. `attributes`, the conversation body and the stacked body each carry `tabIndex={0}` so a scrolling region of plain text is keyboard-reachable (axe `scrollable-region-focusable`) — which means a one-column record with no controls still has one focus stop that does nothing but scroll.",
      "`DetailTabs` is one tab stop with a roving tabindex, at both levels. Left, Right, Up and Down all move **and** select, wrapping at both ends; there is no Home or End. When the container is narrow and there is more than one channel, two tablists are stacked and each is its own stop.",
      "Overlay mode has no focus trap and no scroll lock, deliberately — the collection behind is meant to stay operable, so Tab runs straight out of the panel and back into the page. If you need a trapped, dismiss-on-outside-click panel, that is popup mode.",
    ],
    screenReader: [
      'Popup mode is a dialog with a name either way: `ariaLabel` becomes its `aria-label`, and a visually-hidden title carries "Detail view" when you pass nothing. A visually-hidden description tells the user the opening mode can be changed from the header.',
      "Overlay mode is an `<aside>`, so it is a complementary landmark named by `ariaLabel` — reachable by landmark navigation while the collection stays live, which is the whole point of the mode.",
      "**Fullscreen mode's name goes nowhere.** The root is a plain `<div>` with an `aria-label`, and a div has no role for that label to attach to, so it is not exposed. Wrap it in your own named `<main>` or `<section>`, or give the route its own heading.",
      'Tabs fold their badge into the name — "Activity, 3" — because a count rendered as a badge is invisible otherwise. But the tabs carry no `aria-controls` and the panes carry no `role="tabpanel"`, so the tab-to-panel relationship is not programmatic: activating a tab changes content that assistive tech has no link to.',
      "The scrollable panes are focus stops with no role and no accessible name, so tabbing into one announces essentially nothing. Naming them is not something the shell can do for you — the content is yours.",
      "`DetailFields` stays a `<dl>` of `<dt>`/`<dd>` pairs in both layouts. The two-column form is a grid over `display: contents` wrappers, so the term/definition relationship survives the collapse rather than being flattened into a run of text.",
      "Stacked collapse adds an `<h2>` naming the channel, because no tab is naming that pane. Tabbed collapse has no heading — the tab is the name.",
      "Nothing announces a content swap. Clicking a second record in overlay mode replaces the whole body with no live region, so a screen-reader user is left reading a panel that quietly became a different record. Announce the change yourself, or move focus into the panel, when you swap.",
      "Crossing the 720px threshold rearranges the body silently too: `data-size` flips and the layout changes with no announcement.",
    ],
    focus: [
      "Popup mode is the only mode that manages focus. The Dialog moves focus in on open, traps it, and returns it to whatever opened it on close.",
      "Overlay and fullscreen move focus nowhere, on open or on close. Opening the panel leaves focus on the collection row that was clicked, so the panel has to be found by tabbing forward — and closing it unmounts a focused element and drops focus to `<body>`. Move focus to the panel's header on open and back to the row on close.",
      "The measured collapse can pull focus out from under the user: crossing 720px while focus is in the conversation pane replaces the two-column layout with a tablist, and the focused element goes with it.",
      "`DetailTabs` restores focus itself, re-querying `[data-tab]` on the next frame after selection.",
      "Tabs carry an explicit `focus-visible` ring. The scrollable panes do not — they are focus stops with no focus styling at all, so a keyboard user tabbing into the body sees nothing move.",
    ],
  },
  pitfalls: [
    "Collapse is driven by the measured width of `detail-content`, not the viewport. Testing by resizing the browser will not show you the narrow form inside a 480px panel — resize the panel, or drive the observer in a test.",
    "The shell starts narrow and only widens once measured. That pessimistic default is deliberate: one column renders correctly at any width, two columns in a 400px box does not, and the alternative is a visible flash of two columns on first paint.",
    "`useContainerWidth` returns a callback ref, not a ref object. Inside a portal the content mounts on a later pass, so a `useLayoutEffect` + ref object would attach to a node nobody is watching and measure never.",
    "Overlay mode is a plain `<aside>`, not a Sheet, and deliberately has no focus trap — the collection behind is meant to stay operable. If you need a trapped, dismiss-on-outside-click panel, that is popup mode.",
    "Level-2 channel tabs only appear with two or more channels. The reference app ships one, so that state is exercised in Storybook and tests rather than in a running screen; do not assume it is unused because you have not seen it.",
    "An empty `conversation` array behaves exactly like omitting the prop: the shell tests `channels.length > 0`, so both give a one-column body and the narrower frame. That is the intended behaviour, but it means a record whose comments simply have not loaded yet renders as a record that has none — pass a channel with placeholder content rather than an empty array while loading.",
  ],
};
