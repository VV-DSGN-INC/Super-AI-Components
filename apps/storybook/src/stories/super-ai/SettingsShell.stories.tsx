import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreditCard, KeyRound, Plug, Server, SlidersHorizontal, Users } from "lucide-react";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Switch } from "@/components/ui/switch";
import { AccountMenu } from "@/registry/super-ai/account-menu";
import { SettingsDialog, type SettingsRowData } from "@/registry/super-ai/settings-dialog";
import { SettingsShell, type SettingsShellProps } from "@/registry/super-ai/settings-shell";
import { SettingsShellDocs } from "@/content/components/settings-shell.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { focusTreatmentSignature, settledFocusRing } from "@/lib/focus-ring";

const MCP_CONFIG = `{
  "mcpServers": {
    "northwind-docs": {
      "command": "npx",
      "args": ["-y", "@northwind/mcp-docs"]
    }
  }
}`;

const toggle = (id: string, label: string, description: string): SettingsRowData => ({
  id,
  label,
  description,
  control: ({ controlId, labelId, descriptionId }) => (
    <Switch id={controlId} aria-labelledby={labelId} aria-describedby={descriptionId} />
  ),
});

const SECTIONS: SettingsShellProps["sections"] = [
  {
    id: "general",
    label: "General",
    group: "Account",
    icon: <SlidersHorizontal aria-hidden />,
    callout: {
      title: "Personal",
      description: "These follow your account into every workspace you belong to.",
    },
    rows: [
      toggle("autosave", "Autosave drafts", "Keep a copy of every prompt while you type, recoverable for 30 days."),
      toggle("sounds", "Completion sounds", "Play a chime when a long generation finishes in a background tab."),
      toggle("telemetry", "Share usage data", "Send anonymised feature usage so the team can prioritise work."),
      {
        id: "delete",
        label: "Delete account",
        description: "Removes every project, render and API key. This cannot be undone.",
        destructiveAction: { label: "Delete account" },
      },
    ],
  },
  {
    id: "members",
    label: "Members",
    group: "Account",
    icon: <Users aria-hidden />,
    callout: {
      description: "Members inherit the workspace plan. Seats are billed the day they are added.",
    },
    rows: [
      toggle("invite-links", "Invite links", "Let anyone with the link join without an admin approving them."),
    ],
  },
  {
    id: "mcp",
    label: "MCP",
    group: "Workspace",
    icon: <Server aria-hidden />,
    tier: "Pro",
    callout: {
      description:
        "MCP servers run with this workspace's credentials. Everyone here can call whatever you connect.",
    },
    rows: [
      toggle("mcp-autoconnect", "Auto-connect servers", "Reconnect known MCP servers when a session starts."),
      toggle("mcp-approvals", "Ask before every tool call", "Pause the first time a server calls a new tool."),
    ],
    gatedLabel: "Included with Pro",
    gated: [
      {
        id: "remote-servers",
        icon: <Plug aria-hidden />,
        label: "Remote MCP servers",
        description: "Connect servers that run outside this machine, over HTTP.",
        state: "locked",
        tier: "Pro",
        onRequestUpgrade: () => {},
      },
      {
        id: "server-secrets",
        icon: <KeyRound aria-hidden />,
        label: "Per-server secrets",
        description: "Scope an API key to one server instead of the whole workspace.",
        state: "trial-available",
        trialLabel: "Free trial",
      },
    ],
    code: { label: "MCP server configuration", language: "json", value: MCP_CONFIG },
  },
  {
    id: "plans",
    label: "Plans",
    group: "Billing",
    icon: <CreditCard aria-hidden />,
    tier: "Pro",
    callout: {
      description: "Changing plan takes effect immediately. Unused days are credited at renewal.",
    },
    rows: [
      toggle("invoices", "Email invoices", "Send a PDF invoice to the workspace owner after each renewal."),
    ],
    pricing: {
      plans: [
        { name: "Free", description: "Everything you need to try the workspace.", monthly: 0, yearly: 0 },
        {
          name: "Pro",
          description: "Remote servers, per-server secrets, priority runs.",
          monthly: 20,
          yearly: 16,
          current: true,
          highlighted: true,
        },
        { name: "Team", description: "Shared servers and pooled credits.", monthly: 40, yearly: 32 },
      ],
    },
  },
];

const ACCOUNT_MENU = (
  <AccountMenu
    user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
    theme="system"
    onThemeChange={() => {}}
    background="default"
    onBackgroundChange={() => {}}
    onSignOut={() => {}}
  />
);

const FULL_ARGS: SettingsShellProps = {
  sections: SECTIONS,
  sectionId: "mcp",
  onSectionChange: () => {},
  description: "Workspace and account preferences for Northwind.",
  usage: [
    { label: "Generations", used: 820, limit: 1000, resetsIn: "Resets in 6 days" },
    { label: "MCP calls", used: 12400, limit: 50000, resetsIn: "Resets in 6 days" },
  ],
  accountMenu: ACCOUNT_MENU,
};

