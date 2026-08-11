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
  pitfalls: [
    "A related tile can only render for a template that is actually in `templates`. Ids in `relatedIds` that are not in the pool are dropped silently, so a missing tile usually means a missing pool member rather than a rendering bug.",
    "Omitting `relatedIds` means every other pool member qualifies. That is the right default for a small hand-picked pool and the wrong one for a pool you built by dumping a search result into the prop — narrow it explicitly when the pool is large.",
    "Option values are kept per template, so stepping to a related template and back finds the options exactly as they were left. If you want the swap to reset them, control `optionValues` yourself and clear it in `onTemplateChange`.",
    "Setting `author.following` makes follow controlled for that author: the button will not move until you feed the new value back in. Omit the field entirely if you want the toggle to manage itself.",
    "Each preview's `label` is doing accessibility work, not decoration — it is the only accessible name a thumbnail has. A strip of previews labelled 1, 2, 3 is technically passing and practically useless.",
    "The thumbnail strip is a carousel on purpose: its transform scrolling avoids the focusable-scrollable-region rule that a plain overflow strip would trip. Replacing it with `overflow-x-auto` reintroduces that failure.",
  ],
};
