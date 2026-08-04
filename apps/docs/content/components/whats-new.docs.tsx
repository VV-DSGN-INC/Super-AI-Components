import type { ComponentDocs } from "@/lib/component-docs";
import {
  BadgeOnTheTrigger,
  CtaLandsInTheFeature,
  CtaLinksToMarketing,
  UnreadDotAlone,
} from "./whats-new.examples";

/**
 * Seeded from docs/design-system/component-specs.md#l4-whats-new.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Live examples that need handlers live in the
 * ./whats-new.examples client sidecar and are referenced here as zero-prop
 * elements.
 */
export const WhatsNewDocs: ComponentDocs = {
  whatItIs:
    "A changelog browser in a dialog: a scrollable list of dated entries on the left, and the selected entry's hero media, body and call-to-action on the right. Its trigger carries a badge counting the entries the reader has not opened yet, and every entry can be unread independently of the others.",
  whyItMatters:
    "Pixlr What's New, Spline Updates and CapCut all keep a permanent changelog surface rather than firing an announcement per release, because a product that ships weekly cannot interrupt weekly. This is where an announcement goes when there is too much of it to say in one card — it is the escalation target for `feature-announcement`, which handles the single-item case. Two rules make it earn its place: every entry is dated, because a changelog without dates is marketing; and the call-to-action lands the reader inside the feature rather than on a page about the feature.",
  evidence: ["Pixlr What's New", "Spline Updates", "CapCut"],
  anatomy: [
    { slot: "whats-new", note: "The dialog surface holding both panes." },
    {
      slot: "whats-new-trigger",
      note: "Built-in trigger button. Replaceable via `trigger`, or omitted with `trigger={null}`.",
    },
    {
      slot: "whats-new-trigger-badge",
      note: "Unread count on the trigger, with the word 'unread' for screen readers.",
    },
    {
      slot: "whats-new-panes",
      note: "The two-pane frame — a tablist and its panel, not two loose columns.",
    },
    { slot: "whats-new-list", note: "Scrollable list of entries, newest first. This is the tablist." },
    { slot: "whats-new-entry", note: "One entry row: title, date, unread dot. This is a tab." },
    {
      slot: "whats-new-entry-date",
      note: "The date on the row, so scanning the list never needs the detail pane.",
    },
    {
      slot: "whats-new-unread",
      note: "The dot, paired with visually hidden text so colour is never the only signal.",
    },
    { slot: "whats-new-detail", note: "The panel for the selected entry. Scrollable and focusable." },
    { slot: "whats-new-media", note: "Hero media for the entry — the part that does the explaining." },
    { slot: "whats-new-stage", note: "Stage or version badge: New, Beta, Preview, v2.4." },
    { slot: "whats-new-date", note: "The entry date, repeated in the detail pane." },
    { slot: "whats-new-title", note: "Entry heading inside the detail pane." },
    { slot: "whats-new-body", note: "Long-form body under the summary." },
    { slot: "whats-new-cta", note: "The in-product action. A button, never a link out." },
  ],
  usage:
    "Reach for it when a release has more than one thing worth reading, or when people need a permanent place to catch up on what changed while they were away — a single item that deserves an interruption belongs in `feature-announcement` instead. Pass entries newest-first and keep `unread` in your own store, keyed by user: the component reports each entry the reader lands on through `onEntryRead` and writes nothing itself, so nothing is remembered unless you remember it.",
  dos: [
    {
      text: "Let the unread count ride on the trigger, and let opening one entry clear exactly that one dot.",
      example: <BadgeOnTheTrigger />,
    },
    {
      text: "Make the call-to-action do the thing — open the panel, switch the mode, start the flow.",
      example: <CtaLandsInTheFeature />,
    },
  ],
  donts: [
    {
      text: "Don't point the call-to-action at a blog post or a release-notes page; a changelog that sends you out of the app has failed twice.",
      example: <CtaLinksToMarketing />,
    },
    {
      text: "Don't ship the unread dot as a bare coloured circle — pair it with text, or the state does not exist for anyone who cannot see the colour.",
      example: <UnreadDotAlone />,
    },
  ],
  pitfalls: [
    "Expecting the component to remember what was read. It holds no storage: `onEntryRead` fires, you persist. Ignore the callback and the badge never moves.",
    "Assuming a read is only reported on click. The entry showing when the dialog opens has been read too, so it reports as well — otherwise a reader who opens the dialog, reads the top entry and closes it would carry that dot forever. Ignore the first call of an open session if you want clicks only.",
    "Looking for an `href` on the entry CTA. There is none, by design. If the news genuinely lives on a web page, put the link in the body and leave the CTA for the in-product action.",
    "Ordering entries by anything but date, newest first. The list is the reader's model of the release history, and the component does not sort for you.",
    "Dropping the hero media because the copy explains it well enough. On the reference board the media is what makes an entry legible in three seconds; a wall of text is why people close the dialog.",
  ],
};