const meta: Meta<typeof SettingsShell> = {
  title: "Super AI/Settings Shell",
  component: SettingsShell,
  // A block is a page, so it gets the whole canvas rather than a centred box.
  // The `h-svh` wrapper is what the shell's `h-full` measures against — in a
  // real app that is the document, here it is the story frame.
  parameters: { layout: "fullscreen", docs: { page: componentDocsPage(SettingsShellDocs) } },
  decorators: [
    (Story) => (
      <div className="h-svh w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SettingsShell>;

/** The working page: grouped nav with tier badges, a scope callout, M1's rows, E7's gated rows and a copy-ready config block. */
export const Workspace: Story = { args: FULL_ARGS };

/**
 * Day one. No sections at all — the nav column and the content column each fall
 * to their own L1, the callout falls back to the workspace-scope line, and the
 * code region says it has nothing to copy. Four independent empty affordances,
 * and still a working search field. Mandatory export for the block contract.
 */
export const Empty: Story = { args: { accountMenu: ACCOUNT_MENU } };

/**
 * Narrow viewport. The nav column keeps its width and the content column takes
 * what is left, so M4's plan cards and M1's two-column row grid are what give
 * first. Mandatory export for the block contract — a shell is a layout, and
 * layout is what breaks.
 *
 * `globals.viewport.value` is the Storybook 9 API. `parameters.viewport
 * .defaultViewport` was removed in 9 and does nothing while looking configured.
 *
 * KNOWN LIMIT: this resizes the canvas in the Storybook UI only. The vitest
 * runner behind `pnpm test:stories` has no manager to resize an iframe, so this
 * story is rendered and axe-checked at the browser's default width, exactly
 * like every other story. The narrow layout here is verified by hand.
 */
export const Responsive: Story = {
  args: FULL_ARGS,
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
      },
    },
  },
  globals: { viewport: { value: "mobile" } },
};

/**
 * Settings search, mid-query. The match count lands on every nav row, including
 * the two groups you are not looking at — which is the whole point: a search
 * that only reports on the open section finds nothing you had not already found.
 */
export const Searching: Story = {
  args: { ...FULL_ARGS, sectionId: "general", search: "invoice", onSearchChange: () => {} },
};

/**
 * The paywall as a placement rather than a modal: the Pro badge in the nav, the
 * locked E7 rows it was promising, and — one section down — the plan comparison
 * the upgrade lands on.
 */
export const TierGated: Story = {
  args: {
    ...FULL_ARGS,
    sectionId: "mcp",
    sections: SECTIONS?.map((section) =>
      section.id === "mcp"
        ? {
            ...section,
            gated: section.gated?.map((gate) =>
              gate.id === "remote-servers"
                ? {
                    ...gate,
                    state: "inline-upsell" as const,
                    upsellDescription:
                      "Pro workspaces can connect hosted servers and share them with every member.",
                  }
                : gate,
            ),
          }
        : section,
    ),
  },
};

/** The billing section: M4 on the page, under the rows it is selling against. */
export const Plans: Story = { args: { ...FULL_ARGS, sectionId: "plans" } };

/* -------------------------------------------------------------------------
 * Case stories — the situations this settings page meets in a product, as
 * opposed to the six prop combinations above. See
 * docs/design-system/story-conventions.md.
 *
 * All eight are written, so there are no `case-skip` lines, and for this shell
 * that is not ambition: a page composing six components inherits every
 * situation each of them has. The three that looked skippable are not.
 * `ReducedMotion` — three switches render on one page and exactly one of them
 * branches (M4's add-on switch), which is a fact about composition worth
 * reading back off the live elements. `Controlled` — `sectionId`/`onSectionChange`
 * and `search`/`onSearchChange` are two controlled pairs, and "everything is
 * controlled or controlled-capable" is this component's own docs page.
 * `Boundary` — the near-twin is M1 `settings-dialog` in its `full-page`
 * variant, which this shell *composes*, so the choosing rule is the first
 * thing a reader needs.
 *
 * Three mechanical fixes landed with these stories, all byte-identical in LTR
 * and all measured both ways round before and after (spec §3.4):
 * `md:border-r` → `md:border-e` on the nav column, `left-2`/`pl-7` →
 * `start-2`/`ps-7` on the search field (both participants are classes, so the
 * F5 pair rule is satisfied), and `ml-2` → `ms-2` on the language chip. `RTL`
 * pins all three so they cannot regress silently.
 *
 * Five defects are recorded and asserted nowhere, per the fix policy:
 *
 * 1. The code block reverses under RTL — the `<pre>` inherits `direction: rtl`
 *    and the JSON reorders inside it (`RTL`). N5 `run-inspector` measured the
 *    same shape and the same fix (`dir="ltr"` on the `<pre>`, the idiom M3
 *    already uses on its numbers); it is an attribute change, not a class swap.
 * 2. The `code-block` region's accessible name fuses its decorative language
 *    tag: "MCP server configurationjson" (`LongContent`).
 * 3. M1's copy of the search predicate cannot see the E7 rows this shell
 *    filters with its own copy, so the nav can report a match in a section
 *    whose panel says nothing matched (`Controlled`).
 * 4. Under `prefers-reduced-motion: reduce` the vendored `Switch` still slides
 *    and M3's bar still animates its width (`ReducedMotion`).
 * 5. Four empty labels are a red gate and seven are silent, and which is which
 *    turns on a decorative prop (`EmptyLabel`).
 *
 * One mechanical fact about this file, because it cost a run: **activating a
 * nav row kills the vitest browser runner.** B3's rows are real anchors
 * (`href="#settings-…"`) and the default navigation closes the browser
 * connection — `userEvent.click` and Enter both do it, while assigning
 * `location.hash` directly does not. `Controlled` cancels the navigation the
 * way a router would (`NoNavigate`); no other story activates a row.
 * ---------------------------------------------------------------------- */

/** Sets `dir` on the document — a wrapper cannot reach a portal, and the
 *  account menu is one. */
