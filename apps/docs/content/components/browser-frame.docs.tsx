import type { ComponentDocs } from "@/lib/component-docs";
import { BrowserFrame } from "@/registry/super-ai/browser-frame";

export const BrowserFrameDocs: ComponentDocs = {
  whatItIs:
    "Browser chrome — window dots, back/forward/reload glyphs and an address bar — wrapped around content you supply. The chrome is a picture of a browser, not a working one: nothing in it is clickable, and the frame drives nothing.",

  whyItMatters:
    "An agent that browses has to show you what it saw, and a raw screenshot dropped into a results list reads as part of your own interface. The frame is the smallest device that says 'this came from somewhere else', which is what stops a captured page being mistaken for a product surface. Read from Vercel's Geist, where the same chrome does a marketing job; the job here is narrower and the accessibility rules follow from that difference.",

  evidence: [
    "Vercel Geist — the Browser component, positioned there for landing pages, docs and changelog posts.",
    "No reference-board sighting. Family Q carries no board evidence and does not claim any (see decisions.md D20).",
  ],

  anatomy: [
    { slot: "browser-frame", note: "The outer frame: one border, one radius, one clipping boundary." },
    {
      slot: "browser-frame-chrome",
      note: "The bar. Disappears entirely when there is no address and both dots and controls are off.",
    },
    { slot: "browser-frame-dots", note: "Three window dots, monochrome and aria-hidden." },
    { slot: "browser-frame-controls", note: "Back, forward and reload glyphs. Decorative, and aria-hidden." },
    {
      slot: "browser-frame-address",
      note: "The URL. Announced once from a single node; the two visible halves that make truncation work are hidden.",
    },
    {
      slot: "browser-frame-content",
      note: "The well. Ratio-locked, so nothing reflows when an image finishes decoding.",
    },
  ],

  usage:
    "Reach for it when the content inside came from outside your product — a browsing step, a computer-use capture, a fetched page rendered as a tool result. Do not reach for it to decorate your own UI: framing your product as a web page is a claim about provenance, and making that claim falsely is worse than a plain card. Pass the real URL if you have one; omit it if you do not, rather than passing a plausible-looking placeholder.",

  dos: [
    {
      text: "Pass the URL the content actually came from — it is the record of where the agent went.",
      example: <BrowserFrame address="https://vercel.com/geist/browser" ratio={16 / 7} />,
    },
    {
      text: "Show the loading state at the same ratio the content will occupy, so the page does not jump when it resolves.",
      example: <BrowserFrame address="https://vercel.com/geist/browser" ratio={16 / 7} loading />,
    },
    {
      text: "Drop to dots alone when the source is obvious from context and the URL would only add noise.",
      example: <BrowserFrame controls={false} ratio={16 / 7} />,
    },
  ],

  donts: [
    {
      text: "Do not invent an address to make a frame look finished. Omit it instead — an empty bar is honest, a fabricated URL is not.",
      example: <BrowserFrame ratio={16 / 7} />,
    },
    {
      text: "Do not use the inverted tone to mean anything. It is a surface for sitting against a light page, not a state.",
      example: <BrowserFrame address="https://vercel.com/geist/browser" tone="inverted" ratio={16 / 7} />,
    },
  ],

  accessibility: {
    keyboard: [
      "Zero tab stops. The address is a div and the controls are spans, so the component adds nothing to the tab order no matter which props are set.",
      "There are no activation keys, because there is nothing to activate. If you need the frame to be clickable, wrap it in your own link or button — that wrapper owns the focus ring, and the frame will not compete with it.",
      "The component has no disabled prop. A picture of a browser has no enabled state to remove.",
    ],
    screenReader: [
      "The address is read as plain text, once. It sits in a single sr-only span; the two visible halves that produce the middle truncation both carry aria-hidden, because accname concatenates adjacent name-from-content chunks with no separator and would otherwise announce a mangled URL.",
      "This is the deliberate divergence from Geist, which marks its whole chrome aria-hidden. That is right when the URL is illustrative marketing copy. Here it is data, and hiding it would leave a screen-reader user knowing a page was visited but not which one.",
      "Dots and controls carry aria-hidden and announce as nothing. They depict browser affordances the component does not have, so announcing them would describe capabilities that are not there.",
      "The frame contributes no role, name or landmark. Everything a screen reader gets from the content well comes from the child you pass — an image needs its own alt text, and an empty well announces as nothing at all.",
      "The loading state has no live region. A frame that flips from skeleton to content announces nothing; if that transition matters, put the announcement on whatever owns the fetch.",
    ],
  },

  pitfalls: [
    "Passing content that is not ratio-locked. The well locks its own aspect ratio, but a child sized in its own units will simply overflow and clip. Let the child fill the well (size-full, or object-cover on an image) rather than sizing it independently.",
    "Treating the address bar as an input. It is not editable and never will be — making it one would put a text field in a component whose entire premise is that it drives nothing.",
    "Assuming a long URL truncates from the end. It truncates in the middle: the host stays at the head and the final path segment is pinned. A path segment longer than 24 characters is not pinned at all, because pinning it would hold the string at full width and defeat the truncation.",
    "Reaching for it as a generic card. The frame is a provenance claim. Once it wraps your own UI it stops meaning 'from elsewhere', and every honest use of it in the same product gets quieter.",
  ],

  variants: [
    {
      prop: "tone",
      default: "surface",
      values: [
        {
          value: "surface",
          intent:
            "The frame sits among other content, in a results list or a tool result, and the capture should read as an inset of the page around it. The default, and right almost everywhere.",
        },
        {
          value: "inverted",
          intent:
            "The frame sits alone against a large expanse of page background, where surface chrome would melt into it and the edge of the capture would be lost. A choice about the surface behind the frame, never a signal about the content inside it.",
        },
      ],
    },
  ],

  insteadUse: [
    {
      component: "source-cards",
      when: "The user needs to know which pages the agent read, not what they looked like. source-cards shows the retrieved set as a ranked list of cards; a frame per source spends a screen on each one.",
    },
    {
      component: "citation-ref",
      when: "The point is to tie one claim in an answer to the passage that supports it. citation-ref is the inline marker whose preview carries the quoted chunk; a framed capture shows the whole page, not the sentence.",
    },
  ],
};
