import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#l5-shortcuts-sheet.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. Every live example for this component would
 * need its own open Dialog and would portal out of the docs page it is
 * illustrating, so no `.examples.tsx` sidecar is shipped — the dos and donts
 * are stated rather than rendered.
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
    },
    {
      text: "Include the binding that opens the sheet, so the one shortcut a user needs to find the rest is the one they leave knowing.",
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
    },
    {
      text: "Don't pass `title=\"\"` to hide the heading. The title is the dialog's accessible name — an empty one leaves screen-reader users with an unnamed modal they cannot identify.",
    },
    {
      text: "Don't list a binding here that the app does not actually handle. A cheatsheet is trusted absolutely on first read, and one wrong row costs more than the ten right ones beside it.",
    },
  ],
  pitfalls: [
    "There is no search. The spec calls for filtering by action name and this build does not have it — `sections` renders whole, and there is no `query` prop to add one through. Below roughly forty bindings the section headings carry the load; past that, expect users to scroll. The neighbouring `settings-dialog` shipped the equivalent (`search` / `onSearchChange`, `full-page` only) if you need a reference implementation.",
    "The scrolling list is a tab stop, so a short sheet still costs two tabs to traverse rather than one. That is deliberate: nothing inside the list is focusable, so without it a keyboard user could not scroll past the sheet's 80vh cap at all. If you are wrapping the sheet in your own chrome, count the stop.",
    "Known gap in right-to-left: `KbdGroup` is a plain inline flex row, so a chord reverses with the container — `⌘ ⇧ Z` paints as `Z ⇧ ⌘` under `dir=\"rtl\"`. Chords are written modifier-first in every locale. The fix belongs in the `kbd` primitive, not here.",
    "`trigger` goes to Base UI's `render` prop, not Radix's `asChild`. Pass a single element that accepts a ref and spreads its props — Base UI merges its open handler onto that element, and a fragment or a plain string will not work.",
    "The sheet is portaled and modal. In tests, query it from `document.body` rather than the story or page canvas; a `dir` or width wrapper placed around the trigger never reaches it, so set direction on the document and pass width through `className`.",
    "A row with `keys: []` renders the label with nothing opposite it. That is a reasonable way to list an unbound action, but it looks like a bug unless the section makes the intent obvious — say so in the label rather than leaving a blank column.",
    "The popup suppresses its open and close animation under `prefers-reduced-motion: reduce`; the backdrop's fade does not, because that class lives in the shared dialog primitive rather than in this component. If you copy the suppression to another dialog, copy the variant too — a bare `motion-reduce:animate-none` ties `data-open:animate-in` on specificity, loses the tie on source order, and silently does nothing.",
  ],
};
