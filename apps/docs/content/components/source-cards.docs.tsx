import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#k8-source-cards.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence`
 * and so on directly. The dos/donts here are text-only — every rendering
 * worth showing is already a story, and this component's only interactive
 * prop (`onOpen`) could not cross the server boundary from this module.
 */
export const SourceCardsDocs: ComponentDocs = {
  whatItIs:
    "The retrieved set behind an answer, as a ranked list of cards. Every document the search returned gets a card — including the ones the answer never cited, which stay in the list and say so. Each card carries its position, an optional snippet, an optional relevance band, and a badge reading either Cited or Retrieved, not used. A count of documents withheld for permissions sits below the list.",
  whyItMatters:
    "Retrieval is the part of a grounded answer that users cannot see, and the two obvious ways to render it both mislead. Show only the cited documents and every list looks thorough, because the failure mode — retrieval returned six things and the answer could use one — has been edited out. Show all of them undifferentiated and the reader cannot tell what the answer actually rests on. Glean, NotebookLM and Perplexity all resolve this the same way, and so does this component: one list, ranked, with the used ones first and the unused ones quiet but present. The permission line is the enterprise half of the same argument — in an assistant that reads across a company's documents, an answer that is quietly thin because three sources were filtered out is indistinguishable from an answer that is simply wrong, unless the component says so.",
  evidence: ["Glean", "NotebookLM", "Perplexity"],
  anatomy: [
    {
      slot: "source-cards",
      note: "Root column. Holds the list and, below it, the permission-filtered line.",
    },
    {
      slot: "source-cards-item",
      note: "One retrieved document. Carries `data-used` when the answer cited it; unused cards render at reduced opacity but are never removed.",
    },
    {
      slot: "source-cards-empty",
      note: "Replaces the list when nothing is in it. Its wording changes with `hasRun` — nothing matched, versus no search yet.",
    },
    {
      slot: "source-cards-permission-filtered",
      note: "The withheld-document count. Names that the documents exist; deliberately carries no titles.",
    },
  ],
  usage:
    "Reach for it wherever a grounded answer needs to show its working — under the answer, or in a panel beside it. Pass the whole retrieved set in `sources` and mark each one `used` according to whether the answer cited it; the component handles the ordering, putting cited documents first and numbering from there. Give a source an `onOpen` handler and its title becomes a button that opens the document. Leave `relevance` off entirely when your retriever has no calibrated band to report — position alone is a legitimate ranking signal, and a missing band is better than a manufactured one. Set `hasRun` to false before the first search so an untouched panel does not read as a search that came back empty.",
  dos: [
    {
      text: "Pass every document retrieval returned, cited or not, and let the component quiet the unused ones — the gap between what was retrieved and what was used is the signal.",
    },
    {
      text: "Keep `hasRun` false until a search has actually run, so an untouched panel says so instead of claiming nothing matched.",
    },
    {
      text: "Report withheld documents with `permissionFilteredCount` whenever your retrieval layer drops results for access, even when the visible list is otherwise healthy.",
    },
  ],
  donts: [
    {
      text: "Don't filter the array down to cited sources before passing it — a list where every card reads Cited looks like a thorough answer and hides that retrieval found nothing else worth using.",
    },
    {
      text: "Don't put a raw similarity score in the title or snippet in place of the band — a 0.7412 is precision the retrieval does not have, and readers will treat it as if it did.",
    },
    {
      text: "Don't drop the withheld-source line to keep the panel tidy. An answer that is quietly thin because three documents were filtered out reads as an answer that is simply wrong.",
    },
  ],
  pitfalls: [
    "The component re-sorts what you pass: cited sources move to the front, and the number on each card is its position after that sort, not the rank your retriever assigned. If the retriever's own ordering carries meaning you need to preserve, it is already gone by the time the list renders — reflect it in `relevance` instead.",
    "A source's title is a button only when you pass `onOpen`, and a plain span otherwise. Passing the handler for some sources and not others produces a list where only some cards are reachable by keyboard, with nothing visually announcing which.",
    "The title truncates to one line and the snippet clamps to two, with no tooltip or expansion behind either. Long document titles lose their tail — often the part that distinguishes v3 from v4 — so pass a title that is identifiable in its first several words.",
    "Unused cards are dimmed with opacity, which dims every descendant — including text that was already muted. The component compensates by rebinding the muted-foreground variable to the full foreground token on those cards, so the snippet and relevance band stay legible through the dimming. If you restyle an unused card or nest your own muted text inside one, check the result against a contrast tool rather than trusting the token names: opacity on an ancestor is invisible to per-element checks, and the dimming is a hint anyway — the badge is what actually says whether the answer used the source.",
  ],
};
