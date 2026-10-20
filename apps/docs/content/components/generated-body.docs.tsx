import type { ComponentDocs } from "@/lib/component-docs";
import {
  FallbackKeepsTheLastVersion,
  NoFallbackShowsTheAlertAlone,
  RecordTheLastGoodVersion,
  StillStreaming,
  StreamEndedEarly,
} from "./generated-body.examples";

/**
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Every live example needs state or a library, so all of
 * them live in the ./generated-body.examples client sidecar and are referenced
 * here as zero-prop elements.
 */
export const GeneratedBodyDocs: ComponentDocs = {
  whatItIs:
    "The body of a view written as an OpenUI Lang program. You hand it the text that has arrived so far and your own library; it renders what the library allows, line by line as the stream grows. When a finished program does not render, it says so, names the reason, offers Retry if you gave it a handler, and shows the last version that did render underneath. It keeps no history and runs no timers: you stream the program in and you keep the versions.",
  whyItMatters:
    "A model that rewrites a view in place will sometimes write one that cannot render. ChatGPT's canvas and Claude's artifacts panel regenerate a view where it stands and keep the previous version reachable, and v0 and Lovable draw a generated interface incrementally while it streams. Without this component each product wires up the same three decisions by hand: do not call a half-written program broken, do not paint a broken one, and do not lose the version that worked. Here they are fixed once, and the library you pass in is the only thing that decides what a program may contain.",
  evidence: ["ChatGPT canvas", "Claude artifacts", "v0", "Lovable"],
  anatomy: [
    {
      slot: "generated-body",
      note: "The root. Carries data-state (streaming, rendered, failed or empty) and aria-busy while a stream is open.",
    },
    {
      slot: "generated-body-content",
      note: "The rendered program. Absent when the finished program failed, so a broken body is never on screen.",
    },
    {
      slot: "generated-body-failure",
      note: "The status alert: This version did not render, plus the reason in words.",
    },
    {
      slot: "generated-body-retry",
      note: "The Retry button inside the alert. Present only when you pass onRetry.",
    },
    {
      slot: "generated-body-fallback",
      note: "The last version that rendered, under the alert. Present only when you pass fallbackProgram.",
    },
  ],
  usage:
    "Put it in the content area of a generated view, for example inside a view-frame. Pass `program` as the text accumulated so far, `library` from your own createLibrary call, and `streaming` while lines are still arriving. Set `streaming` to false only when the last line is in: that is the moment the body is judged. Keep the last good program yourself, using `onRender`, which fires once per finished program with { ok, errors }, and pass it back as `fallbackProgram`. Pass `onRetry` when asking again is possible. The body fails when the finished program names a component your library does not have, leaves a reference undefined, has no root, or breaks a component's argument types.",
  dos: [
    {
      text: "Pass the last version that rendered as `fallbackProgram`, so a failed rewrite leaves the reader with something to use.",
      example: <FallbackKeepsTheLastVersion />,
    },
    {
      text: "Record the last good program from `onRender`, which fires once per finished program, and feed it back in. The body keeps no versions of its own.",
      example: <RecordTheLastGoodVersion />,
    },
  ],
  donts: [
    {
      text: "Don't set `streaming` to false before the last line has arrived. A program cut off mid-stream leaves references undefined, and a finished program is judged as it stands.",
      example: <StreamEndedEarly />,
    },
    {
      text: "Don't mark a stream finished to see a partial result. While `streaming` is true the same cut-off program draws what has arrived and reports nothing.",
      example: <StillStreaming />,
    },
    {
      text: "Don't expect the valid part of a broken program to show. With no `fallbackProgram` the alert is the whole body.",
      example: <NoFallbackShowsTheAlertAlone />,
    },
  ],
  accessibility: {
    keyboard: [
      "The component adds one tab stop and only on a failure: the Retry button, when you pass onRetry. A rendered or streaming body adds none of its own.",
      "Retry is a real button, so Enter and Space activate it. There is no shortcut key and no Escape handling.",
      "Whatever your library renders brings its own tab stops. The fallback version is a second render of your library, so it brings its own too, after Retry.",
    ],
    screenReader: [
      'The failure is a `role="status"` region, polite rather than assertive, because it appears while the reader is already in a stream of changing content. It reads "This version did not render." and then the reason.',
      "The alert icon is `aria-hidden`; the words carry the failure. The default alert variant is used on purpose, because the destructive variant's description measured 4.49:1, under the 4.5:1 minimum.",
      "While a stream is open the root carries `aria-busy`. The body does not announce each line as it arrives, so a screen reader user hears the finished view or the failure, not the stream.",
      "The fallback is announced as ordinary content under a short label, Last version that rendered. Nothing says which version the reader is looking at once the view is rewritten and renders successfully, because the label is gone by then.",
    ],
    focus: [
      "Retry unmounts when the failure clears, and nothing restores focus. Move focus in your own `onRetry` if the reader should land somewhere specific.",
    ],
  },
  pitfalls: [
    "An unknown component name does not blank the program. The parser keeps the rest, which is why the body checks the parse errors and not only the root: a check on the root alone would paint the valid half of a broken program.",
    "Do not judge on the first render of a stream. Undefined references and unfinished lines are normal while lines are still coming, so the body reports nothing until `streaming` is false.",
    "`onRender` fires once per finished program. Changing the callback or re-rendering does not fire it again, but a new stream that ends with the same text does. Record versions by the program you passed, not by call count.",
    "The fallback is rendered with the same library and no streaming. If the library changed since that version rendered, the fallback can fail too, and it is drawn as it parses without a second alert.",
    'In development, @openuidev/react-lang mounts its inspector panel by itself unless `globalThis[Symbol.for("openui.devtools.autoMount")]` is set before the package loads. The registry item does not set it for you.',
  ],
  variants: {
    none: "The body renders one way. The only thing that changes it is the verdict on the program, which comes from the parse, not from a size or tone the caller picks. What a program may contain is decided by the library you pass in.",
  },
  insteadUse: [
    {
      component: "answer-block",
      when: "The reply is prose with sources, not a view. Answer-block puts citations at the claim and needs no program or library, while generated-body is for layouts a model composes from your components.",
    },
    {
      component: "view-frame",
      when: "You need the chrome (title, actions, footer) rather than the body. View-frame is fixed and never generated; generated-body goes inside its content area.",
    },
  ],
};
