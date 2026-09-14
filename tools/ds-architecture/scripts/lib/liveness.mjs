import { themeAliases } from "./css-tokens.mjs"

/** Theme namespaces whose alias name is NOT the utility name. `--color-x` is
 *  written `bg-x` / `text-x` / `border-x`, never `color-x`; `--radius-x` is
 *  written `rounded-x`. Deriving the utility from the alias name alone reported
 *  every colour token in a conformant system as dead, which is how this table
 *  earned its place. Longest namespace wins, so `--transition-duration-*` is
 *  not read as the `transition` namespace. */
const NAMESPACE_UTILITIES = {
  color: [
    "bg", "text", "border", "ring", "fill", "stroke", "outline",
    "decoration", "accent", "caret", "divide", "shadow", "from", "via", "to",
  ],
  radius: ["rounded"],
  "transition-duration": ["duration"],
  spacing: [
    "p", "px", "py", "pt", "pr", "pb", "pl", "ps", "pe",
    "m", "mx", "my", "mt", "mr", "mb", "ml", "ms", "me",
    "gap", "gap-x", "gap-y", "space-x", "space-y",
    "w", "h", "size", "inset", "top", "right", "bottom", "left",
  ],
}

const NAMESPACES = Object.keys(NAMESPACE_UTILITIES).sort((a, b) => b.length - a.length)

function aliasNameFor(css, token) {
  for (const [alias, target] of themeAliases(css)) {
    if (target === token) return alias
  }
  return null
}

/** Every utility class a token could be written as. A token with no alias
 *  generates no utility at all and yields an empty list — the first of the
 *  three links, and the one a name-based guess would paper over. */
export function utilitiesFor(css, token) {
  const alias = aliasNameFor(css, token)
  if (alias === null) return []
  const bare = alias.replace(/^--/, "")
  for (const ns of NAMESPACES) {
    if (bare.startsWith(`${ns}-`)) {
      const rest = bare.slice(ns.length + 1)
      return NAMESPACE_UTILITIES[ns].map((prefix) => `${prefix}-${rest}`)
    }
  }
  return [bare]
}

/** The primary utility a token reaches, or null. Kept as the single-value form
 *  because a namespaced token has no single answer — use `utilitiesFor` when
 *  the question is "did anything write this". */
export function utilityFor(css, token) {
  const [first] = utilitiesFor(css, token)
  return first ?? null
}

/** Word-boundary-ish match for a utility inside a className string. A utility
 *  may carry variant prefixes (`hover:shadow-card`, `md:shadow-card`) or a
 *  leading dash, so the left edge is any non-name character; the right edge must
 *  be a real boundary or `shadow-cardigan` would count as a consumer of
 *  `shadow-card`. */
function writesUtility(source, utility) {
  const escaped = utility.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  // The optional `-` is the negative-utility case and has to sit INSIDE the
  // pattern: `[^\w-]` deliberately excludes dash to keep `shadow-cardigan` from
  // matching `shadow-card`, so without it a leading dash could never match.
  // `x-shadow-card` still fails, because the char before the dash is a word
  // character and the left edge never matches there.
  return new RegExp(`(^|[^\\w-])-?${escaped}(?![\\w-])`).test(source)
}

/** Tokens that reach no consumer. Both broken links produce the same verdict on
 *  purpose — a token is dead whether it has no alias or has one nobody writes,
 *  and distinguishing them here would invite fixing the cheaper half.
 *
 *  `componentSources` is the caller's business: it must be SHIPPED component
 *  source, never stories or tests. A story that writes the utility proves the
 *  utility can be typed, not that any shipped component renders it — which is
 *  exactly how a dead token survives a green suite. */
export function deadTokens(css, tokens, componentSources) {
  const dead = []
  for (const token of tokens) {
    const utilities = utilitiesFor(css, token)
    if (utilities.length === 0) {
      dead.push(token)
      continue
    }
    const written = utilities.some((utility) =>
      componentSources.some((src) => writesUtility(src, utility))
    )
    if (!written) dead.push(token)
  }
  return dead.sort()
}
