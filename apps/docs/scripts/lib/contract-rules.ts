// Pure predicates for the contract gate. Kept separate from check-contract.mts
// so each can be unit-tested without running the whole gate.
import { pascal, statePascal } from "./scaffold-templates";

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
/**
 * Strip `//` and `/* *\/` comments, but never touch what's inside a quoted
 * string. A blind regex over the raw text corrupts this file specifically:
 * the vendored directory excludes are literal globs — `"**\/stories/ui/**"` —
 * and `**\/` ends in the two characters `/*`, which a naive block-comment
 * regex reads as a comment *opening*, non-greedily swallowing everything up
 * to the next `*\/` (found inside the *next* entry's own `**\/` prefix) and
 * corrupting both. Tracking quote state is what
 * packages/ds-rules/src/token-rules.mjs's extractCvaCalls already does for
 * the same reason (arbitrary Tailwind values are full of stray parens); this
 * mirrors that pattern for comments.
 */
export function stripComments(source: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      // Terminates at the FIRST `*/`, deliberately, including one that falls
      // inside what looks like a string. That is exactly what a JavaScript
      // parser does, so this is faithful rather than sloppy — and it is worth
      // stating because it looks like the bug that condemned the regex above.
      //
      // The consequence: you cannot block-comment one of these globs at all.
      // `/* "**/stories/super-ai/Foo.stories.tsx" */` is a SYNTAX ERROR,
      // because the glob's own `**/` closes the comment (verified with
      // `new Function(src)`). A vitest.config.ts containing one would not
      // load and Storybook would fail long before G3 had an opinion. Line
      // comments are the only way to comment an entry out, and those are
      // handled above.
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i++; // land on the closing `/`; the loop's i++ advances past it
      continue;
    }
    out += ch;
  }
  return out;
}

