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
 * KNOWN LIMITATION: the opening-tag scan stops at the first `>`, so a `>`
 * inside an attribute string value truncates the tag early and the gate may
 * miss a `data-slot` after it. Accepted — the shape this catches is the shape
 * that has actually shipped.
 */
export function findSlotErasures(file: string, source: string, registryComponents: Set<string>): string[] {
  const found: string[] = [];
  for (const m of source.matchAll(/<([A-Z][A-Za-z0-9]*)\b([^>]*)>/g)) {
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