function RtlDocument({ children }: { children: React.ReactNode }) {
  React.useLayoutEffect(() => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = "rtl";
    return () => {
      document.documentElement.dir = previous;
    };
  }, []);
  return <>{children}</>;
}

/**
 * Cancels the hash navigation a nav row performs, the way a router would.
 * Without it the anchor's default action closes the vitest browser connection
 * and the whole file reports "Was the page closed unexpectedly?".
 */
function NoNavigate({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const cancel = (event: MouseEvent) => {
      if ((event.target as Element | null)?.closest?.("a[href^='#']")) event.preventDefault();
    };
    node.addEventListener("click", cancel);
    return () => node.removeEventListener("click", cancel);
  }, []);
  return (
    <div ref={ref} className="h-full w-full">
      {children}
    </div>
  );
}

const shellOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="settings-shell"]')!;
const leftOf = (el: Element | null | undefined) => Math.round(el!.getBoundingClientRect().left);

/** A 99-character token with no break opportunity in it, which is what makes
 *  the code block interesting. */
const WORKSPACE_KEY =
  "sk-proj-Nn8yQ2vX7cRt4LmA9pWfZs3JhKdE6TgUbY1oIeC5xMqVrDlSnH0aBjFwPuGtXkZyRcMoNvLiQeTaSdFgHjKlZxCvBnM";

/** The same page, with every author-supplied slot at the length a real
 *  workspace reaches. Shared by `LongContent` and `Mobile`. */
const LONG_SECTIONS: SettingsShellProps["sections"] = [
  {
    id: "mcp",
    label: "Model Context Protocol servers, credentials and per-tool approvals",
    group: "Workspace integrations and administrative controls",
    icon: <Server aria-hidden />,
    tier: "Pro",
    callout: {
      title: "Everyone in this workspace can call whatever you connect here",
      description:
        "MCP servers run with this workspace's credentials, so a server added for one project is reachable from every project in the workspace until it is removed.",
    },
    rows: [
      toggle(
        "mcp-approvals",
        "Ask before every tool call, including ones this workspace has already approved once",
        "Pause the first time a server calls a new tool, and every time after that if you would rather review each call individually.",
      ),
    ],
    gatedLabel: "Included with Pro",
    gated: [
      {
        id: "remote-servers",
        icon: <Plug aria-hidden />,
        label: "Remote MCP servers hosted outside this machine, reachable over HTTP",
        description:
          "Connect servers that run outside this machine, over HTTP, and share them with every member of the workspace.",
        state: "locked",
        tier: "Pro",
        onRequestUpgrade: () => {},
      },
    ],
    code: {
      label: "MCP server configuration, including the workspace API key",
      language: "json",
      value: `{
  "mcpServers": {
    "northwind-docs": {
      "command": "npx",
      "args": ["-y", "@northwind/mcp-docs"],
      "env": { "NORTHWIND_API_KEY": "${WORKSPACE_KEY}" }
    }
  }
}`,
    },
  },
];

/** The plans section with add-ons, so M4's one reduced-motion branch renders. */
const PRICED_SECTIONS: SettingsShellProps["sections"] = SECTIONS?.map((section) =>
  section.id === "plans"
    ? {
        ...section,
        pricing: {
          ...section.pricing!,
          addOns: [
            {
              name: "Extra render credits",
              description: "2,000 credits a month, on top of the plan allowance.",
              monthly: 10,
              yearly: 8,
              enabled: false,
              onToggle: () => {},
            },
          ],
        },
      }
    : section,
);

/**
 * Right-to-left, and the shell splits three ways: **the frame mirrors, three
 * classes were swapped to make it, and the code block does not mirror at all.**
 *
 * The frame: the nav column moves to 960..1200 and the content to 0..960, and
 * the breadcrumb reads root, group, leaf from the right (Settings@1131,
 * Workspace@1033, MCP@976).
 *
 * The three swaps, each measured in both directions before and after, and
 * asserted below so they cannot regress (H3 `track-lane`'s pattern):
 *
 * - `md:border-r` → `md:border-e`. Before, the separator stayed on the window's
 *   outer edge under RTL (`border-right: 1px` on a column spanning 960..1200)
 *   instead of on the seam. After, 1px left / 0 right. LTR is unchanged either
 *   way: 0px/1px on a column spanning 0..240.
 * - `left-2` → `start-2` on the magnifier and `pl-7` → `ps-7` on the field.
 *   Before, the icon sat at 980 — the empty end of a field spanning 972..1187,
 *   with the 28px of reserved room on the wrong side. After, 1164..1180 with
 *   padding 10/28. LTR is unchanged: icon 20..36, padding 28/10. Both halves
 *   are classes, which is the F5 `compare-viewer` test for whether a swap is
 *   safe; M1's own (suppressed) search field already uses the logical pair, so
 *   this was the shell's copy drifting from the thing it replaced.
 * - `ml-2` → `ms-2` on the language chip: the 8px gap moves from the chip's
 *   far side to between it and the heading. LTR unchanged at marginLeft 8px.
 *
 * What does **not** mirror, measured and asserted nowhere:
 *
 * 1. *The code block reverses.* The `<pre>` inherits `direction: rtl`, so the
 *    JSON reorders: in LTR the trailing comma of `"command": "npx",` sits 36px
 *    to the right of the value's opening quote (392 → 428); under RTL it sits
 *    86px to its left (851 → 765), and the opening brace moves from x269 to
 *    x924. A configuration snippet is not prose and has no direction — N5
 *    `run-inspector` measured the same shape in its JSON pane and named the
 *    same fix, `dir="ltr"` on the `<pre>`, which is the idiom M3's numbers and
 *    A2 `cost-chip` already use. An attribute, not a class, so it is recorded.
 * 2. *The callout is left-aligned inside a right-to-left page.* The vendored
 *    `alert.tsx` carries a physical `text-left` (one of the six files in
 *    CONTINUE §8's vendored list), so the callout's first character lands at
 *    x31 while the code-block heading in the same column starts at x745 — 714px
 *    apart. M6 `rate-limit-banner` measured this file from the other side.
 * 3. *Every breadcrumb chevron points the wrong way.* The vendored separator is
 *    a `ChevronRightIcon` with `transform: none` under RTL, so the trail runs
 *    right-to-left with arrows pointing back along it. Same class as N11
 *    `escalation-handoff`'s arrow, and a decision about mirroring icons rather
 *    than a swap.
 *
 * One thing that survives untouched and should: M3 pins its numbers with
 * `dir="ltr"`, so "820 / 1,000" reads the same in both directions.
 */