export function parseStorybookExclusions(source: string): string[] {
  // Comments are stripped before matching, and this is load-bearing rather
  // than tidy. The exclusion list is edited by hand, and commenting a line
  // out is how people "remove" an entry —
  // `// "**/stories/super-ai/Foo.stories.tsx"`. A parser that still counts
  // that as live reports no mismatch, and G3 silently stops catching the
  // drift it exists to catch. This file's own comments narrate exactly that
  // retrofit ("CostChip and EntityRow were here … the list shrank"), so this
  // is the editing pattern, not a hypothetical.
  const live = stripComments(source);

  return [...live.matchAll(/["']\*\*\/stories\/super-ai\/([A-Za-z0-9]+)\.stories\.tsx["']/g)].map(
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

  // Report against the original filename from
  // packages/ds-rules/src/token-rules.mjs, not just its Pascal-cased form —
  // a reader chasing the mismatch down needs to know which literal entry to
  // look at in CONTRAST_EXEMPT_FILES.
  for (const file of contrastFiles) {
    if (!fromStories.has(pascalOf(file))) {
      errors.push(
        `${file} is contrast-exempt in packages/ds-rules/src/token-rules.mjs but not excluded from the a11y gate (vitest.config.ts) — one of the two lists is stale`,
      );
    }
  }
  for (const name of fromStories) {
    if (!fromContrastNames.has(name)) {
      errors.push(
        `${name} is excluded from the a11y gate (vitest.config.ts) but not contrast-exempt in packages/ds-rules/src/token-rules.mjs — one of the two lists is stale`,
      );
    }
  }
  return errors;
}

/**
 * Story files import `Meta` and `Story` from @storybook/react, and `Default` is
 * the export the house style forbids. A state whose Pascal form is any of the
 * three produces a story file that either shadows its own import or violates
 * the naming rule.
 *
 * check:contract's existing story-state assertion cannot catch this: it greps
 * for `export const <Name>`, which is present whether or not the name collides.
 * record-list shipped with `Meta as StorybookMeta` and the gate stayed green.
 */
const RESERVED_STATE_EXPORTS = new Set(["Meta", "Story", "Default"]);

export function findReservedStateNames(name: string, states: string[]): string[] {
  const errors: string[] = [];
  for (const state of states) {
    const exported = statePascal(state);
    if (RESERVED_STATE_EXPORTS.has(exported)) {
      errors.push(
        `${name}: state "${state}" produces the reserved story export ${exported}. Rename it in catalog.manifest.ts — see CONTINUE.md §3.2.`,
      );
    }
  }
  return errors;
}

/**
 * A heading's anchor slug, GitHub's algorithm restricted to what this repo's
 * headings actually contain: lowercase, drop anything that is not a word
 * character, space or hyphen, then collapse whitespace runs to one hyphen.
 * The backticks around a component name and the em dash before its description
 * both fall out under the strip.
 */
export function headingSlug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Every `specAnchor` must reach a heading that exists.
 *
 * `gen-manifest.mts:167` synthesises the anchor as `<id>-<name>` from the
 * catalog row rather than from a heading, so an item whose spec section was
 * never written still carries a confident-looking link. E9 `tts-composer` and
 * E10 `voice-clone-recorder` have had dead anchors since they shipped and
 * nothing could see it.
 *
 * Matching is by prefix, not equality, because the anchor is only the id and
 * name while the heading usually continues into a description: `#a1-kbd` is
 * meant to reach `## A1 \`kbd\` — keycap chip`. The trailing hyphen on the
 * prefix test is what stops `#a1-kbd` matching a hypothetical `a1-kbdgroup`,
 * and what keeps `#e1-generation-panel` clear of `e10-`.
 */
export function anchorErrors(
  items: { name: string; specAnchor: string }[],
  readDoc: (file: string) => string | undefined,
): string[] {
  const cache = new Map<string, Set<string> | undefined>();
  const slugsFor = (file: string) => {
    if (!cache.has(file)) {
      const source = readDoc(file);
      cache.set(
        file,
        source === undefined
          ? undefined
          : new Set([...source.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((m) => headingSlug(m[1]))),
      );
    }
    return cache.get(file);
  };

  const errors: string[] = [];
  for (const item of items) {
    const [file, anchor] = item.specAnchor.split("#");
    const slugs = slugsFor(file);
    if (slugs === undefined) {
      errors.push(`${item.name}: specAnchor names ${file}, which does not exist`);
      continue;
    }
    const reached = [...slugs].some((slug) => slug === anchor || slug.startsWith(`${anchor}-`));
    if (!reached) {
      errors.push(`${item.name}: specAnchor #${anchor} reaches no heading in ${file}`);
    }
  }
  return errors;
}

/**
 * The guidance-content contract for a `<name>.docs.tsx` module, as a pure
 * function over the source so it can be tested without a manifest or a disk.
 *
 * Lifted out of `check-contract.mts` when blocks were brought under the same
 * contract: the check used to sit after the block branch's `continue`, so all
 * thirteen shells were exempt from it and `block-build-brief.md` had to say
 * their guidance was "on your honour".
 *
 * `(?:[^"\\]|\\.)` rather than `[^"]` so an escaped quote inside the prose
 * doesn't terminate the match early. Guidance is prose and routinely quotes
 * things; the naive form rejected a fully-written whatItIs whose only sin was
 * containing \"Recommended for you\".
 *
 * Both quote styles are accepted for the same reason, one level up: Prettier
 * picks whichever delimiter needs fewer escapes, so a guidance string that
 * itself contains a straight double quote comes out single-quoted. Matching
 * only `"…"` failed N5 run-inspector's whatItIs — fully written, correctly
 * formatted, and rejected purely for quoting `"the run failed"` inside itself.
 */
export function missingGuidanceFields(docs: string): string[] {
  const quoted = (field: string) =>
    new RegExp(`${field}:\\s*(?:"(?:[^"\\\\]|\\\\.){10,}"|'(?:[^'\\\\]|\\\\.){10,}')`);
  const required: [RegExp, string][] = [
    [quoted("whatItIs"), "whatItIs"],
    [quoted("whyItMatters"), "whyItMatters"],
    [/dos:\s*\[\s*\{/, "at least one do"],
    [/donts:\s*\[\s*\{/, "at least one don't"],
    [/pitfalls:\s*\[\s*["']/, "at least one pitfall"],
    // Both arms are required, not just the block, because the failure this
    // catches is a half-filled one: `keyboard` is the easy arm to write from
    // reading the component, and `screenReader` — the arm describing what is
    // actually announced — is the one that gets left as `[]`.
    [/accessibility:\s*\{/, "an accessibility block"],
    [/keyboard:\s*\[\s*["']/, "at least one keyboard note"],
    [/screenReader:\s*\[\s*["']/, "at least one screen reader note"],
  ];
  return required.filter(([re]) => !re.test(docs)).map(([, label]) => label);
}
