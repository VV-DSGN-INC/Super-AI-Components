import type { ComponentDocs } from "@/lib/component-docs";
import {
  HiddenHeaderKeepsTheAction,
  LoadingKeepsTheShape,
  OneActionInTheHeader,
  OpenLabelRepeatsTheTitle,
  OpenLabelStatesTheFact,
  SizeFitsTheContent,
  TooMuchForTheTile,
} from "./widget.examples";

/**
 * No "use client" here: this module is plain data read by a Server Component.
 * Every example with a handler lives in ./widget.examples and is referenced as
 * a zero-prop element.
 */
export const WidgetDocs: ComponentDocs = {
  whatItIs:
    "A fixed-size tile for one fact among same-sized siblings. It comes in three families: small is one grid cell, medium is two wide, large is two by two. A tile has an icon, a title, a short meta, one header action or a whole-tile open button, a body that clips, and a skeleton for the loading moment. It sets no width of its own and fills the cell its grid item gives it.",
  whyItMatters:
    "A glance surface only works when every tile is the same shape. Apple WidgetKit declares small, medium and large families instead of a free dimension, and analytics and workspace home screens tile their numbers the same way. Declaring the family makes each size a layout you can test at its exact size, where an elastic tile has no size to test. A tile that is also the entry to a bigger answer (open it, ask a follow-up) needs one control that covers it, and one name that carries the fact for a screen reader.",
  evidence: ["Apple WidgetKit", "Analytics dashboard tiles", "Workspace home screens"],
  anatomy: [
    {
      slot: "widget",
      note: "The tile: a small card with data-size set to small, medium or large. Fills its grid cell.",
    },
    {
      slot: "widget-header",
      note: "Icon, title, meta and the header action. Becomes screen-reader-only with hideHeader.",
    },
    { slot: "widget-title", note: "The fact's name. One line, truncates, never wraps." },
    { slot: "widget-meta", note: "A short qualifier beside the title, such as a period or a count." },
    { slot: "widget-action", note: "The one control, a WidgetAction icon button named by its label." },
    { slot: "widget-content", note: "The body. Clips at the tile edge and never scrolls." },
    {
      slot: "widget-open",
      note: "The whole-tile button, present only with onOpen. Overlays the card, first in tab order.",
    },
  ],
  usage:
    "Place a widget in a grid item that sets its width and height, and choose the family the content fills. Ship a type in only the sizes its content can fill: a single number belongs in small, a short list in medium, a list with progress in large. Give the tile either onOpen with an openLabel or a header action, never both. Pass loading while the data is on its way so the tile keeps its shape when it lands.",
  dos: [
    {
      text: "Write openLabel as the fact plus the follow-up it opens, because it is the only text a screen reader hears for the tile.",
      example: <OpenLabelStatesTheFact />,
    },
    {
      text: "Use a header action for one direct command and name it through the label prop. The tooltip repeats the name visually.",
      example: <OneActionInTheHeader />,
    },
    {
      text: "Pass loading and keep the same size. Only the body becomes a skeleton, so the tile does not change shape when data arrives.",
      example: <LoadingKeepsTheShape />,
    },
    {
      text: "With the header hidden, the action floats over the body and the body keeps clearance for it.",
      example: <HiddenHeaderKeepsTheAction />,
    },
    {
      text: "Pick the family that fills the content: three rows with progress want a large tile.",
      example: <SizeFitsTheContent />,
    },
  ],
  donts: [
    {
      text: "Don't repeat the title as openLabel. A reader then hears the title and never the number the tile exists to show.",
      example: <OpenLabelRepeatsTheTitle />,
    },
    {
      text: "Don't fit a list into a medium tile and expect it to scroll. The body clips, so the third run is lost; move to large or open a view.",
      example: <TooMuchForTheTile />,
    },
  ],
  accessibility: {
    keyboard: [
      "An openable tile is one tab stop, the open button, and it comes first in the tile. Enter and Space activate it.",
      "A tile with an action is one tab stop, the action button, inside the header (or floated over the body when the header is hidden).",
      "A tile with neither is not focusable. Nothing in the body is reachable because the body clips and does not scroll.",
      "There are no arrow-key shortcuts between tiles. Each tile is its own tab stop, so a grid of twelve openable tiles is twelve stops.",
    ],
    screenReader: [
      "The tile is a group named by its title through aria-labelledby, so the name survives hideHeader.",
      "With onOpen, the button's accessible name is openLabel alone. The header and body are aria-hidden so the fact is not read twice; only the group name (the title) is read first.",
      "WidgetAction's name is its label prop through aria-label. The tooltip appears on hover and focus and is never the only source of the name; the icon is aria-hidden.",
      "While loading the tile sets aria-busy and renders a status region reading Loading plus the title. When the body arrives nothing is announced, so a caller that needs the result read out supplies its own live region. With onOpen the status sits under aria-hidden and is not announced.",
    ],
    focus: [
      "Opening a tile moves focus wherever your onOpen sends it. The widget does not restore focus to the tile on return; the caller returns focus to the tile that opened the view.",
    ],
  },
  pitfalls: [
    "A body that runs past the tile is clipped silently. There is no scrollbar and no fade, so test the longest content you can really emit at the exact size.",
    "The open overlay covers the whole card, which is why onOpen and action exclude each other in the type. Content that needs its own links or buttons belongs in a view, not a tile.",
    "Width and breakpoint classes on the tile fight the grid. Size the grid item and let the tile fill it.",
    "With onOpen the body is hidden from assistive tech. Whatever the body shows must be in openLabel, or a screen reader user never learns it.",
    "The header action is 24px square, the system's compact icon button. Keep one per tile and keep it away from the tile edge it floats on.",
  ],
  variants: [
    {
      prop: "size",
      values: [
        { value: "small", intent: "One number or one status with a caption. Fits one grid cell." },
        { value: "medium", intent: "A figure with one supporting line or a short bar. Two cells wide." },
        { value: "large", intent: "A short list, such as runs with progress. Two cells wide and two tall." },
      ],
    },
  ],
  insteadUse: [
    {
      component: "entity-row",
      when: "The item is one row in a list of many. A widget is a same-sized tile among siblings, while entity-row is the icon, title and description row that lists use.",
    },
    {
      component: "stat-readout",
      when: "The facts are label and value pairs inside a panel. Stat-readout is a definition list with no tile, size family or open affordance.",
    },
  ],
};