export const RTL: Story = {
  args: { ...FULL_ARGS, sectionId: "mcp" },
  render: (args) => (
    <RtlDocument>
      <SettingsShell {...args} />
    </RtlDocument>
  ),
  play: async ({ canvasElement }) => {
    const shell = shellOf(canvasElement);
    const nav = shell.querySelector<HTMLElement>('[data-region="grouped-nav"]')!;
    const content = shell.querySelector<HTMLElement>('[data-slot="settings-shell-content"]')!;

    // 1. The frame mirrors: nav on the right, content on the left.
    await expect(leftOf(nav)).toBeGreaterThan(leftOf(content));

    // 2. `md:border-e`: the separator is on the seam, not on the window edge.
    const navStyle = getComputedStyle(nav);
    await expect(navStyle.borderLeftWidth).toBe("1px");
    await expect(navStyle.borderRightWidth).toBe("0px");

    // 3. `start-2` / `ps-7`: the magnifier is at the field's leading edge and
    //    the reserved room is on the same side as the text.
    const field = shell.querySelector<HTMLElement>('[data-slot="settings-shell-search"]')!;
    const magnifier = field.parentElement!.querySelector("svg")!;
    const fieldStyle = getComputedStyle(field);
    await expect(fieldStyle.paddingRight).toBe("28px");
    await expect(fieldStyle.paddingLeft).toBe("10px");
    await expect(leftOf(magnifier)).toBeGreaterThan(leftOf(field) + 100);

    // 4. `ms-2`: the chip's gap faces the heading it belongs to.
    const language = shell.querySelector<HTMLElement>('[data-slot="settings-shell-code-language"]')!;
    await expect(getComputedStyle(language).marginRight).toBe("8px");
    await expect(getComputedStyle(language).marginLeft).toBe("0px");

    // 5. The breadcrumb reads right to left, leaf last.
    const crumbs = [...shell.querySelectorAll<HTMLElement>('[data-region="breadcrumb"] li')];
    const root = crumbs[0];
    const leaf = crumbs[crumbs.length - 1];
    await expect(leftOf(root)).toBeGreaterThan(leftOf(leaf));

    // 6. M3's numbers stay left-to-right, which is why they still read.
    const usage = shell.querySelector<HTMLElement>('[data-slot="quota-meter-value"]')!;
    await expect(usage).toHaveAttribute("dir", "ltr");

    // 7. Nothing scrolls sideways in either direction.
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  },
};

/**
 * Three switches, one branch. `vitest.config.ts` emulates
 * `prefers-reduced-motion: reduce` for every story, so this one is only worth
 * reading if the values differ from its neighbours — and they do, in both
 * directions.
 *
 * **What honours the setting, asserted:** M4's add-on switch reads
 * `transition-property: none` on both the track and the sliding thumb. That is
 * `pricing-table`'s own `motion-reduce:transition-none` pair surviving two
 * levels of composition, which is the only thing a shell can actually claim
 * about motion — it owns none of its own.
 *
 * **What does not, measured and asserted nowhere:**
 *
 * - *The vendored `Switch` still slides.* `components/ui/switch.tsx` reads
 *   `transition-property: all` at 0.15s on the track and
 *   `transform, translate, scale, rotate` on the thumb, with no
 *   `motion-reduce:` pair. Four of them render here — M1's two setting rows and
 *   E7's two gated rows — so the page has one switch that respects the setting
 *   and four beside it that do not. Registry-wide and vendored, so no case
 *   story adds the class (CONTINUE §8, the vendored `Button` entry).
 * - *M3's bar animates its width.* `quota-meter.tsx:103` is
 *   `transition-[width]` with no branch, so a quota that moves under the reader
 *   still slides. Another component's file, so it is recorded here rather than
 *   fixed.
 *
 * **And a third thing this story is the only place to see: neither warning
 * surface is painted at all.** `--warning` is undefined in Storybook
 * (CONTINUE §8, wave 0), so the near-limit quota bar computes
 * `background-color: rgba(0, 0, 0, 0)` over a `bg-muted` track — 820 of 1,000
 * generations used, and the fill that says so is transparent. M4's "Save 20%"
 * badge is the same: transparent ground, inherited ink. The numbers survive in
 * both cases, which is the reason the page is still usable, and is also
 * exactly the point — a state carried by fill alone is a state nobody in this
 * build has ever seen.
 */
