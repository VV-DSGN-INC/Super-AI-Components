import type { ComponentDocs } from "@/lib/component-docs";
import {
  AbsenceIsStated,
  TempoAndKeyAsColumns,
  TempoBuriedInTags,
  ZeroFilledMetadata,
} from "./track-list.examples";

/**
 * Seeded from docs/design-system/component-specs.md#j7-track-list.
 * Plain data read by a Server Component; examples live in the client sidecar.
 *
 * `evidence` is deliberately empty: J7 was restored per gaps.md R5 as a
 * recovered consolidation error, not sampled from a reference board, so no
 * per-product screenshots exist to cite. Same precedent as E9/E10.
 */
export const TrackListDocs: ComponentDocs = {
  whatItIs:
    "A table of music library rows: cover art, title and artist, tags, a row-height waveform you can audition in place, tempo and musical key. Every row is a track; every column is something you would compare across tracks.",
  whyItMatters:
    "Tempo and key are the two fields a music library is actually sorted and filtered by, and a generic asset list cannot express either — which is why this exists as its own component instead of being folded into `asset-library`. Once those fields are columns rather than free text, two takes line up digit for digit and the comparison costs nothing. That is also why this is a table while the rest of the library family is grid-shaped: a card grid looks better and hides the numbers you opened the library to compare. The inline waveform follows the same logic — it is an audition affordance, not artwork. Playing a row must leave you exactly where you were, because comparing three takes should not cost three round trips through a detail view. And because a separated stem has no cover art and a spoken clip has no key, absence is a first-class value here: a missing field is stated, never filled in with a zero that reads as a measurement.",
  evidence: [],
  anatomy: [
    { slot: "track-list", note: "The table wrapper." },
    { slot: "track-list-row", note: "One track. Carries `data-state` — `playing` or `idle`." },
    { slot: "track-list-artwork", note: "Cover art cell. Your own decorative node, or a stated absence." },
    { slot: "track-list-title", note: "The track title. A button when `onSelect` is given, otherwise text." },
    { slot: "track-list-artist", note: "Secondary line under the title." },
    { slot: "track-list-tags", note: "Free-text tags. Not where tempo or key belong." },
    {
      slot: "track-list-play",
      note: "The audition control, named for its track. Rendered only when `onPlayToggle` is supplied.",
    },
    {
      slot: "track-list-waveform",
      note: 'Row-height preview strip, decorative. `data-peaks="none"` when the track has not been analysed.',
    },
    {
      slot: "track-list-waveform-bar",
      note: "One bar per supplied peak; bars behind the playhead fill while the row is sounding.",
    },
    { slot: "track-list-bpm", note: "Tempo. Right-aligned and tabular so columns compare at a glance." },
    { slot: "track-list-key", note: "Musical key, as free text — notation conventions differ." },
    {
      slot: "track-list-unset",
      note: 'A deliberate absence: an em-dash hidden from assistive tech, paired with the words "Not set".',
    },
  ],
  usage:
    "Reach for this over a generic asset library the moment tempo or key matter — those two fields are the whole reason it is a separate component, and a list that cannot sort by them is an asset library with music in it. Keep it a table: the columns exist to be compared, and turning it into a card grid throws that away. Playback is yours: the component holds no audio element and no timer, so hand it `playingId` and a `progress` percentage from whatever is actually sounding and handle `onPlayToggle` by starting or stopping in place. Sorting is yours too — pass `tracks` in the order you want them, driven by whichever column the user picked. Give `onSelect` only if opening a track is a real destination; it renders as a control on the title, deliberately separate from play.",
  dos: [
    {
      text: "Give tempo and key their own columns, so two takes can be compared without opening either.",
      example: <TempoAndKeyAsColumns />,
    },
    {
      text: "Let a row with no cover art, no tags or no key say so — absence is a value.",
      example: <AbsenceIsStated />,
    },
  ],
  donts: [
    {
      text: "Don't bury tempo and key in free-text tags; nothing there can be sorted, filtered or lined up.",
      example: <TempoBuriedInTags />,
    },
    {
      text: 'Don\'t fill an absent field with a zero or an "n/a" — a stem is not 0 BPM, and the filler reads as a measurement.',
      example: <ZeroFilledMetadata />,
    },
  ],
  pitfalls: [
    "Auditioning must not navigate. If your `onPlayToggle` handler routes to a detail page, you have re-created the round trip this component exists to remove — start playback in place and leave the list mounted.",
    "The play control renders only when `onPlayToggle` is supplied. A list that silently has no way to audition is usually a forgotten handler, not a decision.",
    "`progress` applies to `playingId` alone. Setting it while nothing is playing does nothing, which normally means the playing id was not updated.",
    "The waveform is decorative and hidden from assistive tech; it is not a scrubber and reports no position. If you need seeking, that belongs on a transport control, not on a 24px strip.",
    "`bpm` is checked for being a number, not for truthiness — pass `undefined` for an unknown tempo, because `0` is a value and will render as one.",
    "The title control and the play control are siblings, never nested. If you wrap the row in a link or a button to make it clickable, you have created a nested interactive and the accessibility gate will fail.",
    "This is not H6 `waveform-editor`. If you want selection, zoom or regions, you want the editor; this strip is a preview you scan at row height.",
  ],
};
