import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#p2-detail-view-shell.
 * Plain data read by a Server Component.
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
    },
    {
      text: "Keep the collection mounted behind overlay mode; swapping content on a second click is the reason overlay exists.",
    },
  ],
  donts: [
    {
      text: "Don't branch the body on `mode`. A 480px popup and a 480px overlay are the same layout problem.",
    },
    {
      text: "Don't put routing inside the shell — fullscreen's URL belongs to the page that hosts it.",
    },
  ],
  pitfalls: [
    "Collapse is driven by the measured width of `detail-content`, not the viewport. Testing by resizing the browser will not show you the narrow form inside a 480px panel — resize the panel, or drive the observer in a test.",
    "The shell starts narrow and only widens once measured. That pessimistic default is deliberate: one column renders correctly at any width, two columns in a 400px box does not, and the alternative is a visible flash of two columns on first paint.",
    "`useContainerWidth` returns a callback ref, not a ref object. Inside a portal the content mounts on a later pass, so a `useLayoutEffect` + ref object would attach to a node nobody is watching and measure never.",
    "Overlay mode is a plain `<aside>`, not a Sheet, and deliberately has no focus trap — the collection behind is meant to stay operable. If you need a trapped, dismiss-on-outside-click panel, that is popup mode.",
    "Level-2 channel tabs only appear with two or more channels. The reference app ships one, so that state is exercised in Storybook and tests rather than in a running screen; do not assume it is unused because you have not seen it.",
    "An empty `conversation` array behaves exactly like omitting the prop: the shell tests `channels.length > 0`, so both give a one-column body and the narrower frame. That is the intended behaviour, but it means a record whose comments simply have not loaded yet renders as a record that has none — pass a channel with placeholder content rather than an empty array while loading.",
  ],
};