export const ReducedMotion: Story = {
  args: { ...FULL_ARGS, sections: PRICED_SECTIONS, sectionId: "plans" },
  play: async ({ canvasElement }) => {
    const shell = shellOf(canvasElement);
    await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);

    // The one real branch on the page, read off the live elements.
    const addOn = shell.querySelector<HTMLElement>('[data-slot="pricing-table-addon-switch"]')!;
    const thumb = addOn.querySelector("span")!;
    await expect(getComputedStyle(addOn).transitionProperty).toBe("none");
    await expect(getComputedStyle(thumb).transitionProperty).toBe("none");

    // The near-limit row exists and says so in text, which is what carries it
    // while the fill does not.
    const row = shell.querySelector<HTMLElement>('[data-slot="quota-meter-row"]')!;
    await expect(row).toHaveAttribute("data-state", "near-limit");
    await expect(row).toHaveTextContent("820 / 1,000");
  },
};

/**
 * Fifteen stops, top-left to bottom-right, with no roving tabindex anywhere:
 * breadcrumb root, account menu, search, one stop per nav row, the content
 * column, M1's panel, one per switch, the copy button, the snippet. Twenty
 * settings sections would be twenty stops before the content, which is the
 * cost of B3 being a nav rather than a tablist and is worth knowing before you
 * grow the list.
 *
 * Two of those stops exist only because their containers scroll and hold
 * nothing focusable on day one — the content column and the `<pre>` — and both
 * show the user agent's own outline rather than the registry's ring: the
 * signature goes `none` → `auto/1px` on focus. Every other stop paints a real
 * `ring-2`. Both checks are taken, because they answer different questions
 * (`story-conventions.md`, mechanical fact 5): the differential proves focus
 * caused the treatment, `settledFocusRing` proves the treatment is actually
 * painted.
 *
 * The stop worth staring at is the ninth. M1's section nav is suppressed with
 * `display: none`, so its four tabs and its search field are not stops — the
 * accessibility tree agrees: zero `tab` roles, one `searchbox`. What survives
 * is the open `tabpanel`, so a keyboard user lands on something that announces
 * as a tab panel whose tab list does not exist. That is the visible cost of
 * SECTION_NAV_BELONGS_TO_THE_PAGE, and it is the reason M1 wants a real
 * `nav={false}` opt-out rather than a call-site override (CONTINUE §8).
 *
 * No stop is activated here: B3's rows are anchors, and their default
 * navigation closes the browser connection under the vitest runner. See the
 * block comment above, and `Controlled` for the harness that survives it.
 */
export const KeyboardOrder: Story = {
  args: { ...FULL_ARGS, sectionId: "mcp", rootHref: "#workspace" },
  play: async ({ canvasElement }) => {
    const shell = shellOf(canvasElement);
    const canvas = within(shell);

    // The suppressed chrome is gone from the accessibility tree, not merely
    // from view — which is what makes the walk below the whole walk.
    await expect(canvas.queryAllByRole("tab")).toHaveLength(0);
    await expect(canvas.queryAllByRole("tablist")).toHaveLength(0);
    await expect(canvas.queryAllByRole("searchbox")).toHaveLength(1);
    await expect(canvas.queryAllByRole("tabpanel")).toHaveLength(1);

    const expected = [
      shell.querySelector<HTMLElement>('[data-slot="breadcrumb-link"]')!,
      shell.querySelector<HTMLElement>('[data-slot="account-menu-trigger"]')!,
      shell.querySelector<HTMLElement>('[data-slot="settings-shell-search"]')!,
      ...shell.querySelectorAll<HTMLElement>('[data-slot="sidebar-nav-item"]'),
      shell.querySelector<HTMLElement>('[data-slot="settings-shell-content"]')!,
      shell.querySelector<HTMLElement>('[data-slot="settings-dialog-panel"]:not([hidden])')!,
      ...shell.querySelectorAll<HTMLElement>('[role="switch"]'),
      shell.querySelector<HTMLElement>('[data-slot="settings-shell-code-copy"]')!,
      shell.querySelector<HTMLElement>('[data-slot="settings-shell-code"]')!,
    ];
    await expect(expected).toHaveLength(15);

    expected[0].focus();
    await waitFor(() => expect(document.activeElement).toBe(expected[0]));
    await settledFocusRing(expected[0], waitFor);

    for (let i = 1; i < expected.length; i += 1) {
      const next = expected[i];
      // Read the next stop's signature while focus is still on the previous
      // one, so nothing has to blur to take a baseline (J5 `record-list`).
      const before = focusTreatmentSignature(next);
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).toBe(next));
      await waitFor(() => expect(focusTreatmentSignature(next)).not.toBe(before));
      await settledFocusRing(next, waitFor);
    }

    // A page, not a dialog: the last stop hands focus back out rather than
    // cycling. There is no trap and no Escape.
    await userEvent.tab();
    await waitFor(() => expect(shell.contains(document.activeElement)).toBe(false));
  },
};

