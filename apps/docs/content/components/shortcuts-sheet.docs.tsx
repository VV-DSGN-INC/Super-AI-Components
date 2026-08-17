import type { ComponentDocs } from "@/lib/component-docs";
import {
  GroupedByTheAppsVocabulary,
  OneFlatSectionOfEverything,
  SheetDocumentsItsOwnBinding,
  UnnamedSheet,
} from "./shortcuts-sheet.examples";

/**
 * Seeded from docs/design-system/component-specs.md#l5-shortcuts-sheet.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Live examples live in the
 * ./shortcuts-sheet.examples client sidecar and arrive here as zero-prop
 * elements. Each one is driven by its own `trigger` rather than an `open`
 * prop, which is what makes a portaled modal illustrable inline: nothing
 * covers the docs page until the reader opens it.
 */
export const ShortcutsSheetDocs: ComponentDocs = {
  whatItIs:
    "A modal cheatsheet of every key binding in the app, grouped under the app's own section names. Each row is one action and the keycaps that trigger it, rendered with the `kbd` primitive. It is read-only: nothing in the list is clickable, and the sheet's only control is the close button.",
  whyItMatters:
    "A keyboard-driven product is only keyboard-driven for the people who know the keys, and the keys are the one part of an interface that is invisible by definition. Descript, CapCut, Spline and Figma all answer this the same way — one overlay, one binding, usually the one the sheet itself documents — because a shortcuts page that lives in the docs site is a page nobody reads mid-task. Grouping is what makes it a reference rather than a wall: past about twenty bindings a flat alphabetical list is slower to scan than trial and error.",
  evidence: ["Descript", "CapCut", "Spline", "Figma", "Tripo"],
  anatomy: [
    {
      slot: "shortcuts-sheet",
      note: "The dialog itself. It renders in a portal at the end of the document, traps focus while open, and is capped at 80% of the viewport height so the list scrolls rather than the page.",
    },
    {
      slot: "shortcuts-list",
      note: "The scrolling body, and a tab stop of its own: it is the only way a keyboard user reaches a binding that is below the fold, since nothing inside the list is focusable.",
    },
    {
      slot: "shortcuts-section",
      note: "One titled group. The heading is a real h3, so a screen-reader user can jump between groups instead of reading every row.",
    },
    {
      slot: "shortcuts-row",
      note: "One binding: the action name on the leading side, the keycaps on the trailing side, separated by a rule that is dropped on the last row of each group.",
    },
    {
      slot: "kbd",
      note: "One keycap, from the A1 primitive. Rows compose it rather than styling their own, so a keycap in this sheet and a keycap inline in prose are the same object.",
    },
    {
      slot: "dialog-close",
      note: "The dismiss button, and the second and last stop in the focus ring. Closing returns focus to whatever opened the sheet.",
    },
  ],
  usage:
    "Mount it once in the app shell and bind it to the key it documents — `⌘ /` or `?` is the convention, and putting that binding in the list is the cheapest way to teach it. Hand it `sections` in the order your app talks about itself: the same nouns as your menus, not an alphabetical dump of the command registry. You can drive it either way — pass a `trigger` element and let it manage its own open state, or hold `open` yourself and dismiss through `onOpenChange`, which is what a global hotkey handler needs. Set `title` when the sheet is about something other than the keyboard; the spec's controls-primer framing ('View your model') is that same list under a different name.",
  dos: [
    {
      text: "Group by the app's own vocabulary — the section names should read like your menu bar, because that is the map the user already has.",
      example: <GroupedByTheAppsVocabulary />,
    },
    {
      text: "Include the binding that opens the sheet, so the one shortcut a user needs to find the rest is the one they leave knowing.",
      example: <SheetDocumentsItsOwnBinding />,
    },
    {
      text: "Keep action names to a verb and a noun; the two-column scanline is what makes a long list readable, and a label that wraps breaks it.",
    },
    {
      text: "Write the keys the way the platform paints them — the glyphs (⌘, ⇧, ⌥, ↵) on macOS, the words (Ctrl, Shift, Alt, Enter) elsewhere. The component renders the strings you give it and does not translate between platforms.",
    },
  ],
  donts: [
    {
      text: "Don't put anything actionable in a row. This is a reference the user reads and dismisses; a row that runs the command turns it into a command palette, which is a different component with different focus behaviour.",
    },
    {
      text: "Don't ship one flat section called 'Shortcuts'. Sectioning is the whole value at any realistic binding count, and one group of sixty rows is the failure mode the pattern exists to prevent.",
      example: <OneFlatSectionOfEverything />,
    },
    {
      text: "Don't pass `title=\"\"` to hide the heading. The title is the dialog's accessible name — an empty one leaves screen-reader users with an unnamed modal they cannot identify.",
      example: <UnnamedSheet />,
    },
    {
      text: "Don't list a binding here that the app does not actually handle. A cheatsheet is trusted absolutely on first read, and one wrong row costs more than the ten right ones beside it.",
    },
  ],
  accessibility: {
    keyboard: [
      "**This component binds no keys.** It is the surface that documents your shortcuts and it registers none of them, including the one that opens it. There is no `?` handler, no `⌘/` handler, no hotkey prop — you hold `open` and wire the binding yourself. A sheet mounted with only a `trigger` is reachable by mouse and by Tab, and by no keyboard shortcut at all.",
      "Open, it is exactly **two** tab stops however many bindings it lists: the scrolling list, then the close button. Nothing inside the list is focusable — rows are `li`, keycaps are `kbd`, and `Kbd` sets `pointer-events-none` — so the list's own `tabIndex={0}` is the only way to reach a binding below the fold. That stop is not overhead; without it a sixty-binding sheet would be unscrollable past its 80vh cap.",
      "Tab cycles between those two and does not escape: the dialog is modal and Base UI traps focus.",
      "Once the list has focus, Arrow Up/Down, Page Up/Down, Home and End scroll it. From the close button they do nothing — a keyboard user who tabs one stop too far has to Shift+Tab back before they can scroll.",
      "Escape closes. There is no other dismissal key and no key that closes and re-runs the shortcut you were reading.",
      "The `trigger` you pass keeps its own place in the page's tab order and its own activation keys — it is your element, merged with Base UI's open handler through `render`.",
    ],
    screenReader: [
      'The dialog\'s accessible name is `title`, defaulting to "Keyboard Shortcuts", rendered as a real `h2` by the dialog primitive. `title=""` produces a modal with no name at all.',
      'The scrolling list is a `<section>` named "Shortcut list", which makes it a `region` landmark as well as a tab stop. The element choice is load-bearing: a `div` would be role `generic`, ARIA prohibits naming a `generic` element, and the stop would arrive unnamed. Its name is deliberately not the sheet\'s title, which would make the region announce its own container a second time.',
      "The per-group `<section>`s are unnamed and so are not landmarks — the grouping is carried by their `h3` headings instead, which is what lets a screen-reader user jump between groups rather than read all sixty rows. Those `h3`s sit under the dialog's `h2` with nothing in between, so the level order inside the sheet is sound.",
      'Each group\'s rows are a real `ul`/`li`, so a group announces as "list, 12 items" and each row reads label then keycaps.',
      '**The keycaps are the weak point, and it collides with the advice above.** Each key is its own bare `<kbd>` with no joining text and no `aria-label` anywhere on the row or the group. A chord written as `["⌘", "⇧", "Z"]` is three elements containing three symbol characters — and `⌘` is U+2318 PLACE OF INTEREST SIGN, which screen readers announce as its Unicode name, as nothing, or as a beat of silence depending on verbosity settings. The same binding written as `["Cmd", "Shift", "Z"]` reads correctly everywhere. So the platform-glyph convention this page recommends for sighted macOS users is the version that degrades worst for everyone else. If your audience includes screen-reader users, either write the words or add your own spoken form — nothing in the component supplies one.',
      '`keys: []` renders the label with an empty keycap group opposite it, and nothing says "unbound". The row simply announces as its label, which is indistinguishable from a binding whose keycaps failed to render — say it in the label instead.',
      "Nothing in the sheet is a live region, and nothing needs to be: it is read-only and its contents never change while it is open.",
    ],
    focus: [
      "Opening focuses the **shortcut list**, not the close button — Base UI focuses the first tabbable element inside the popup, and the list is rendered before the close button. That is the right landing: a user who opens the sheet can immediately scroll it.",
      "Closing returns focus to whatever had it when the sheet opened. With a `trigger` that is the trigger. Driven by a global hotkey with no trigger, it is whatever the user was working in — which is usually the right answer, and is worth checking if your hotkey handler moves focus before it sets `open`.",
      "The scrolling list ships its own `focus-visible:ring-2`, so the first stop is visibly focused. The close button is a vendored `Button` and ships a ring too.",
      "The sheet is portaled to the end of the document, so a `dir` or width wrapper around your trigger never reaches it — set direction on the document and pass width through `className`.",
    ],
  },
  pitfalls: [
    "There is no search. The spec calls for filtering by action name and this build does not have it — `sections` renders whole, and there is no `query` prop to add one through. Below roughly forty bindings the section headings carry the load; past that, expect users to scroll. The neighbouring `settings-dialog` shipped the equivalent (`search` / `onSearchChange`, `full-page` only) if you need a reference implementation.",
    "The scrolling list is a tab stop, so a short sheet still costs two tabs to traverse rather than one. That is deliberate: nothing inside the list is focusable, so without it a keyboard user could not scroll past the sheet's 80vh cap at all. If you are wrapping the sheet in your own chrome, count the stop.",
    'Known gap in right-to-left: `KbdGroup` is a plain inline flex row, so a chord reverses with the container — `⌘ ⇧ Z` paints as `Z ⇧ ⌘` under `dir="rtl"`. Chords are written modifier-first in every locale. The fix belongs in the `kbd` primitive, not here.',
    "`trigger` goes to Base UI's `render` prop, not Radix's `asChild`. Pass a single element that accepts a ref and spreads its props — Base UI merges its open handler onto that element, and a fragment or a plain string will not work.",
    "The sheet is portaled and modal. In tests, query it from `document.body` rather than the story or page canvas; a `dir` or width wrapper placed around the trigger never reaches it, so set direction on the document and pass width through `className`.",
    "A row with `keys: []` renders the label with nothing opposite it. That is a reasonable way to list an unbound action, but it looks like a bug unless the section makes the intent obvious — say so in the label rather than leaving a blank column.",
    "The popup suppresses its open and close animation under `prefers-reduced-motion: reduce`; the backdrop's fade does not, because that class lives in the shared dialog primitive rather than in this component. If you copy the suppression to another dialog, copy the variant too — a bare `motion-reduce:animate-none` ties `data-open:animate-in` on specificity, loses the tie on source order, and silently does nothing.",
  ],
};
