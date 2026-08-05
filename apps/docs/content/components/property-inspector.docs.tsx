import type { ComponentDocs } from "@/lib/component-docs";
import { BadEmptyShrug, BadRowWithoutReset, GoodTwoScopes, GoodUsefulEmpty } from "./property-inspector.examples";

/**
 * Seeded from docs/design-system/component-specs.md#i2-property-inspector.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`,
 * etc. directly. Live examples live in the sibling
 * "property-inspector.examples.tsx" client module and are referenced here as
 * zero-prop elements.
 */
export const PropertyInspectorDocs: ComponentDocs = {
  whatItIs:
    "The panel beside a canvas that edits whatever is selected — width, type size, blur, opacity — grouped into collapsible sections. Every row is a `field-row` (A6) and every reset is a `reset-affordance` (A11), so an inspector lines up on the same label / control / unit / reset grid as the generation panels elsewhere in the system. What it shows is driven by the selected element's type, and it has a real view for the case where nothing is selected at all.",
  whyItMatters:
    "CapCut, Canva, Spline and Tripo all ship this panel and converge on the same three decisions, which is why it is one component rather than one per editor. Content is selection-driven: there is a variant per element type, not a different panel per tool. There are two reset scopes, not one — a group reset on each section header and a row reset at the end of each row — because clearing a whole section is a different intent from putting one value back. And sections remember their collapsed state per element type, so a user who never wants to see Layout for text is not forced to re-collapse it every time they select an image.",
  evidence: ["CapCut", "Canva", "Spline", "Tripo"],
  anatomy: [
    { slot: "property-inspector", note: "Root region, labelled by its own title. Carries `data-element-type` for whatever is selected." },
    { slot: "property-inspector-header", note: "The panel title plus the live selection summary." },
    {
      slot: "property-inspector-selection",
      note: "What is selected, as a `role=\"status\"` line — it is the only thing that names which variant you are looking at, so it announces rather than swapping silently.",
    },
    { slot: "property-inspector-sections", note: "The stack of sections for the current element type." },
    {
      slot: "property-inspector-section",
      note: "One collapsible group, carrying `data-section-id` and `data-state` open/closed.",
    },
    {
      slot: "section-header",
      note: "A5, composed. Its trigger collapses the group; its action slot holds the group-scope reset.",
    },
    { slot: "property-inspector-section-rows", note: "The section's rows, unmounted while the group is collapsed." },
    {
      slot: "field-row",
      note: "A6, composed — one per property. Keeps its own slot so the shared grid is visible in the DOM.",
    },
    {
      slot: "field-row-reset",
      note: "A6's trailing slot, permanently occupied by the row-scope `reset-affordance`.",
    },
    {
      slot: "reset-affordance",
      note: "A11, at `scope=\"group\"` in a section header and `scope=\"row\"` in every row. Degrades to `reset-affordance-dot` on a collapsed group.",
    },
    { slot: "property-inspector-empty", note: "Shown when nothing is selected: one line of guidance plus whatever stays editable." },
    { slot: "property-inspector-empty-content", note: "Document- or canvas-level rows that survive an empty selection." },
  ],
  usage:
    "Reach for it for any canvas, timeline or scene editor where selecting an object changes what can be edited. Key `sections` by element type and pass the selected type in — the variant is a data lookup, so a new element type is a new key rather than a new branch. Give every section an `onReset` when its rows can drift, and give every row one: the two scopes serve different intents and one does not stand in for the other. Give the empty state an `emptyContent` of canvas- or document-level rows; an inspector with nothing selected is the panel a user looks at most, not a gap to apologise for.",
  dos: [
    {
      text: "Ship both reset scopes — a group reset on the section header and a row reset at the end of every row.",
      example: <GoodTwoScopes />,
    },
    {
      text: "Keep something editable when nothing is selected — canvas size, grid, background — so the default view of the panel still does work.",
      example: <GoodUsefulEmpty />,
    },
  ],
  donts: [
    {
      text: "Don't hand-roll the rows and leave the group reset as the only way back; putting one value right should not cost the rest of the section.",
      example: <BadRowWithoutReset />,
    },
    {
      text: "Don't let the empty state be a shrug — a line that says there is nothing to show teaches the user nothing and wastes the panel.",
      example: <BadEmptyShrug />,
    },
  ],
  pitfalls: [
    "Storing collapsed state per section instead of per element type. Collapsing Layout for a text object then silently collapses it for an image, and the user re-expands the same section all day. The inspector keys its memory `elementType -> sectionId`; a host that persists the state through `onSectionOpenChange` must key it the same way.",
    "Branching on element type at the call site instead of adding a key to `sections`. The moment one editor forks, the variants drift — different section order, different labels, different reset behaviour — and the panel stops being one component.",
    "Passing `data-slot` down to a composed `field-row`, `section-header` or `reset-affordance`. Each of those spreads `...props` after its own attributes, so a call-site `data-slot` silently erases theirs and every test and style keyed to the shared grid stops matching.",
    "Expecting to reset a collapsed group. A11 degrades a collapsed group's reset to a dot, so the change still signals but the control is gone until the section is expanded — deliberate, and the reason the dot is paired with screen-reader text rather than left to colour alone.",
    "Deriving a section's `state` from nothing. A group reset that is always enabled tells the user nothing about whether the section has drifted; compute it from the same defaults the row resets use.",
  ],
};
