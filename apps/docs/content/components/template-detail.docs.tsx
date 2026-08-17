import type { ComponentDocs } from "@/lib/component-docs";
import {
  ConfiguredOnTheWayIn,
  DeadEndModal,
  OptionsAfterCommit,
  RelatedSwapsInPlace,
} from "./template-detail.examples";

/**
 * Seeded from docs/design-system/component-specs.md#j6-template-detail.
 * Plain data read by a Server Component; live examples live in the client
 * sidecar (template-detail.examples.tsx) and cross over as zero-prop elements.
 */
export const TemplateDetailDocs: ComponentDocs = {
  whatItIs:
    "The modal a template opens into before anyone commits to it: a large preview with a thumbnail strip beside the template's title, its author, the options that decide what actually gets created, and a row of related templates. The primary action creates the template as configured, and picking a related tile swaps the modal's contents rather than closing it.",
  whyItMatters:
    "Canva, Spline, Freepik and Pixlr all put the same three jobs in this one overlay, and each one is a decision the surrounding grid cannot make. Options belong here because a template is customised on the way in — choosing 16:9 in the modal is one click, choosing it after the document exists is a resize. The author line with a follow control is what makes a template a social object rather than a file: creators are the reason a library keeps growing, and this is the only place their name is next to their work at full size. And a template modal is where browsing sessions die — every product on that reference board answers it the same way, by making the next template one click away inside the modal, so closing is never the only way out.",
  evidence: ["Canva", "Spline", "Freepik", "Pixlr"],
  anatomy: [
    { slot: "template-detail", note: "The dialog surface, named by the visible template title." },
    { slot: "template-detail-preview", note: "The current preview at full size, on a fixed aspect frame." },
    { slot: "template-detail-strip", note: "Carousel of thumbnails. Renders only when there is more than one preview." },
    { slot: "template-detail-thumb", note: "One thumbnail. The current one carries aria-current, not just a ring." },
    { slot: "template-detail-title", note: "The template name — also the dialog's accessible name." },
    { slot: "template-detail-description", note: "What the template is for, in a sentence." },
    { slot: "template-detail-author", note: "Avatar, name and a line of context about the creator." },
    { slot: "template-detail-follow", note: "The follow toggle. Its accessible name includes the author." },
    { slot: "template-detail-options", note: "Everything configured before the commit." },
    { slot: "field-row", note: "One labelled option row (its own slot, not renamed) — rendered through A6 field-row, addressed by data-option-id." },
    { slot: "template-detail-related", note: "The 'more like this' section." },
    { slot: "template-detail-related-item", note: "One related tile — an inert A8 preview-tile inside a single button." },
    { slot: "template-detail-use", note: "The commit. Emits the template id together with the configured options." },
    { slot: "template-detail-status", note: "Announces which template is currently showing after a swap." },
  ],
  usage:
    "Hand it a `templates` pool rather than a single template: the member on screen plus everything reachable from it. That is what makes the swap in-place — picking a related tile changes `templateId` and never touches `open`, so the modal cannot close on the way to the next template. Leave `templateId` off for the common case and read `onTemplateChange` if you want to log the move. Give each template its `previews` (every one needs a `label`, which is the thumbnail's accessible name) and its `options`; every option resolves to a value even if you never set `defaultValue`, so `onUseTemplate` always receives a complete configuration: `{ templateId, options }`. Follow is uncontrolled unless you set `author.following`, and `onFollowChange` fires with the author id either way, so one handler serves every author the modal can reach.",
  dos: [
    {
      text: "Put the options that shape the output inside the modal, and read them off the commit payload rather than asking for them again.",
      example: <ConfiguredOnTheWayIn />,
    },
    {
      text: "Pass the neighbouring templates in the same pool, so 'more like this' keeps the session alive instead of ending it.",
      example: <RelatedSwapsInPlace />,
    },
  ],
  donts: [
    {
      text: "Don't ship a preview with a bare Use button and defer every choice to the canvas — that is a second configuration step, not a customised template.",
      example: <OptionsAfterCommit />,
    },
    {
      text: "Don't hand it a single template; with nothing to move to, closing is the only exit and the browse session ends here.",
      example: <DeadEndModal />,
    },
  ],
  accessibility: {
    keyboard: [
      "Escape closes the modal and Tab is trapped inside it — the page behind is inert until it closes. The close button is rendered after everything else, so it is the last stop in the ring, not the first.",
      "The stop count is entirely data-driven: one per preview thumbnail plus two carousel arrows (only when there is more than one preview), one for follow (only with an `author`), one per option select, one per related tile, and the commit. A template with six previews, three options and four related tiles is sixteen stops before the close button.",
      "Inside the thumbnail strip, Left and Right scroll the strip rather than moving between thumbnails. The carousel captures those keys and calls `preventDefault`, so arrowing does not change which preview is current — that still takes Tab and then Enter or Space.",
      "The option selects are Base UI selects with their own keyboard model: Enter or Space to open, arrows to move through choices, Escape to dismiss the popup without changing the value. Escape there closes the select, not the dialog.",
      "The commit button takes the native `disabled` attribute when you pass no `onUseTemplate`, which removes the modal's primary action from the tab order entirely rather than rendering it as inert-but-reachable.",
      "There is no keyboard route from a related tile to \"open this template in a new modal\" and no Backspace-style way back to the previous one. Swapping is one-way; the only exit is Escape or the close button.",
    ],
    screenReader: [
      "The dialog is named by its visible template title through `aria-labelledby`, not by a hidden string, so it opens as, for example, \"Quarterly report deck, dialog\". Losing that wiring is the `aria-dialog-name` failure this repo has shipped before.",
      "Swapping to a related template is announced by a visually hidden `role=\"status\"` reading \"Showing <title>\". That is the only thing marking the swap — every visible part of the modal changes at once with no navigation, so without it the change would be silent.",
      "Each thumbnail's accessible name is its `label`, which is why `label` is required. The current one carries `aria-current=\"true\"`, a real programmatic state rather than only a ring, so \"which preview am I looking at\" is answerable without sight of the selection.",
      "The hero preview itself has no accessible name at all: it renders with `labelPlacement=\"none\"` and its `media` is meant to be decorative (`alt=\"\"`). The current preview is identifiable only through the thumbnail's `aria-current`, so a template with one preview — and therefore no strip — presents no preview to assistive tech whatsoever.",
      "The follow control is a toggle with `aria-pressed`, named per author: the visible word is \"Follow\", and a sibling `sr-only` span carries \"Follow Marta Lin\". They are split rather than concatenated on purpose — a trailing hidden span would have produced \"FollowMarta Lin\". The avatar beside it is `aria-hidden`.",
      "Each option is a labelled select through `field-row`, so the control announces as \"Size\" rather than as its current value. An option's `hint` is a gap: `field-row` hands the render function a `describedBy` id, and this component does not pass it on, so a hint is visible text that no select is described by.",
      "Related tiles are named by the template title through the tile's own label, and \"Options\" and \"More like this\" are real `<h3>` headings under the dialog's `<h2>` title — so heading navigation works inside the modal.",
      "The carousel's arrows are labelled \"Previous slide\" and \"Next slide\" from the vendored primitive, which says nothing about previews or about this template. They are the two least identifiable controls in the dialog.",
    ],
    focus: [
      "Opening the modal moves focus into it and closing returns it to whatever opened it — standard dialog behaviour, and the safe part.",
      "Picking a related template is not safe. The tile you activated is removed from the grid (the current template is excluded from its own \"more like this\"), and nothing in this component restores focus — there is no focus call anywhere in the file. The modal stays open, which is the whole guarantee, but a keyboard user's place in it does not survive the swap. Take focus to the new title yourself if you can reach it.",
      "Choosing a preview is safe: the thumbnail stays mounted and only `aria-current` moves, so focus and position survive. Same for the follow toggle and the option selects, which re-render in place.",
      "Swapping to a template with a single preview unmounts the entire strip, and swapping to one with no author unmounts the follow control — so the number of tab stops before the commit button changes between templates in the same modal.",
      "Every control ships a visible focus style: the thumbnails and related tiles through their own `focus-visible:ring-2`, everything else through the vendored `Button`'s `focus-visible:ring-3`.",
    ],
  },
  pitfalls: [
    "A related tile can only render for a template that is actually in `templates`. Ids in `relatedIds` that are not in the pool are dropped silently, so a missing tile usually means a missing pool member rather than a rendering bug.",
    "Omitting `relatedIds` means every other pool member qualifies. That is the right default for a small hand-picked pool and the wrong one for a pool you built by dumping a search result into the prop — narrow it explicitly when the pool is large.",
    "Option values are kept per template, so stepping to a related template and back finds the options exactly as they were left. If you want the swap to reset them, control `optionValues` yourself and clear it in `onTemplateChange`.",
    "Setting `author.following` makes follow controlled for that author: the button will not move until you feed the new value back in. Omit the field entirely if you want the toggle to manage itself.",
    "Each preview's `label` is doing accessibility work, not decoration — it is the only accessible name a thumbnail has. A strip of previews labelled 1, 2, 3 is technically passing and practically useless.",
    "The thumbnail strip is a carousel on purpose: its transform scrolling avoids the focusable-scrollable-region rule that a plain overflow strip would trip. Replacing it with `overflow-x-auto` reintroduces that failure.",
  ],
};
