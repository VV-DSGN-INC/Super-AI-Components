# Widget

> A fixed-size tile for one fact among same-sized siblings. It comes in three families: small is one grid cell, medium is two wide, large is two by two. A tile has an icon, a title, a short meta, one header action or a whole-tile open button, a body that clips, and a skeleton for the loading moment. It sets no width of its own and fills the cell its grid item gives it.

Layer: component · Family: R · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/widget.json` · Contract: `components/super-ai/widget.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/widget

## Why it matters

A glance surface only works when every tile is the same shape. Apple WidgetKit declares small, medium and large families instead of a free dimension, and analytics and workspace home screens tile their numbers the same way. Declaring the family makes each size a layout you can test at its exact size, where an elastic tile has no size to test. A tile that is also the entry to a bigger answer (open it, ask a follow-up) needs one control that covers it, and one name that carries the fact for a screen reader.

## When to reach for it

Place a widget in a grid item that sets its width and height, and choose the family the content fills. Ship a type in only the sizes its content can fill: a single number belongs in small, a short list in medium, a list with progress in large. Give the tile either onOpen with an openLabel or a header action, never both. Pass loading while the data is on its way so the tile keeps its shape when it lands.

## Variants

### size

- `small`: One number or one status with a caption. Fits one grid cell.
- `medium`: A figure with one supporting line or a short bar. Two cells wide.
- `large`: A short list, such as runs with progress. Two cells wide and two tall.

## Instead use

- **entity-row**: The item is one row in a list of many. A widget is a same-sized tile among siblings, while entity-row is the icon, title and description row that lists use.
- **stat-readout**: The facts are label and value pairs inside a panel. Stat-readout is a definition list with no tile, size family or open affordance.

## Do

- Write openLabel as the fact plus the follow-up it opens, because it is the only text a screen reader hears for the tile.
- Use a header action for one direct command and name it through the label prop. The tooltip repeats the name visually.
- Pass loading and keep the same size. Only the body becomes a skeleton, so the tile does not change shape when data arrives.
- With the header hidden, the action floats over the body and the body keeps clearance for it.
- Pick the family that fills the content: three rows with progress want a large tile.

## Don't

- Don't repeat the title as openLabel. A reader then hears the title and never the number the tile exists to show.
- Don't fit a list into a medium tile and expect it to scroll. The body clips, so the third run is lost; move to large or open a view.

## Anatomy

- `widget`: The tile: a small card with data-size set to small, medium or large. Fills its grid cell.
- `widget-header`: Icon, title, meta and the header action. Becomes screen-reader-only with hideHeader.
- `widget-title`: The fact's name. One line, truncates, never wraps.
- `widget-meta`: A short qualifier beside the title, such as a period or a count.
- `widget-action`: The one control, a WidgetAction icon button named by its label.
- `widget-content`: The body. Clips at the tile edge and never scrolls.
- `widget-open`: The whole-tile button, present only with onOpen. Overlays the card, first in tab order.

## Accessibility

**Keyboard**

- An openable tile is one tab stop, the open button, and it comes first in the tile. Enter and Space activate it.
- A tile with an action is one tab stop, the action button, inside the header (or floated over the body when the header is hidden).
- A tile with neither is not focusable. Nothing in the body is reachable because the body clips and does not scroll.
- There are no arrow-key shortcuts between tiles. Each tile is its own tab stop, so a grid of twelve openable tiles is twelve stops.

**Screen reader**

- The tile is a group named by its title through aria-labelledby, so the name survives hideHeader.
- With onOpen, the button's accessible name is openLabel alone. The header and body are aria-hidden so the fact is not read twice; only the group name (the title) is read first.
- WidgetAction's name is its label prop through aria-label. The tooltip appears on hover and focus and is never the only source of the name; the icon is aria-hidden.
- While loading the tile sets aria-busy and renders a status region reading Loading plus the title. When the body arrives nothing is announced, so a caller that needs the result read out supplies its own live region. With onOpen the status sits under aria-hidden and is not announced.

**Focus**

- Opening a tile moves focus wherever your onOpen sends it. The widget does not restore focus to the tile on return; the caller returns focus to the tile that opened the view.

## Pitfalls

- A body that runs past the tile is clipped silently. There is no scrollbar and no fade, so test the longest content you can really emit at the exact size.
- The open overlay covers the whole card, which is why onOpen and action exclude each other in the type. Content that needs its own links or buttons belongs in a view, not a tile.
- Width and breakpoint classes on the tile fight the grid. Size the grid item and let the tile fill it.
- With onOpen the body is hidden from assistive tech. Whatever the body shows must be in openLabel, or a screen reader user never learns it.
- The header action is 24px square, the system's compact icon button. Keep one per tile and keep it away from the tile edge it floats on.

## Composition

- States: `small`, `medium`, `large`, `loading`, `openable`, `header-hidden`
- Composes from this registry: nothing
- shadcn primitives: button, card, skeleton, tooltip
- npm: none

## Evidence

Apple WidgetKit, Analytics dashboard tiles, Workspace home screens
