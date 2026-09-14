# Whats New

> A changelog browser in a dialog: a scrollable list of dated entries on the left, and the selected entry's hero media, body and call-to-action on the right. Its trigger carries a badge counting the entries the reader has not opened yet, and every entry can be unread independently of the others.

Layer: component · Family: L · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/whats-new.json` · Contract: `components/super-ai/whats-new.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/whats-new

## Why it matters

Pixlr What's New, Spline Updates and CapCut all keep a permanent changelog surface rather than firing an announcement per release, because a product that ships weekly cannot interrupt weekly. This is where an announcement goes when there is too much of it to say in one card — it is the escalation target for `feature-announcement`, which handles the single-item case. Two rules make it earn its place: every entry is dated, because a changelog without dates is marketing; and the call-to-action lands the reader inside the feature rather than on a page about the feature.

## When to reach for it

Reach for it when a release has more than one thing worth reading, or when people need a permanent place to catch up on what changed while they were away — a single item that deserves an interruption belongs in `feature-announcement` instead. Pass entries newest-first and keep `unread` in your own store, keyed by user: the component reports each entry the reader lands on through `onEntryRead` and writes nothing itself, so nothing is remembered unless you remember it.

## Variants

Not yet recorded.

## Instead use

Not yet recorded.

## Do

- Let the unread count ride on the trigger, and let opening one entry clear exactly that one dot.
- Make the call-to-action do the thing — open the panel, switch the mode, start the flow.

## Don't

- Don't point the call-to-action at a blog post or a release-notes page; a changelog that sends you out of the app has failed twice.
- Don't ship the unread dot as a bare coloured circle — pair it with text, or the state does not exist for anyone who cannot see the colour.

## Anatomy

- `whats-new`: The dialog surface holding both panes.
- `whats-new-trigger`: Built-in trigger button. Replaceable via `trigger`, or omitted with `trigger={null}`.
- `whats-new-trigger-badge`: Unread count on the trigger, with the word 'unread' for screen readers.
- `whats-new-panes`: The two-pane frame — a tablist and its panel, not two loose columns.
- `whats-new-list`: Scrollable list of entries, newest first. This is the tablist.
- `whats-new-entry`: One entry row: title, date, unread dot. This is a tab.
- `whats-new-entry-date`: The date on the row, so scanning the list never needs the detail pane.
- `whats-new-unread`: The dot, paired with visually hidden text so colour is never the only signal.
- `whats-new-detail`: The panel for the selected entry. Scrollable and focusable.
- `whats-new-media`: Hero media for the entry — the part that does the explaining.
- `whats-new-stage`: Stage or version badge: New, Beta, Preview, v2.4.
- `whats-new-date`: The entry date, repeated in the detail pane.
- `whats-new-title`: Entry heading inside the detail pane.
- `whats-new-body`: Long-form body under the summary.
- `whats-new-cta`: The in-product action. A button, never a link out.

## Accessibility

**Keyboard**

- Closed, it is one tab stop: the trigger — and none at all when you pass `trigger={null}` and drive `open` yourself.
- Open, it is three, plus the selected entry's call-to-action when it has one: the entry list (a roving tablist, so all of it is one stop however many entries there are), the scrollable detail pane, and the dialog's close button. Anything focusable inside `media` adds its own stops on top.
- The list is a vertical tablist: Up and Down move between entries, Home and End reach the ends, and focus loops past either end.
- Selection is manual, not automatic — `activateOnFocus` is left at its default of `false`. Arrowing through the list moves focus without switching the detail pane, and Enter or Space commits. `onSelect` and `onEntryRead` therefore do not fire while a keyboard user is browsing, which is the right behaviour but not the one most changelogs have.
- Escape closes the dialog, as does a click on the backdrop. Nothing here can be disabled: there is no `disabled` on an entry or on its CTA.
- The close button sits at the top right but is last in the DOM, so it is the final tab stop rather than the first.

**Screen reader**

- The trigger's unread count is never a bare number: the badge renders the count followed by visually hidden "unread", so it announces as "What's new, 3 unread".
- The two panes are a real tablist and tabpanel, with `aria-label="Updates"` on the list and each panel associated with its own tab — not two columns that merely look related.
- An entry's name is built from everything in the row: the title, then visually hidden "Unread" when it is unread, then the date. Unread survives as text rather than as a colour or an ARIA state, but it also means every entry announces its date, which makes a long list slow to arrow through.
- `stage` is a plain badge with no label of its own, so "Beta" arrives as a loose word ahead of the date.
- `media` is whatever you pass, and nothing wraps, labels or hides it. An `<img>` with no `alt` inside it announces as an unnamed image in the middle of the entry — the hero media is the part that does the explaining, so describing it is entirely on you.
- Nothing announces that the detail pane changed. Committing a different entry replaces the panel's whole contents with no live region anywhere in the component; the reader finds out by tabbing into the pane.
- The entry heading inside the pane is a fixed `<h3>` under the dialog's own title, so this contributes two heading levels you do not choose.

**Focus**

- Opening the dialog moves focus to the selected entry's tab — the first tabbable element inside it — and traps focus there. Closing returns focus to the trigger, unless you passed `trigger={null}`, in which case there is no return target and focus falls to `<body>`.
- Committing a different entry leaves focus on the tab and never moves it into the pane, so the reader is one Tab away from content that has silently changed underneath them.
- Every stop here paints a ring, the detail pane included: it carries `focus-visible:ring-ring focus-visible:ring-2` and draws it, verified by deleting those two classes and watching the story fail. This note previously said the pane had `outline-none` and no replacement; it does not. The tabs draw their own ring, and the CTA and close button inherit the shared `Button` one

## Pitfalls

- Expecting the component to remember what was read. It holds no storage: `onEntryRead` fires, you persist. Ignore the callback and the badge never moves.
- Assuming a read is only reported on click. The entry showing when the dialog opens has been read too, so it reports as well — otherwise a reader who opens the dialog, reads the top entry and closes it would carry that dot forever. Ignore the first call of an open session if you want clicks only.
- Looking for an `href` on the entry CTA. There is none, by design. If the news genuinely lives on a web page, put the link in the body and leave the CTA for the in-product action.
- Ordering entries by anything but date, newest first. The list is the reader's model of the release history, and the component does not sort for you.
- Dropping the hero media because the copy explains it well enough. On the reference board the media is what makes an entry legible in three seconds; a wall of text is why people close the dialog.

## Composition

- States: `entry-list`, `entry-detail`, `unread`, `entry-cta`
- Composes from this registry: nothing
- shadcn primitives: badge, button, dialog
- npm: lucide-react

## Evidence

Pixlr What's New, Spline Updates, CapCut
