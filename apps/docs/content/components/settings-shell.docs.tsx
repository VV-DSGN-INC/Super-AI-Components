import type { ComponentDocs } from "@/lib/component-docs";
import {
  GatedFeatureHiddenUntilUpgrade,
  SearchScopedToTheOpenSection,
  SearchSitsWithTheNav,
  TierBadgePointsAtSomething,
} from "./settings-shell.examples";

/**
 * Seeded from docs/design-system/block-specs.md — O12 `settings-shell`.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx), which destructures `docs.whatItIs`, `docs.evidence` and
 * the rest directly. Live examples live in the ./settings-shell.examples client
 * sidecar and arrive here as zero-prop elements.
 */
export const SettingsShellDocs: ComponentDocs = {
  whatItIs:
    "The page shell for full-page settings: a searchable grouped nav down the left, a breadcrumb across the top, and a content column that runs a scope callout, the setting sections themselves, and a copy-ready configuration block. It is a block, not a component — it owns arrangement, one search field and one code block, and nothing else. The nav is B3 sidebar-nav, the rows are M1 settings-dialog in its full-page variant, the gated features are E7 member-gate-row, the usage meter is M3, the plan comparison is M4, and the avatar menu is B8. Each of them keeps its own props, state model and accessibility contract.",
  whyItMatters:
    "Lovable settings is the reference implementation, and two of its decisions are the ones worth copying. Search sits with the nav rather than inside a panel, because grouped nav alone stops scaling at roughly twenty settings — which is exactly the size at which most products stop caring, and start shipping a settings page nobody can find anything in. And the tier badges in the nav are a paywall placement as much as a label: the badge names a plan, the gated rows underneath show what that plan actually unlocks, and the plan comparison sits on the same page rather than behind a modal. Sections are deep-linkable for the same reason support articles exist: 'go to Settings, then Workspace, then MCP' has to be a URL you can send someone.",
  evidence: ["Lovable"],
  anatomy: [
    {
      slot: 'data-region="grouped-nav"',
      note: "Search field, a live match summary, B3 sidebar-nav with tier badges and match counts, and M3 quota-meter pinned below.",
    },
    {
      slot: 'data-region="breadcrumb"',
      note: "The vendored Breadcrumb — root, group, then the active section as aria-current page. B8 sits beside it.",
    },
    {
      slot: 'data-region="info-callout"',
      note: "An Alert saying what this section's settings actually reach. Always mounted, with a workspace-scope fallback.",
    },
    {
      slot: 'data-region="setting-sections"',
      note: "M1 settings-dialog in its full-page variant, then E7 rows for gated features, then M4 when the section sells a plan.",
    },
    {
      slot: 'data-region="code-block"',
      note: "The copy-ready configuration block for the active section, with a copy control named for what it copies.",
    },
    { slot: "settings-shell", note: "Root. Column layout, full height, no painted surfaces." },
    { slot: "settings-shell-header", note: "The breadcrumb row: breadcrumb region plus the account menu." },
    {
      slot: "settings-shell-content",
      note: "The scrolling column. Carries the tab stop and the accessible name.",
    },
    {
      slot: "settings-shell-search",
      note: "The settings search input. Its query is forwarded to M1, which filters.",
    },
    {
      slot: "settings-shell-search-status",
      note: "Always-mounted live region reporting the global match count.",
    },
    { slot: "settings-shell-gated", note: "The E7 group — what the nav's tier badge was promising." },
    { slot: "settings-shell-code", note: "The snippet itself. Focusable, because it scrolls." },
  ],
  usage:
    "Reach for it when settings are a destination rather than a dialog — when they need URLs, a plan story, or more rows than a modal can hold. Everything is data: each entry in `sections` carries its `group` (which is how the nav groups), its `rows` (M1's grid, where every row needs a description), and optionally a `callout`, `gated` features, a `pricing` table and a `code` block. `sectionId` and `search` are controlled-or-uncontrolled, so the shell works out of the box and still lets your router own the hash. Keep `anchorPrefix` stable — it is the URL. Under about twenty settings a dialog is the better shape; use M1 directly in its `dialog` variant rather than reaching for this shell early.",
  dos: [
    {
      text: "Keep search in the nav column and report matches on every group, so a setting is findable from wherever you are standing.",
      example: <SearchSitsWithTheNav />,
    },
    {
      text: "Show the gated feature and let the tier badge point at it — a paywall works by being visible.",
      example: <TierBadgePointsAtSomething />,
    },
  ],
  donts: [
    {
      text: "Don't scope search to the open section; it can only find what you had already found.",
      example: <SearchScopedToTheOpenSection />,
    },
    {
      text: "Don't hide gated features until someone upgrades — nobody upgrades for a row they have never seen.",
      example: <GatedFeatureHiddenUntilUpgrade />,
    },
  ],
  accessibility: {
    keyboard: [
      "Tab order runs top-left to bottom-right: the breadcrumb root (only when you pass `rootHref`), your `accountMenu`, the search field, then **one stop per nav row** — B3 has no roving tabindex, so twenty settings sections are twenty stops before the content column — then the quota meter's own controls, then the content column itself, then the rows, the gated rows, the pricing table, the code block and its copy button.",
      "The content column carries `tabIndex={0}` because it is the scroll container and on day one holds nothing focusable. So does the `pre` in the code block, for the same reason. Both are stops that exist to be scrolled with the arrow keys and Page Up/Down, not to be activated.",
      "M1's own section tablist is suppressed with `display: none`, so its tabs are not reachable by keyboard at all — which is intended, since the page nav is B3's job. What survives is the open `tabpanel`, which Base UI still gives `tabIndex=0`: there is a tab stop announcing itself as a tab panel whose tab list nothing can reach.",
      'Nav rows are anchors (`href="#settings-…"`), so Enter follows them and **Space does not** — Space scrolls the page instead. This differs from B3\'s button rows elsewhere in the registry, where both keys work.',
      "There is no Escape, no focus trap and no shortcut for search. It is a page, not a dialog.",
    ],
    screenReader: [
      'The breadcrumb is the vendored one and marks the active section with `aria-current="page"`, so the trail reads root, group, then the section you are in. The group crumb is plain text on purpose — there is no page behind it.',
      'The nav is a `navigation` landmark named "Settings sections" (`navLabel`), which overrides B3\'s own "Sidebar" default. Give two shells the same page and rename one, or you get two identically named landmarks.',
      'The search summary is an always-mounted `role="status"` that is empty when idle, so it announces the global match count as you type. That is the correct shape and worth copying — M1\'s own equivalent is mounted only once it has something to say, which is the version screen readers miss.',
      "The info callout is the vendored `Alert`, whose role is `alert` — an assertive live region. It is always mounted and its content changes with the active section, so **every section switch interrupts a screen-reader user with the new scope text**. Usually that is what you want; on a nine-section shell it is a lot of interrupting.",
      'The content column is a `div` carrying `tabIndex={0}` and `aria-label`. A `div` maps to role `generic`, and ARIA prohibits naming a `generic` element — so whether that stop announces as "Settings content" is not guaranteed. `shortcuts-sheet` reaches for a `<section>` in exactly this spot for exactly this reason; this one has not been changed to match.',
      "The `pre` holding the snippet is a tab stop with no accessible name of its own — the `h3` above it names the region, not the box. A screen-reader user lands on an unnamed scroll container and has to read forward to work out what they are in.",
      'The copy button\'s name is pinned by `aria-label` to "Copy <label>" and does not flip to "Copied": a focused button\'s name change is not reliably re-announced. Nothing announces that a copy succeeded, and a rejected clipboard write is silent.',
      "The gated group and the code block are named `section`s (`aria-labelledby` at their own `h3`), so both are regions a screen-reader user can jump to. The section headings inside the M1 body are `h3`s too.",
    ],
    focus: [
      "Activating a nav row changes the hash and calls `onSelect`, but focus stays on the link — the section anchor is a plain `div` and cannot receive it. A keyboard user who picks a section is still standing in the rail and has to Tab past the rest of the nav to reach what they chose. Move focus to the content column yourself if the section list is long.",
      "A cold load with a hash focuses nothing either, for the same reason. The URL scrolls; it does not land.",
      "Filtering can unmount a focused row control the moment its section stops matching, dropping focus to `<body>`.",
      "The content column and the `pre` add no focus styling and do not remove the browser's, so both show the user agent's default focus ring. Everything composed — B3's rows, M1's controls, E7, M4 — ships its own.",
    ],
  },
  pitfalls: [
    "M1's full-page variant bundles its own section nav and its own search field, and exposes no way to ask for the body without them. This shell suppresses both through documented descendant variants on M1's class list, because O12's sections are URLs — a tab cannot carry `aria-current=\"page\"` or be linked to — and because the spec puts search in the nav column. Pass a `className` that overrides either utility and you will get two navs and two search boxes. The real fix belongs upstream: M1 needs a `nav={false}` / `search={false}` opt-out on the full-page variant.",
    "Because M1's nav is suppressed, its per-section match badges go with it — so this shell recomputes the match count and hands it to B3's own `count` badge instead. That means the shell duplicates M1's filter predicate (label and description, case-insensitive substring). If M1's matching ever gets smarter, the counts in the nav will drift from the rows in the panel until the predicate is exported and shared.",
    "The registry has no copy-ready code block. `run-inspector` keeps one privately for its JSON panes and nothing exposes it, so this shell rebuilds the same shape — a `bg-muted` `pre` with `text-foreground`, a focusable scroll box, and a copy button named for what it copies. If a J-family code block ever lands, this should compose it instead.",
    "The nav column and the content column are deliberately unpainted. Give either one a `bg-muted`, `bg-accent` or `bg-secondary` and every `text-muted-foreground` inside B3, M3, M1 and E7 drops to 4.34:1, and no slot-level override can reach inside a composed child — rebind the variable on the region (`[--muted-foreground:var(--accent-foreground)]`) instead of restyling slots.",
    "A section's deep-link anchor only exists while that section is active, because M1 mounts one panel at a time. A link to `#settings-mcp` therefore lands correctly only once your app has read the hash back into `sectionId` — wire that up, or the URL will scroll to nothing on a cold load.",
    "The content column is the scroll container and on day one it holds no focusable content at all, which is why it carries `tabIndex={0}` and an accessible name. Move the overflow to an inner wrapper without moving those two and axe's `scrollable-region-focusable` rule fails immediately.",
    "The info callout uses the vendored `Alert`, whose role is `alert` — an assertive live region. Switching sections therefore announces the new scope, which is usually what you want and is occasionally chatty. If your callouts are decorative rather than consequential, that is a signal the section did not need one.",
    'Everything is controlled or controlled-capable, including the gated rows: E7\'s switch never turns itself on while `state` is `locked`, it calls `onRequestUpgrade` so you can flip to `inline-upsell`. Rendering the shell with a static `state="locked"` and no handler produces a screenshot of a paywall, not a paywall.',
  ],
};
