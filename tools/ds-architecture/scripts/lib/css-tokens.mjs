/** A deliberately small CSS reader: custom-property declarations, `@theme inline`
 *  aliases, and single-var() alias targets. Not a CSS parser — a parser is a
 *  dependency, and this module has to run inside a probe against a target whose
 *  toolchain we know nothing about. It reads text, and it is honest about
 *  reading text: anything it cannot recognise it simply does not report, which
 *  is why the probes that use it report `unchecked` rather than `met` for the
 *  claims it cannot settle. */

/** A declaration is a `--name:` sitting in declaration POSITION — after a line
 *  start, a `{`, or a `;`. Anchoring to line start alone was the first version
 *  and it silently found nothing in single-line CSS (`:root { --a: var(--b); }`),
 *  which is exactly the shape a hand-written fixture takes. */
const DECLARATION = /(^|[{;])\s*(--[\w-]+)\s*:/gm
const SINGLE_VAR = /^\s*var\(\s*(--[\w-]+)\s*\)\s*;?\s*$/

/** Every custom property DECLARED. A `var(--x)` on the right-hand side is a
 *  reference, not a declaration — the preceding character is what separates
 *  them (a reference is preceded by `(`), and conflating the two would make
 *  every referenced token look declared. */
export function declaredTokens(css) {
  return [...new Set([...css.matchAll(DECLARATION)].map((m) => m[2]))].sort()
}

/** The body of every `@theme inline { ... }` block, concatenated. Brace-counted
 *  rather than regex-matched to the first `}`, because a nested block would
 *  otherwise truncate the body silently. */
function themeInlineBodies(css) {
  const bodies = []
  const re = /@theme\s+inline\s*\{/g
  let match
  while ((match = re.exec(css)) !== null) {
    let depth = 1
    let i = re.lastIndex
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++
      else if (css[i] === "}") depth--
      i++
    }
    bodies.push(css.slice(re.lastIndex, i - 1))
  }
  return bodies
}

function declarationPairs(text) {
  const pairs = []
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/)
    if (m) pairs.push([m[1], m[2]])
  }
  return pairs
}

/** alias name → the token it references, for `@theme inline` entries only.
 *  This is the hop that turns a token into a Tailwind utility; an entry with no
 *  var() generates a utility backed by a literal, which is a dead end for the
 *  axis and is reported separately by literalAliases. */
export function themeAliases(css) {
  const map = new Map()
  for (const body of themeInlineBodies(css)) {
    for (const [name, value] of declarationPairs(body)) {
      const m = value.match(SINGLE_VAR)
      if (m) map.set(name, m[1])
    }
  }
  return map
}

export function literalAliases(css) {
  const out = []
  for (const body of themeInlineBodies(css)) {
    for (const [name, value] of declarationPairs(body)) {
      if (!SINGLE_VAR.test(value)) out.push(name)
    }
  }
  return out.sort()
}

/** Every declaration ANYWHERE whose value is exactly one var(). This is how a
 *  Layer-3 alias is recognised: an alias restates no value, so a Layer-3 name
 *  carrying a literal is the defect claim 3 exists to catch. */
export function aliasTargets(css) {
  const map = new Map()
  for (const [name, value] of declarationPairs(css)) {
    const m = value.match(SINGLE_VAR)
    if (m) map.set(name, m[1])
  }
  return map
}
