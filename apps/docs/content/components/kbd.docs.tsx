import type { ComponentDocs } from "@/lib/component-docs";
import { Kbd, KbdGroup } from "@/registry/super-ai/kbd";

/**
 * Seeded from docs/design-system/component-specs.md#a1-kbd.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). The examples below are inlined rather than split into
 * an .examples.tsx sidecar because a keycap is pure markup — no handlers, no
 * state, nothing that has to cross the client boundary. The sidecar exists
 * for interactive examples; this component has no interaction to show.
 */
export const KbdDocs: ComponentDocs = {
  whatItIs:
    "The small monospace keycap used to print a keyboard shortcut in the interface — one chip per key, optionally grouped into a chord. It is two elements and nothing else: `Kbd`, a semantic `<kbd>` styled as a key, and `KbdGroup`, the inline row that spaces a set of them. Both take plain DOM props, so the keys themselves, and whatever joins them, are content you pass in.",
  whyItMatters:
    "Keyboard shortcuts are how a tool stops being a toy, and a product only earns them if it can show them: in menu rows, in tooltips, and in the cheatsheet people open in their first hour. Descript, CapCut, Spline and Playground all print keys this way, which is why the keycap is a registry primitive rather than a one-off span — a shortcut rendered three different sizes in three different places reads as three different products. Its second job is quieter: because every key in the app comes out of one component, restyling keys later is one file rather than a search for grey rounded spans.",
  evidence: ["Descript", "CapCut", "Spline", "Playground"],
  anatomy: [
    {
      slot: "kbd",
      note: "A single keycap — a real `<kbd>` element. Fixed 20px tall with a 20px minimum width, so a one-character key is square and a named key grows sideways from the same baseline.",
    },
    {
      slot: "kbd-group",
      note: "The inline row around a chord. Supplies the 4px gap and nothing else — the `+` or the word `then` between caps are children you write.",
    },
  ],
  usage:
    "Reach for it wherever a shortcut is being shown rather than performed: the trailing slot of a menu row, the end of a tooltip, a row in the shortcuts sheet, an inline hint under a composer. One `Kbd` per key, wrapped in a `KbdGroup` once there is more than one. Then decide which of the two postures you are in, because it changes the markup: a shortcut sitting next to a control that already does the job is decoration, and the group should carry `aria-hidden`; a shortcut in a cheatsheet is the content of its row, and hiding it would empty the page. If you are listing more than a handful, you want `shortcuts-sheet`, which owns the sectioning and the dialog and composes this component for the keys.",
  dos: [
    {
      text: "Write the joiner explicitly and consistently — a `+` for keys held together, the word then for keys pressed in turn.",
      example: (
        <div className="flex flex-col gap-2 text-sm">
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <span className="text-xs">+</span>
            <Kbd>⇧</Kbd>
            <span className="text-xs">+</span>
            <Kbd>Z</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>G</Kbd>
            <span className="text-xs">then</span>
            <Kbd>L</Kbd>
          </KbdGroup>
        </div>
      ),
    },
    {
      text: "Put aria-hidden on the group when the shortcut is a hint beside a control that already performs the action, and leave it announced when the keys are the content of the row.",
      example: (
        <div className="flex w-full max-w-xs flex-col gap-3 text-sm">
          <span className="flex items-center gap-2 rounded px-2 py-1.5">
            <span>New chat</span>
            <KbdGroup aria-hidden="true" className="ml-auto">
              <Kbd>⌘</Kbd>
              <Kbd>N</Kbd>
            </KbdGroup>
          </span>
          <span className="flex items-center justify-between border-t py-2">
            <span>New chat</span>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <span className="text-xs">+</span>
              <Kbd>N</Kbd>
            </KbdGroup>
          </span>
        </div>
      ),
    },
  ],
  donts: [
    {
      text: "Do not map an unfiltered key list onto caps — a key that resolves to an empty string renders as a blank tile, not as nothing.",
      example: (
        <div className="flex items-center gap-2 text-sm">
          <KbdGroup>
            <Kbd />
            <span className="text-xs">+</span>
            <Kbd>N</Kbd>
          </KbdGroup>
        </div>
      ),
    },
    {
      text: "Do not use a keycap for anything you cannot press. A key-shaped chip is a promise about the keyboard; spending it on a mode name or a model name teaches people the promise is worthless.",
      example: (
        <div className="flex items-center gap-2 text-sm">
          <Kbd>Draft</Kbd>
          <Kbd>gpt-4o</Kbd>
        </div>
      ),
    },
  ],
  accessibility: {
    keyboard: [
      "Nothing here is focusable. `Kbd` renders a `<kbd>` and `KbdGroup` a `<span>`, neither of which takes a tab stop, so a cheatsheet of forty shortcuts adds nothing to the tab order.",
      "The cap is `pointer-events-none` and `select-none`. That is what lets a hint sit inside a menu button without swallowing the click, and it is also why nobody can select the shortcut text to copy it out of a cheatsheet.",
      "No key handlers are bound anywhere. Printing `⌘` and `N` does not make ⌘N do anything — registering the shortcut is entirely the host's job, and nothing checks that the printed keys and the bound keys agree.",
    ],
    screenReader: [
      '`<kbd>` carries no implicit ARIA role, so a cap announces as its own text content and nothing more. A glyph modifier is read as whatever the screen reader calls that character — `⌘` is commonly announced as "place of interest sign", or as nothing — so pass a spelled-out modifier, or an sr-only word beside the glyph, when the announcement has to be understood.',
      'Whether the keys are announced at all is a call-site decision the component does not make for you. `KbdGroup` takes plain DOM props, so a hint beside a control that already performs the action takes `aria-hidden="true"` and a cheatsheet row leaves it announced. Nothing warns you when you pick the wrong one.',
      'The joiner is your markup, not the component\'s, so a chord with no `+` and no "then" between the caps announces as an undifferentiated run of key names. "⌘ ⇧ Z" reads identically whether the keys are held together or pressed in turn.',
      "An empty `Kbd` announces as nothing while still painting a visible box. That is the reverse of the usual failure — the blank tile is obvious in a screenshot and invisible to a screen reader.",
    ],
  },
  pitfalls: [
    "There is no joiner API. `KbdGroup` supplies a gap, not a `+` and not the word then, so the difference between a chord and a sequence lives entirely in text a caller wrote. Two teams will spell it two ways unless you pick one and put it in review.",
    "There is no platform awareness either. The component prints exactly the children it is given, so a hard-coded ⌘ is simply wrong on Windows — resolve the modifier at the call site and pass the resulting glyph in.",
    '`KbdGroup` is a bare inline-flex, so under `dir="rtl"` the caps lay out from the right and a chord renders in reverse order. Key order is a keyboard convention rather than a reading order, so pin `dir="ltr"` on your group in RTL layouts until the primitive does it for you.',
    "The cap is `pointer-events-none` and `select-none`. That is deliberate — it is what lets a hint sit inside a menu button without swallowing the click — but it also means nobody can select the shortcut text to copy it out of a cheatsheet.",
    "This is not shadcn/ui's `kbd`, and the difference is a contrast fix: upstream pairs `text-muted-foreground` with `bg-muted`, which measures 4.34:1 against a 4.5:1 minimum, so this version uses `text-foreground` on the same fill. If you restyle the cap with a background of your own, rebind the foreground token rather than putting the muted colour back.",
    "The cap is a fixed 20px tall with no `whitespace-nowrap`. A named key like Right Arrow is fine on its own, but squeezed by a narrow row it wraps inside a box that cannot grow and the second line escapes the border. Give long keys room, or shorten the label sharing the row.",
  ],
};