/**
 * Two controlled pairs, driven from outside, and they behave differently on
 * purpose. The harness **applies** `search` and **ignores** `onSectionChange`,
 * which is the honest test of both halves of the contract: the query moves
 * because a consumer moved it, and the section refuses to move because no
 * consumer did.
 *
 * Asserted: typing seven characters fires `onSearchChange` seven times, each
 * with the whole next value rather than a delta, so a consumer can apply the
 * last one and be correct; the field renders what the consumer applied; and
 * clicking a nav row fires `onSectionChange("plans")` while the breadcrumb
 * leaf, the active nav row and the rendered panel all stay on MCP, across the
 * eight re-renders the search caused. That is "re-rendering with an unchanged
 * `value` holds the component fixed", proved by re-rendering rather than
 * claimed.
 *
 * **What the query "outside" is doing here, and the reason it was chosen.**
 * It matches exactly one thing on the page: the description of E7's locked
 * "Remote MCP servers" row. So the nav badge on MCP reads 1, the status line
 * reads "1 setting matches across 4 sections", the gated row renders — and
 * M1's panel, one region above it, reads "No settings in MCP match this
 * search." Both halves are behaving correctly and the page still contradicts
 * itself, because the predicate exists twice: `settings-shell.tsx:189` filters
 * rows *and* gated features from an array haystack, M1's private `matchesQuery`
 * filters only the rows it owns from a row object, and neither can see the
 * other's set. CONTINUE §8 already asks for M1 to export it; this is what the
 * duplication costs while it stands, and the two copies have now diverged in
 * shape as well as scope. Asserted here: the count and the gated row, which are
 * right. Not asserted: M1's line, which is what a fix would change.
 *
 * A second thing measured and left alone: after activating a row, focus is
 * still on the row. The section changed, the page did not move under the
 * keyboard, and there is no way for the shell to hand focus to the section
 * because M1's anchor target is a plain `div`. The docs page records it; a fix
 * is a focus-management decision, not a class.
 */
export const Controlled: Story = {
  args: { ...FULL_ARGS, sectionId: "mcp", onSearchChange: fn(), onSectionChange: fn() },
  render: function ControlledSettings(args) {
    const [search, setSearch] = React.useState("");
    return (
      <NoNavigate>
        <SettingsShell
          {...args}
          sectionId="mcp"
          search={search}
          onSearchChange={(next) => {
            args.onSearchChange?.(next);
            setSearch(next);
          }}
        />
      </NoNavigate>
    );
  },
  play: async ({ canvasElement, args }) => {
    const shell = shellOf(canvasElement);
    const canvas = within(shell);
    const field = shell.querySelector<HTMLInputElement>('[data-slot="settings-shell-search"]')!;

    await userEvent.type(field, "outside");
    await waitFor(() => expect(field.value).toBe("outside"));
    await expect(args.onSearchChange).toHaveBeenCalledTimes(7);
    await expect(args.onSearchChange).toHaveBeenLastCalledWith("outside");

    // The one match is an E7 row, and the count that reports it is the shell's.
    const status = shell.querySelector<HTMLElement>('[data-slot="settings-shell-search-status"]')!;
    await waitFor(() => expect(status).toHaveTextContent("1 setting matches across 4 sections"));
    // Scoped to B3's landmark: the breadcrumb's leaf is also `role="link"`
    // (the vendored `BreadcrumbPage` is an `aria-disabled` link), so an
    // unscoped name query matches two things.
    const navRows = within(shell.querySelector<HTMLElement>('[data-slot="sidebar-nav"]')!);
    const mcpRow = navRows.getByRole("link", { name: /^MCP/ });
    await expect(mcpRow.querySelector('[data-slot="sidebar-nav-count"]')).toHaveTextContent("1");
    await expect(canvas.getByRole("region", { name: "Included with Pro" })).toBeInTheDocument();

    // The section pair, ignored by the consumer: the callback fires, the page
    // does not move.
    await userEvent.click(navRows.getByRole("link", { name: /^Plans/ }));
    await expect(args.onSectionChange).toHaveBeenCalledTimes(1);
    await expect(args.onSectionChange).toHaveBeenCalledWith("plans");
    await expect(navRows.getByRole("link", { name: /^MCP/ })).toHaveAttribute("aria-current", "page");
    await expect(shell.querySelector('[data-region="breadcrumb"] [aria-current="page"]')).toHaveTextContent(
      "MCP",
    );
    await expect(shell.querySelector('[data-slot="pricing-table"]')).toBeNull();
  },
};

/**
 * Seven optional labels emptied at once, and the page still works: five
 * regions, a working search, a callout on its fallback text. What changes is
 * everything a screen reader had to go on, and the interesting part is that
 * **four more empty labels are a red gate and these seven are silent** — the
 * line between them runs through a decorative prop.
 *
 * Silent, and rendered here:
 *
 * - `searchLabel=""` leaves an empty `<label for>` in place. axe's `label` rule
 *   is satisfied by the element existing, so nothing fires — while a
 *   `getByRole("searchbox", { name: "Search settings" })` query, which computes
 *   the name with the library axe itself uses, stops finding the field. Setting
 *   `searchPlaceholder=""` as well changes neither result: the field ends up
 *   with no name and the gate stays green. An empty label element is worse than
 *   no label, because it is the thing keeping the rule quiet. Third shape of K1
 *   `ai-doc-block`'s one-red-one-silent pair.
 * - `navLabel=""` leaves an unnamed `navigation` landmark beside the named
 *   breadcrumb one; `landmark-unique` needs matching names to fire, so it does
 *   not.
 * - `contentLabel=""` empties the name of the focusable scroll container.
 * - `rootLabel=""` deletes the first crumb's text while leaving its separator,
 *   so the trail opens with a stray chevron. Pass `rootHref` as well and the
 *   same empty string becomes an `link-name` failure.
 * - `code.copyLabel=""` drops the copy button back to its visible text, so a
 *   name that said what it copies becomes bare "Copy" — A11 `reset-affordance`'s
 *   shape, mild here only because one code block renders at a time.
 * - `code.label=""` **renames the region to its own language tag**: the
 *   `code-block` region announces as "json". Remove `language` and the same
 *   empty label becomes an `empty-heading` failure — so whether this defect is
 *   caught depends on a prop documented as decorative.
 *
 * Red, and therefore described rather than rendered: `usageLabel=""` and
 * `gatedLabel=""` (both `empty-heading`, on the `h3` that names the meter and
 * the one that names the gated region), `code.label=""` with no `language`
 * (the same), and `rootLabel=""` with a `rootHref` (`link-name`). Each was
 * measured against the gate before being written down.
 */
