import type { Rule } from "./schema"

/** Harvested from ds-architecture starter-kit 02-rules/core.ts (pegbo-inc/
 *  design-system-rebuild via the 2026-08-21 archive). Scopes repointed to
 *  this repo's registry; ICO-2's fix repointed to lucide-react. Everything
 *  else is verbatim — improve upstream, not here. */

export const CORE_RULES: Rule[] = [
  {
    id: "COL-1",
    title: "Zero gradients in product UI",
    severity: "blocker",
    detect: {
      method: "grep",
      pattern: "bg-gradient-|bg-clip-text|backdrop-blur|backdrop-filter",
      flags: "",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts", ".css"],
      // Triage 2026-08-22: hero-video-dialog.tsx (play-button glass, dialog
      // overlay) and preview-tile.tsx (locked scrim, label bar) blur real
      // underlying content — a video thumbnail, the tile's own children, the
      // page behind a modal — never an empty decorative panel. anti-slop.md's
      // own COL-1/3/4 entry already permits exactly this ("no glassmorphism
      // without real underlying content"); the gradient half of this rule
      // (bg-gradient-/bg-clip-text, zero hits) stays a blocker everywhere,
      // including these two files.
      exempt: ["hero-video-dialog.tsx", "preview-tile.tsx"],
    },
    fix: "Flat token: the accent, or a Surface/* tint. For text, text-primary plus a weight step, or one word in text-accent.",
    why: "The competitor set ships zero gradients — flat is the expensive look, and a gradient is emphasis faked where hierarchy was the need.",
  },
  {
    id: "COL-6",
    title: "Indigo, violet and purple exist only as chart-4",
    severity: "warning",
    detect: {
      method: "heuristic",
      // Tightened from the skill's bare `indigo-|violet-|purple-` to require a
      // Tailwind color-utility prefix, so prose mentioning the words (this
      // rule's own description, a code review comment) doesn't trip it.
      pattern: "(bg|text|border)-(indigo|violet|purple)-[0-9]{2,3}",
      flags: "i",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts", ".css"],
      exempt: [],
      falsePositives:
        "Still matches the Tailwind utility when it appears inside a comment or string that is quoting/discussing the banned class rather than applying it (e.g. an example in a code review comment). Every hit still needs a look, hence warning rather than blocker.",
    },
    fix: "Remove it. Indigo/violet/purple are the model's default hue leaking through; if the need is a second categorical color, it is chart-4.",
    why: "Nothing in this system is purple. Its presence is machine provenance rather than a decision.",
  },
  {
    id: "ICO-2",
    title: "Zero emoji in chrome",
    severity: "blocker",
    detect: {
      method: "grep",
      // Narrowed from the skill's Misc-Symbols-and-Dingbats sweep
      // (☀-➿), which also matches plain status glyphs like "✓"
      // (U+2713) that this system uses deliberately (see agreement-indicator).
      // The modern emoji-pictograph blocks plus the specifically-named sparkle
      // (U+2728) catch real emoji without that collision.
      pattern: "[\\u{1F300}-\\u{1FAFF}\\u{2728}]",
      flags: "u",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts"],
      exempt: [],
    },
    fix: "Use lucide-react at the size the component already imports (16/20/24), or drop the glyph — emoji live only inside user-generated content, never in chrome.",
    why: "Zero emoji in chrome — nav, buttons, headings, labels, bullets, table cells; the model's default is to reach for one, and it never belongs in generated UI.",
  },
  {
    id: "MOT-1",
    title: "Motion only on state change — zero infinite loops outside genuine progress indicators",
    severity: "blocker",
    detect: {
      method: "grep",
      // The skill's full grep (transition-all|animate-bounce|animate-spin|
      // animate-pulse, exempt skeleton.tsx) is not honest as a blocker here:
      // animate-spin/animate-pulse are the real, state-bound recipe for
      // spinners and loaders (spinner.tsx, sonner.tsx, ai/loader.tsx,
      // ai/tool.tsx, status-chip.tsx, checklist-item.tsx, upload-zone.tsx,
      // ai/prompt-input.tsx all gate them on a real loading/uploading/
      // listening state), and a path-based exempt list can't scale to that.
      // animate-bounce has no sanctioned use anywhere in the system (bounce
      // easing is a hard ban on its own, MOT-3) and zero current false
      // positives, so it's the part of MOT-1 a line grep can check honestly.
      // The spin/pulse half — "is this loop bound to a real state" — needs
      // judgment and isn't covered here.
      pattern: "animate-bounce",
      flags: "",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts", ".css"],
      exempt: [],
    },
    fix: "Delete it — bounce/elastic easing has no sanctioned use in this system; if the intent was a loading indicator, bind animate-spin to a real loading/uploading state instead.",
    why: "Zero infinite loops outside genuine progress indicators (Skeleton's pulse is the sanctioned exception); bounce easing specifically has no legitimate use anywhere in the system (MOT-3), so any occurrence is an automatic fail.",
  },
  {
    id: "MOT-2",
    title: "Named transition properties, never transition-all",
    severity: "blocker",
    detect: {
      method: "grep",
      pattern: "transition-all|transition:\\s*all",
      flags: "",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts", ".css"],
      exempt: [],
    },
    fix: "Name the properties that change — transition-colors, transition-transform, transition-opacity — at 120–150ms feedback or 200–250ms overlays, ease-out.",
    why: "transition-all animates layout properties by accident, which is both a jank source and an unstated decision.",
  },
  {
    id: "CPY-1",
    title: "Say the thing — no generic CTAs",
    severity: "blocker",
    detect: {
      method: "grep",
      pattern: "Get Started|Learn More",
      flags: "",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts"],
      exempt: [],
    },
    fix: 'Name the object and outcome the control leads to — "Create submission request", "Import COI" — never a generic wayfinding label.',
    why: 'Labels and CTAs name the object and outcome; the label predicts the next screen, and "Get Started"/"Learn More" predict nothing.',
  },
  {
    id: "CPY-2",
    title: "Banned marketing register",
    severity: "warning",
    detect: {
      method: "grep",
      // Fixes the stale scope (skill grep 8 targeted "src prototypess", a
      // typo that matched nothing, so this has reported clean since it was
      // written). With the real scope, a bare `elevate|unlock` substring
      // match floods on this system's own vocabulary — the finish-axis value
      // "elevated" and UI lock-state words like "unlocked" — so those two are
      // word-bounded; the rest have no such collision in this codebase.
      pattern: "\\b(elevate|unlock)\\b|empower|supercharge|seamless|effortless|game.chang|revolutioniz",
      flags: "i",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts"],
      exempt: [],
    },
    fix: "Delete the adjective/claim, or replace it with the concrete mechanism it's standing in for — say what the feature does, not how impressive it is.",
    why: 'elevate/unlock/empower/supercharge/seamless/effortless/game-changing and friends are marketing filler that fakes confidence a real description would earn. Downgraded to warning 2026-08-22: this repo\'s paywall/member-gate family (paywall-message.tsx, member-gate-row.tsx, hero-omnibox.tsx, media-prompt-bar.tsx, run-button.tsx, result-card.tsx, plus their tests) uses "unlock" as the literal, concrete gating mechanism — "Upgrade to unlock 4K export" names exactly what upgrading does — not marketing filler, and the pattern\'s existing \\b(elevate|unlock)\\b word-boundary cannot tell the two senses apart. Every current hit is this vocabulary (zero hits on the other terms); a genuine seamless/effortless/supercharge still surfaces, just as a warning rather than a blocker.',
  },
  {
    id: "CHT-1",
    title: "Chart colors are chart-1…5, never library defaults",
    severity: "blocker",
    detect: {
      method: "grep",
      pattern: "#8884d8|#82ca9d|#ffc658",
      flags: "i",
      // Fixes the stale scope (skill grep 6 targeted "src prototypess"), so
      // this has reported clean without ever actually running.
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts"],
      exempt: [],
    },
    fix: "Assign chart-1…5 in order; the series answering the card's question gets emphasis, context series go gray.",
    why: "#8884d8 is recharts' default and an automatic fail — it is the clearest single tell of an unguided chart.",
  },
  {
    id: "CHT-3",
    title: "Flat marks, hairline gridlines — never the recharts dash default",
    severity: "blocker",
    detect: {
      method: "grep",
      pattern: 'strokeDasharray="3 3"',
      flags: "",
      // Same stale-scope fix as CHT-1 — this shares skill grep 6.
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts"],
      exempt: [],
    },
    fix: "Delete the dash prop (or set an explicit hairline solid gridline) — this system's gridlines are hairline and horizontal-only, never dashed.",
    why: "Marks are flat: no glow, 3D, or gradient fills; the dashed \"3 3\" pattern is recharts' unstyled default leaking through, the same tell as the default palette.",
  },
  {
    id: "STA-3",
    title: "outline-none never ships without a focus-visible replacement",
    severity: "blocker",
    detect: {
      method: "heuristic",
      // Line-level: flags outline-none unless focus-visible also appears on
      // the same line. Real hits split into two classes that need a human
      // look — a genuine interactive control missing its ring (a real
      // violation), and outline-none on a non-interactive container (dialog/
      // popover/collapsible content regions) that was never focusable to
      // begin with and pairs its focus-visible ring, if any, on the trigger
      // element instead.
      pattern: "^(?!.*focus-visible).*outline-none",
      flags: "",
      scope: ["apps/docs/registry/super-ai", "apps/docs/registry/marketing"],
      include: [".tsx", ".ts", ".css"],
      // Triage 2026-08-22: field-row.tsx's UnitInput shows its ring on the
      // wrapping <span> (focus-within:ring-2), one hop up from the
      // outline-none it pairs with — a line grep cannot see an ancestor's
      // class list, one hop further out than the "sibling class list" gap
      // already named below. generation-wizard.tsx / onboarding-wizard.tsx
      // move focus to a tabIndex={-1} step heading on transition (WAI-ARIA
      // APG's "manage focus" pattern) — never Tab-reachable, so a visible
      // ring would flash on every step change instead of marking a real
      // control. The other four STA-3 hits this wave (explore-gallery.tsx
      // x2, settings-dialog.tsx, whats-new.tsx) were real — Tab-focusable
      // scrollable regions missing the shared ring recipe — and were fixed
      // in the components instead of exempted.
      exempt: ["field-row.tsx", "generation-wizard.tsx", "onboarding-wizard.tsx"],
      falsePositives:
        "Fires on outline-none whose focus-visible pairing lives on a different line or in a sibling class list, and on outline-none set on non-interactive containers (dialog/popover/collapsible content regions) that were never focusable. Both need a look before treating a hit as a real STA-3 violation.",
    },
    fix: "Pair outline-none with the shared Focus Ring recipe (focus-visible:ring plus border-ring) on the same rule, or drop outline-none if the element was never interactive.",
    why: "Focus Ring token on every interactive element; outline-none without a :focus-visible replacement is the single most common way a control goes keyboard-invisible.",
  },
]
