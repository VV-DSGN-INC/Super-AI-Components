// Reconciles each shipped component's DECLARED dependencies against its REAL
// imports. Never trust the catalog's assumed bases: it names primitives this
// repo does not vendor, and never trust a builder's own declared list either.
import type { ManifestItem } from "../../lib/manifest-types";

/**
 * Items whose `consumes` deliberately exceeds their imports.
 *
 * A6 `field-row` documents a `reset-affordance` in its trailing slot and never
 * imports it, so the reconciliation is right that the import is absent. The
 * declaration stays anyway: field-row is one of the five already-published
 * entries frozen by `registry-extras.test.ts`'s LEGACY snapshot, whose whole
 * point is that they "must keep deriving identically forever, or a consumer's
 * `npx shadcn add` changes under them". The freeze outranks the tidier list.
 *
 * Keep this set at exactly the entries that earn it. It is a licence to
 * under-report drift, so a name added here stops being checked.
 */
export const CONSUMES_COMPANIONS: Record<string, string[]> = {
  "field-row": ["reset-affordance"],
};

const RELEVANT = /^(@\/components\/ui\/|@\/registry\/super-ai\/|\.\/|lucide-react|@base-ui)/;

/**
 * Bare specifiers that are never a consumer-installable payload: node builtins,
 * and react/react-dom, which every consumer app already has.
 */
const NOT_PAYLOAD = /^(node:|react$|react-dom$|react\/|react-dom\/)/;

/** "motion/react" -> "motion"; "@base-ui/react/slider" -> "@base-ui/react". */
const packageOf = (spec: string) =>
  spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];

/** Intra-registry composition is written relatively (`./kbd`); the alias form
 *  is what a consumer sees post-install. Both normalise to a bare name. */
const bare = (spec: string) => spec.replace(/^@\/registry\/super-ai\//, "").replace(/^\.\//, "");

const fileStem = (path: string) => path.replace(/^.*\//, "").replace(/\.tsx$/, "");

/**
 * Every module specifier a source file imports.
 *
 * Anchored to a statement that STARTS a line, because a bare `from "…"` scan
 * reads prose: `record-list` renders the text `from "4 min ago"` and
 * `rate-limit-banner` renders `from "not your fault"`, and both were reported
 * as npm packages. The `[^;]*?` spans newlines so a multi-line import list
 * still resolves to its specifier, and the second pattern catches a dynamic
 * import, which never starts a line.
 */
export function specifiersIn(source: string): string[] {
  const statement = /(?:^|\n)\s*(?:import|export)\b(?:[^;]*?\bfrom\b)?\s*["']([^"']+)["']/g;
  const dynamic = /\bimport\(\s*["']([^"']+)["']\s*\)/g;
  return [
    ...[...source.matchAll(statement)].map((m) => m[1]),
    ...[...source.matchAll(dynamic)].map((m) => m[1]),
  ];
}

/**
 * Reconciles one item's declared deps against its real imports.
 *
 * `readFile` is injected so the test can drive this without a fixture tree, and
 * returns undefined for a path that does not exist.
 *
 * Three rules the first version got wrong. Each produced a standing false
 * positive, and four of them together made a report that exits 1 read as noise
 * — which is why it ran in no gate for as long as it existed.
 *
 * 1. A multi-file item's `files` are PART OF the item, not things it consumes.
 *    Their imports count toward the item; their own names do not.
 * 2. An item with `external` composes another registry's item, whose imports are
 *    not on this disk. It may legitimately declare shadcn deps this script
 *    cannot see, so declared-beyond-real is not drift there — though
 *    real-beyond-declared still is.
 * 3. `@base-ui/react` is omitted from `npm` when the item also imports a
 *    vendored `ui/` primitive, because it arrives as that primitive's peer. It
 *    counts only for a component that imports no `ui/` primitive at all — H2
 *    `time-ruler` uses `@base-ui/react/slider` and nothing else would drag the
 *    package in.
 */
export function reconcileItem(item: ManifestItem, readFile: (path: string) => string | undefined) {
  const ownPaths = [`registry/super-ai/${item.name}.tsx`, ...(item.files ?? []).map((f) => f.path)];
  const ownNames = new Set((item.files ?? []).map((f) => fileStem(f.path)));

  const specs = ownPaths.flatMap((path) => {
    const source = readFile(path);
    if (source === undefined) return [];
    return specifiersIn(source);
  });

  const relevant = specs.filter((s) => RELEVANT.test(s));

  const shadcn = [
    ...new Set(
      relevant.filter((s) => s.startsWith("@/components/ui/")).map((s) => s.replace("@/components/ui/", "")),
    ),
  ].sort();

  const consumes = [
    ...new Set(
      relevant
        .filter((s) => s.startsWith("@/registry/super-ai/") || s.startsWith("./"))
        .map(bare)
        .filter((name) => !ownNames.has(name)),
    ),
  ].sort();

  const npm = [
    ...new Set(
      specs
        .filter((s) => !s.startsWith(".") && !s.startsWith("@/") && !NOT_PAYLOAD.test(s))
        .map(packageOf)
        // Rule 3: @base-ui rides along with any vendored ui/ primitive.
        .filter((pkg) => !(pkg.startsWith("@base-ui") && shadcn.length > 0)),
    ),
  ].sort();

  const declaredShadcn = [...item.shadcn].sort();
  const declaredConsumes = [...item.consumes].sort();
  const companions = CONSUMES_COMPANIONS[item.name] ?? [];
  const consumesForCompare = [...new Set([...consumes, ...companions])].sort();
  const declaredNpm = [...item.npm].sort();

  const missing = (real: string[], declared: string[]) => real.some((r) => !declared.includes(r));
  const same = (a: string[], b: string[]) => JSON.stringify(a) === JSON.stringify(b);

  // An external item's own imports are invisible here, so only under-declaring
  // is drift for its shadcn list.
  const shadcnDrifted = item.external ? missing(shadcn, declaredShadcn) : !same(shadcn, declaredShadcn);

  // npm is under-declaration only, because over-declaration is usually correct
  // and this script cannot see why. A vendored `ui/` primitive brings its own
  // packages with it: C5 `skill-menu` declares `cmdk` and imports it through
  // `ui/command`, and both carousel users declare `embla-carousel-react` and
  // import it through `ui/carousel`. A consumer needs those installed, so the
  // declarations are right and the direct-import scan simply cannot reach them.
  // The risk worth gating is the opposite one: a component importing a package
  // nobody declared, which lands a consumer with a module that will not resolve.
  const npmDrifted = missing(npm, declaredNpm);

  const consumesDrifted = !same(consumesForCompare, declaredConsumes);

  return {
    shadcn,
    consumes,
    npm,
    shadcnDrifted,
    consumesDrifted,
    npmDrifted,
    drifted: shadcnDrifted || consumesDrifted || npmDrifted,
  };
}