export const EmptyLabel: Story = {
  args: {
    ...FULL_ARGS,
    sectionId: "mcp",
    searchLabel: "",
    searchPlaceholder: "",
    navLabel: "",
    contentLabel: "",
    rootLabel: "",
    sections: SECTIONS?.map((section) =>
      section.id === "mcp"
        ? { ...section, code: { ...section.code!, label: "", copyLabel: "" } }
        : section,
    ),
  },
  play: async ({ canvasElement }) => {
    const shell = shellOf(canvasElement);
    const canvas = within(shell);

    // Every region survives an empty label — a shell's own contract.
    for (const id of ["grouped-nav", "breadcrumb", "info-callout", "setting-sections", "code-block"]) {
      await expect(shell.querySelector(`[data-region="${id}"]`)).toBeInTheDocument();
    }

    // The callout is the one slot with no way to be empty: with no title and no
    // section callout it still says what these settings reach.
    await expect(canvas.getByRole("alert")).toHaveTextContent("MCP servers run with this workspace");

    // The field is still a working search, whatever it is called.
    const field = shell.querySelector<HTMLInputElement>('[data-slot="settings-shell-search"]')!;
    await userEvent.type(field, "auto-connect");
    await waitFor(() =>
      expect(shell.querySelector('[data-slot="settings-shell-search-status"]')).toHaveTextContent(
        "1 setting matches",
      ),
    );

    // And the copy control still names an action, having lost its object.
    await expect(canvas.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  },
};

/**
 * Every author-supplied slot at the length a real workspace reaches, and the
 * shell hands each one to a different mechanism.
 *
 * - *The nav row truncates.* B3 clips a 66-character section label to the 129px
 *   the rail leaves beside a tier badge (scrollWidth 442), with an ellipsis, and
 *   the full string stays in the DOM, so the row still announces in full.
 * - *The headings wrap.* The callout title, M1's section title and the
 *   code-block heading all reflow rather than clip; nothing in the content
 *   column scrolls sideways.
 * - *The snippet does not wrap, and does not need to here.* `whitespace-pre-wrap`
 *   breaks at spaces, and a 99-character API key has none — but at 926px the
 *   line still fits, so `scrollWidth` equals `clientWidth`. `Mobile` is where
 *   the same string does damage; this story is the control that says the damage
 *   is a width problem rather than a content problem.
 *
 * **Measured here and asserted nowhere: the code region's accessible name
 * fuses.** With a label this long the name reads "MCP server configuration,
 * including the workspace API keyjson" — the `<span>` holding the language tag
 * is inline inside the `h3`, so name-from-content joins it with no separator.
 * `queryAllByRole("region", { name: … })` finds the fused string and finds
 * neither the spaced nor the bare one. Fourth instance of the shape J4
 * `artifact-grid` ("Markdown3") and J3 `explore-gallery` ("Images180")
 * recorded; the fix is `aria-hidden` on a span whose own prop comment already
 * calls it decorative. Worth noting what does *not* fuse: B3's nav rows put
 * their count and tier badges in a flex wrapper, so those names come back
 * spaced ("MCP 1 Pro"), which is why the same shape is a defect in one region
 * and fine two regions away.
 */
export const LongContent: Story = {
  args: { ...FULL_ARGS, sections: LONG_SECTIONS, sectionId: "mcp" },
  play: async ({ canvasElement }) => {
    const shell = shellOf(canvasElement);

    // B3 truncates rather than widening the rail.
    const navRow = shell.querySelector<HTMLElement>('[data-slot="sidebar-nav-item"]')!;
    const navText = navRow.querySelector<HTMLElement>("span.flex-1")!;
    await expect(getComputedStyle(navText).textOverflow).toBe("ellipsis");
    await expect(navText.scrollWidth).toBeGreaterThan(navText.clientWidth);
    await expect(navRow).toHaveTextContent("Model Context Protocol servers");

    // The content column reflows; nothing gets pushed sideways.
    const content = shell.querySelector<HTMLElement>('[data-slot="settings-shell-content"]')!;
    await expect(content.scrollWidth).toBe(content.clientWidth);

    // At this width the unbreakable key still fits inside the snippet box.
    const pre = shell.querySelector<HTMLElement>('[data-slot="settings-shell-code"]')!;
    await expect(pre.textContent).toContain(WORKSPACE_KEY);
    await expect(pre.scrollWidth).toBe(pre.clientWidth);
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  },
};

/**
 * A real 375×812 viewport, not a 375px box: `page.viewport` resizes the test
 * iframe, so `window.innerWidth` reads 375 and the media queries flip. That
 * matters more here than the width wrapper would suggest, because **every
 * decision this shell makes about narrow screens is a `md:` override**, and a
 * wrapper leaves them all applying — the desktop two-column layout would have
 * rendered inside a 375px box and reported success (`story-conventions.md`,
 * fact 2).
 *
 * What actually happens, asserted: the nav stops being a column and becomes a
 * capped band above the content — full width, `max-height: 256px`, its
 * separator moving from the inline edge to the bottom. All five regions stay
 * mounted. Nothing scrolls sideways: shell 375/375, document 375/375.
 *
 * What it costs, measured:
 *
 * 1. *The band takes 256 of 812px before any setting is visible.* That is the
 *    trade the source comment names — a fixed 15rem rail would have left 135px
 *    of content — and it is worth seeing rather than reasoning about.
 * 2. *The snippet is the one thing that scrolls sideways*, and it is supposed
 *    to: the 99-character API key measures 689px of content in a 341px box, and
 *    `overflow-auto` on the `<pre>` contains all 348px of it rather than
 *    letting the page scroll. Because that box is also `tabIndex={0}`, the
 *    overflow is reachable with the arrow keys — the shape that failed axe as
 *    `scrollable-region-focusable` in four other components is here by
 *    construction. A phone user still has to scroll a box inside a page to read
 *    a key they are more likely to copy than read, which is what the copy
 *    button is for.
 */
export const Mobile: Story = {
  args: { ...FULL_ARGS, sections: LONG_SECTIONS, sectionId: "mcp" },
  play: async ({ canvasElement }) => {
    // Dynamic import: a static one throws outside Browser Mode and takes the
    // whole file with it.
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);

    const shell = shellOf(canvasElement);
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(window.matchMedia("(min-width: 768px)").matches).toBe(false);

    // Every region is still mounted at phone width.
    for (const id of ["grouped-nav", "breadcrumb", "info-callout", "setting-sections", "code-block"]) {
      await expect(shell.querySelector(`[data-region="${id}"]`)).toBeInTheDocument();
    }

    // The nav is a capped band, not a rail: this is the assertion a width
    // wrapper cannot make.
    const nav = shell.querySelector<HTMLElement>('[data-region="grouped-nav"]')!;
    const navStyle = getComputedStyle(nav);
    await expect(navStyle.maxHeight).toBe("256px");
    await expect(navStyle.borderInlineEndWidth).toBe("0px");
    await expect(navStyle.borderBottomWidth).toBe("1px");
    await expect(Math.round(nav.getBoundingClientRect().width)).toBe(375);

    // The snippet keeps its own overflow, and the page has none.
    const pre = shell.querySelector<HTMLElement>('[data-slot="settings-shell-code"]')!;
    await expect(pre.scrollWidth).toBeGreaterThan(pre.clientWidth);
    await expect(pre).toHaveAttribute("tabindex", "0");
    await expect(shell.scrollWidth).toBe(shell.clientWidth);
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  },
};

