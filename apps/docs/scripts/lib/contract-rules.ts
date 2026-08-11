// Pure predicates for the contract gate. Kept separate from check-contract.mts
// so each can be unit-tested without running the whole gate.
import { pascal } from "./scaffold-templates";

/**
 * A `data-slot` passed to a registry component silently replaces that
 * component's own — every component here spreads `...props` after its own
 * attributes — and every test or style keyed to the original slot then misses.
 * DateSection, CostChip, StatReadout and EntityRow have all been erased this
 * way; three of them in one batch.
 *
 * Overriding a *vendored* ui/ primitive's slot is house idiom and stays legal:
 * nothing keys on those values, and it is what makes the composition visible
 * in the DOM. Only registry components are protected.
 *
 * The attribute scan stops at the first `<` OR `>`, which matters more than it
 * looks. Stopping only at `>` was tried first and produced false positives:
 * a multi-line tag with nested JSX in a prop —
 * `<PreviewTile badge={<Badge data-slot="frame-strip-mark">…} />` — has the
 * NESTED element's `>` terminate the match, and the nested element's
 * attributes land in the outer tag's attribute region. The gate then
 * attributes a vendored `Badge`'s perfectly legal `data-slot` to
 * `PreviewTile`. That cost two false positives out of seven on the first
 * real run, and nearly cost ~97 lines of shipped component being restructured
 * to satisfy the regex rather than the regex being fixed.
 *
 * KNOWN LIMITATION, and it is the safe direction: because the scan stops at a
 * nested `<`, a `data-slot` written AFTER nested JSX in the same tag is not
 * seen. That under-reports. Under-reporting is what a gate should do when it
 * cannot parse — a false positive forces someone to contort working code.
 */
export function findSlotErasures(file: string, source: string, registryComponents: Set<string>): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(/<([A-Z][A-Za-z0-9]*)\b([^<>]*)/g)) {
    const [, tag, attrs] = m;
    if (!registryComponents.has(tag)) continue;
    if (!/\bdata-slot\s*=/.test(attrs)) continue;
    const line = source.slice(0, m.index).split("\n").length;
    found.push(
      `${file}:${line} — data-slot passed to registry component <${tag}>, which erases its own slot. Use data-<thing>-id to address rows instead.`,
    );
  }
  return found;
}

/**
 * Pull this repo's own super-ai story exclusions out of
 * apps/storybook/vitest.config.ts. Vendored directory excludes
 * (stories/ui/**, stories/ai-elements/**) are out of scope — they are a
 * different decision, documented in a11y-baseline.md, and are not per-component.
 */
export function parseStorybookExclusions(source: string): string[] {
  return [...source.matchAll(/["']\*\*\/stories\/super-ai\/([A-Za-z0-9]+)\.stories\.tsx["']/g)].map(
    (m) => m[1],
  );
}

/**
 * Two exemption lists, in two files, both governed by "may only shrink, never
 * grow", with nothing linking them. A component silenced in one and enforced in
 * the other is either an unnoticed regression or an exemption that outlived its
 * reason — and until now neither was visible.
 */
export function compareExemptionLists(contrastFiles: string[], storyComponents: string[]): string[] {
  const pascalOf = (f: string) => pascal(f.replace(/\.tsx$/, ""));
  const fromContrastNames = new Set(contrastFiles.map(pascalOf));
  const fromStories = new Set(storyComponents);
  const errors: string[] = [];

  // Report against the original token-rules.mjs filename, not just its
  // Pascal-cased form — a reader chasing the mismatch down needs to know
  // which literal entry to look at in CONTRAST_EXEMPT_FILES.
  for (const file of contrastFiles) {
    if (!fromStories.has(pascalOf(file))) {
      errors.push(
        `${file} is contrast-exempt in token-rules.mjs but not excluded from the a11y gate (vitest.config.ts) — one of the two lists is stale`,
      );
    }
  }
  for (const name of fromStories) {
    if (!fromContrastNames.has(name)) {
      errors.push(
        `${name} is excluded from the a11y gate (vitest.config.ts) but not contrast-exempt in token-rules.mjs — one of the two lists is stale`,
      );
    }
  }
  return errors;
}
