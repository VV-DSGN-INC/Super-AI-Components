// Pure predicates for the contract gate. Kept separate from check-contract.mts
// so each can be unit-tested without running the whole gate.

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