/**
 * The near-twin is the component this shell composes. M1 `settings-dialog` in
 * its `full-page` variant renders the same rows, the same descriptions and the
 * same destructive-action treatment — and it brings its own section nav and its
 * own search field, which is exactly what O12 suppresses.
 *
 * Rendered side by side, the difference is one measurement: **the shell exposes
 * four links and no tabs; M1 alone exposes four tabs and no links.** A tab
 * cannot be a URL and cannot claim `aria-current="page"`, and the spec's third
 * sentence — "Go to Settings → Workspace → MCP has to be a URL" — is what
 * decides between them.
 *
 * The choosing rule:
 *
 * - **Sections that need addresses** — support articles link to them, the
 *   browser back button should work, a colleague can paste one — are pages, so
 *   they are B3 rows inside this shell.
 * - **Sections that swap a panel inside a surface you already own** — a modal,
 *   a pane, anything with fewer than about twenty settings — are tabs, so use
 *   M1 directly and do not reach for the shell.
 *
 * The cost of the first choice is visible in `KeyboardOrder`: suppressing M1's
 * nav leaves its `tabpanel` behind as a tab stop with no tab list. The cost of
 * the second is that nothing is linkable. Both are the same missing prop —
 * M1 has no `nav={false}`, so the only way to compose its body is to hide its
 * chrome at the call site.
 */
export const Boundary: Story = {
  args: { ...FULL_ARGS, sectionId: "mcp" },
  render: (args) => (
    <div className="flex h-full flex-col gap-6 overflow-auto p-4">
      <SettingsShell {...args} className="h-[36rem] shrink-0 rounded-lg border" />
      <div className="shrink-0 rounded-lg border p-4">
        <SettingsDialog
          variant="full-page"
          title="Settings"
          description="M1 on its own: the same rows, its own nav, its own search."
          sections={(args.sections ?? []).map((section) => ({
            id: section.id,
            label: section.label,
            icon: section.icon,
            tier: section.tier,
            rows: section.rows ?? [],
          }))}
          defaultSectionId="mcp"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const shell = shellOf(canvasElement);
    const standalone = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="settings-dialog"]')].find(
      (el) => !shell.contains(el),
    )!;

    // The shell: addresses, not tabs.
    const shellCanvas = within(shell);
    const shellNav = within(shell.querySelector<HTMLElement>('[data-slot="sidebar-nav"]')!);
    await expect(shellCanvas.queryAllByRole("tab")).toHaveLength(0);
    const rows = shellNav.getAllByRole("link");
    await expect(rows).toHaveLength(4);
    for (const row of rows) await expect(row).toHaveAttribute("href", expect.stringContaining("#settings-"));
    await expect(shellNav.getByRole("link", { name: /^MCP/ })).toHaveAttribute("aria-current", "page");

    // M1 alone: tabs, and its own search field back.
    const aloneCanvas = within(standalone);
    await expect(aloneCanvas.getAllByRole("tab")).toHaveLength(4);
    await expect(aloneCanvas.queryAllByRole("link")).toHaveLength(0);
    await expect(aloneCanvas.getAllByRole("searchbox")).toHaveLength(1);
    await expect(shellCanvas.getAllByRole("searchbox")).toHaveLength(1);
  },
};

