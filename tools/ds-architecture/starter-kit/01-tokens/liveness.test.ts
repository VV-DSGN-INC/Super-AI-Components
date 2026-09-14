/** Liveness gate for the elevation half of the finish axis.
 *
 *  A style axis is only real where a component reads it. Between the day the
 *  roles were introduced and 2026-08-20 all three were declared in `:root`,
 *  re-tuned by pegbo-warm, and re-tuned again by BOTH finishes — while every
 *  component rendered a raw Tailwind step instead. Switching `data-finish`
 *  moved no pixel of shadow anywhere, including the `flat-dense` promise that
 *  cards carry no shadow at all. Nothing failed, because every existing check
 *  looked at the CSS (where the tokens were present and correct) rather than
 *  at the tree.
 *
 *  So this file walks the whole chain instead of any one link: a role is
 *  declared → `@theme inline` aliases it to a utility → some component
 *  actually writes that utility. Break any link and the axis is decorative
 *  again. Deriving the role list from the CSS rather than hardcoding three
 *  names is deliberate: a fourth role added later arrives already gated, and
 *  cannot repeat this by being the one nobody wired up.
 *
 *  Deliberately NOT generalised to every finish-owned token. The dimension
 *  half (--control-height-*, --button-height-*, --table-line-*) is unconsumed
 *  for the same reason and wants the same fix, but migrating control heights
 *  is a separate change with its own visual review — widening this gate now
 *  would just make it a red test nobody can go green on.
 */
import { readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const here = path.dirname(fileURLToPath(import.meta.url))
const globals = readFileSync(path.join(here, "globals.css"), "utf8")
const componentsDir = path.resolve(here, "../components")

/** Every `--elevation-<role>` declared in :root. The finishes re-tune these
 *  but declare no role the base scale lacks, so :root is the full list. */
const ROLES = [
  ...new Set(
    [...globals.matchAll(/^\s*(--elevation-[\w-]+)\s*:/gm)].map((m) => m[1]!)
  ),
]

/** `--shadow-card: var(--elevation-card);` in @theme inline → the utility
 *  `shadow-card`. Read rather than assumed: the alias is what Tailwind turns
 *  into a class, and a role with no alias generates no utility at all. */
function utilityFor(role: string): string | null {
  const m = globals.match(
    new RegExp(`(--shadow-[\\w-]+)\\s*:\\s*var\\(${role}\\)`)
  )
  return m ? m[1]!.replace(/^--/, "") : null
}

/** Source of every library component — stories and tests excluded on purpose.
 *  A story or a test that writes the utility proves only that the utility can
 *  be typed, not that any shipped component renders it. */
function componentSources(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (
        entry.name.endsWith(".tsx") &&
        !entry.name.endsWith(".stories.tsx") &&
        !entry.name.endsWith(".test.tsx")
      ) {
        out.push(readFileSync(full, "utf8"))
      }
    }
  }
  walk(componentsDir)
  return out
}

const sources = componentSources()

describe("elevation roles reach the rendered tree", () => {
  it("finds roles to check", () => {
    expect(ROLES.length).toBeGreaterThan(0)
  })

  it.each(ROLES)("%s is aliased to a utility in @theme inline", (role) => {
    expect(utilityFor(role), `no --shadow-* alias for ${role}`).not.toBeNull()
  })

  it.each(ROLES)("%s has at least one consumer in src/components", (role) => {
    const utility = utilityFor(role)
    if (!utility) return // reported by the alias case above
    // Word boundary so `shadow-card` cannot be satisfied by a hypothetical
    // `shadow-cards`, and so a variant prefix (hover:, group-data-[…]:) still
    // counts — those render the utility just as much as a bare one does.
    const used = new RegExp(`(^|[^\\w-])${utility}(?![\\w-])`)
    const consumers = sources.filter((src) => used.test(src)).length
    expect(
      consumers,
      `${role} is declared and aliased to \`${utility}\`, but no component ` +
        `writes it — the finish axis cannot move a shadow it owns`
    ).toBeGreaterThan(0)
  })
})
