import { MANIFEST } from "./catalog.manifest";
import type { FamilyId, ManifestItem } from "./manifest-types";

export type SectionId =
  | "shell"
  | "compose"
  | "generate"
  | "results"
  | "knowledge"
  | "trust"
  | "account";

export interface ShowcaseItem {
  name: string;
  title: string;
  description: string;
  family: FamilyId;
}

export interface ShowcaseSection {
  id: SectionId;
  title: string;
  blurb: string;
  items: ShowcaseItem[];
}

/** The block the hero renders. Chosen because its four regions span the whole
 *  arc of an AI app — topbar, config, cost/generate, result canvas. */
export const HERO_BLOCK_NAME = "generation-shell";

/**
 * Families A and O are absent by design: they are whole layers, not sections.
 * A is `layer: "primitive"` and surfaces as the foundations strip; O is
 * `layer: "block"` and surfaces as the hero. G is cut (D9) and ships nothing.
 *
 * Every other family holds `layer: "component"` items and must appear here.
 * `sectionFor` throws on a miss rather than dropping the item, so adding a
 * family to the manifest without mapping it fails loudly.
 */
const FAMILY_TO_SECTION: Partial<Record<FamilyId, SectionId>> = {
  B: "shell",
  C: "shell",
  D: "compose",
  E: "generate",
  H: "generate",
  F: "results",
  I: "results",
  J: "knowledge",
  K: "knowledge",
  P: "knowledge",
  L: "trust",
  N: "trust",
  M: "account",
};

const SECTION_META: { id: SectionId; title: string; blurb: string }[] = [
  {
    id: "shell",
    title: "Shell",
    blurb: "The frame the app lives in: navigation, workspace switching, and the way in.",
  },
  {
    id: "compose",
    title: "Compose",
    blurb: "Everything between an intent and a request — the composer and the context it carries.",
  },
  {
    id: "generate",
    title: "Generate",
    blurb: "Parameters, runs, progress and transport. What happens while the model is working.",
  },
  {
    id: "results",
    title: "Results",
    blurb: "What comes back, and the surfaces for editing it rather than only reading it.",
  },
  {
    id: "knowledge",
    title: "Knowledge",
    blurb: "Libraries, filtering, documents and records — the app's memory of its own output.",
  },
  {
    id: "trust",
    title: "Trust",
    blurb: "Approval, feedback, observability and first-run. Where autonomy is negotiated.",
  },
  {
    id: "account",
    title: "Account",
    blurb: "Plans, credits and limits, treated as interface rather than as billing plumbing.",
  },
];

const sectionFor = (item: ManifestItem): SectionId => {
  const section = FAMILY_TO_SECTION[item.family];
  if (!section) {
    throw new Error(
      `showcase: family ${item.family} (${item.id} ${item.name}) has no section. ` +
        `Add it to FAMILY_TO_SECTION in lib/showcase.ts.`,
    );
  }
  return section;
};

const toShowcaseItem = (i: ManifestItem): ShowcaseItem => ({
  name: i.name,
  title: i.title,
  description: i.description,
  family: i.family,
});

const shipped = MANIFEST.filter((i) => i.status === "shipped");
const byLayer = (layer: ManifestItem["layer"]) => shipped.filter((i) => i.layer === layer);

export const SHOWCASE_SECTIONS: ShowcaseSection[] = SECTION_META.map((meta) => ({
  ...meta,
  items: byLayer("component")
    .filter((i) => sectionFor(i) === meta.id)
    .map(toShowcaseItem),
}));

export const SHOWCASE_PRIMITIVES: ShowcaseItem[] = byLayer("primitive").map(toShowcaseItem);
export const SHOWCASE_BLOCKS: ShowcaseItem[] = byLayer("block").map(toShowcaseItem);
