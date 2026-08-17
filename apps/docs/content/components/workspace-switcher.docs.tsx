import type { ComponentDocs } from "@/lib/component-docs";
import {
  CreateLastBelowSeparator,
  PlanHiddenInMenuOnly,
  PlanOnTrigger,
  PlusButtonBoltedOn,
} from "./workspace-switcher.examples";

/**
 * Seeded from docs/design-system/component-specs.md#b2-workspace-switcher.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx). Live examples that need interactivity
 * live in the ./workspace-switcher.examples client sidecar and get
 * referenced here as zero-prop elements — see that file for why.
 */

export const WorkspaceSwitcherDocs: ComponentDocs = {
  whatItIs:
    "A dropdown that shows the workspace, org, or product the user is currently in and lets them jump to another one. It doubles as an avatar or logo for the current context and, when a workspace carries a description, expands each row into a full entity row instead of a bare label.",
  whyItMatters:
    "It's the first element in every sidebar on the reference board — Descript, CapCut, Spline, Make, and Lovable all open with it, because switching context is the one action a multi-workspace product needs available at all times. The plan badge riding on the trigger turns an otherwise passive identity control into the cheapest upgrade prompt in the shell: the user sees what they're paying for on every screen, without a dedicated banner.",
  evidence: ["Descript", "CapCut", "Spline", "Make", "Lovable"],
  anatomy: [
    { slot: "workspace-switcher", note: "Root wrapper around the trigger and its menu." },
    { slot: "workspace-switcher-trigger", note: "The button that opens the menu; shows avatar, name, and plan." },
    { slot: "workspace-switcher-avatar", note: "Initials or logo, reused on the trigger and every row." },
    { slot: "workspace-switcher-trigger-name", note: "Current workspace name on the trigger." },
    { slot: "workspace-switcher-plan-badge", note: "The upgrade prompt — always on the trigger, never menu-only." },
    { slot: "workspace-switcher-item", note: "One workspace row: checked-list item or entity row, depending on data." },
    { slot: "workspace-switcher-separator", note: "Rule that separates workspaces from the creation action." },
    { slot: "workspace-switcher-create", note: "The 'create new workspace' action, always last." },
  ],
  usage:
    "Reach for it whenever a shell needs to represent more than one workspace, organization, or product surface and let the user switch between them — it belongs at the top of the sidebar, not buried in settings. Pass plain `{ id, name, plan }` entries for a lightweight checked list; add a `description` to any entry and the whole list renders as entity rows instead, so pick one shape for your data up front rather than mixing the two.",
  dos: [
    {
      text: "Keep the plan on the trigger, not just inside the open menu — it's the cheapest upgrade prompt the shell has.",
      example: <PlanOnTrigger />,
    },
    {
      text: "Put creation last, below a separator, as its own row — never compete with the trigger for attention.",
      example: <CreateLastBelowSeparator />,
    },
  ],
  donts: [
    {
      text: "Don't bolt a \"+\" icon button onto the trigger — creation belongs inside the menu, last, below a rule.",
      example: <PlusButtonBoltedOn />,
    },
    {
      text: "Don't hide the plan badge inside the menu only — if it's not on the trigger, it isn't earning its keep as an upgrade prompt.",
      example: <PlanHiddenInMenuOnly />,
    },
  ],
  accessibility: {
    keyboard: [
      "One tab stop, always: the trigger. The menu is a roving-focus `menu`, so five workspaces and fifty cost the same, and `onCreate` adds a menu item rather than a stop.",
      "Enter, Space or Down opens the menu; arrows move between rows, typing a letter jumps to a workspace, Enter or Space picks one, and Escape closes and returns focus to the trigger. Tab while the menu is open closes it rather than moving inside it.",
      "There is no `disabled` prop anywhere — not on the component and not per workspace. A workspace the user cannot enter has to be left out of `workspaces`, not disabled in place.",
      "Choosing a row closes the menu, so there is no way to try options without reopening it each time.",
    ],
    screenReader: [
      "Rows are `role=\"menuitemradio\"` carrying `aria-checked`, so the current workspace announces as checked. The tick glyph is decoration layered on that state, not the state itself.",
      "The avatar is `aria-hidden` on the trigger and on every row, so initials never leak into a name — which also means a custom `icon` contributes nothing to the announcement.",
      "The trigger's name is just its visible contents: \"Acme Pro\". Nothing says workspace, organisation or switcher, and the plan reads as part of the name. It does announce as a menu button with an expanded state, but if the surrounding context does not make its purpose obvious, pass your own `aria-label`.",
      "Give any workspace a `description` and every row becomes an entity row, which folds the description and the plan into that row's own name — \"Acme, Acme workspace, Pro\" as one string. The plain list announces the much shorter \"Acme Pro\".",
      "`plan` is text, so the tier survives for anyone who cannot see the badge tint. It is unlabelled text, though: \"Free\" and \"Pro\" arrive with nothing saying they are plans.",
      "Nothing announces that the workspace changed. The component holds no live region — the only confirmation is the trigger's own name, which focus returns to as the menu closes.",
      "An empty `workspaces` array announces the trigger as \"Select workspace\" and still opens a menu, which is then empty; there is no empty-state row.",
    ],
    focus: [
      "Opening moves focus into the menu. Closing — by choosing, by Escape, or by clicking away — returns it to the trigger, so nothing here strands focus on `<body>`.",
      "The trigger inherits the shared `Button` focus ring. Menu rows are highlighted with a background change rather than a ring, and in entity-row mode the row renders as a non-interactive `<div>` with no focus style of its own — the highlight belongs to the menu item wrapping it.",
    ],
  },
  pitfalls: [
    "Reaching for a second list or entity-row component when workspaces gain descriptions — the `description` field already switches every row into entity-row rendering, so there's no need to hand-roll a parallel list.",
    "Treating the plan badge as a colour-only signal (a bare dot). It renders as text so plan tier survives for colorblind users and screen readers alike — keep it that way in custom themes.",
    "Forgetting the list is controlled: selecting a row calls `onSelect` but doesn't change context on its own. The consuming app owns `currentId` and must update it in response.",
  ],
};