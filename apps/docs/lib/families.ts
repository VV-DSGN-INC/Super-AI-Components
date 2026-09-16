// Display names for the family letters, from catalog.md's headings. The
// letters stay the ids (spec 2026-09-15 D27); this is the only place a name
// is attached to one, and families.test.ts holds it to the manifest.
import type { FamilyId } from "./manifest-types";

export const FAMILY_LABELS: Record<FamilyId, string> = {
  A: "Primitives",
  B: "App shell & navigation",
  C: "Home & launcher",
  D: "Composer & context",
  E: "Generation & parameters",
  F: "Results & assets",
  G: "Canvas & nodes (cut)",
  H: "Timeline & transport",
  I: "Editor surfaces",
  J: "Library, filtering & discovery",
  K: "Documents & knowledge",
  L: "First-run & onboarding",
  M: "Account, plan & monetization",
  N: "Feedback, trust & observability",
  O: "Blocks",
  P: "Records & views",
};

/** Catalog order, G omitted (D9). */
export const FAMILY_ORDER: FamilyId[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
];
