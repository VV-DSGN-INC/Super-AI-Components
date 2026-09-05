import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import ChatShellDemo from "@/components/demos/chat-shell-demo";
import HomeShellDemo from "@/components/demos/home-shell-demo";
import LibraryShellDemo from "@/components/demos/library-shell-demo";
import SettingsShellDemo from "@/components/demos/settings-shell-demo";
import StudioShellDemo from "@/components/demos/studio-shell-demo";

/* Mobile and tablet viewport gate for the shells: the small-viewport pass the
   anti-slop rules prescribe (anti-slop.md, Part 2.11 and STA-7), as a test
   instead of a manual step.

   Until this file, the tree's mobile evidence for a whole screen was each
   block's `Responsive` story, and block-build-brief.md is explicit that the
   story proves nothing mechanically: the viewport global only reaches the
   Storybook manager, and the vitest runner behind `pnpm test:stories` has no
   manager, so axe measures `Responsive` at Chromium's default width like any
   other story. This file resizes the real browser viewport instead, which is
   why its assertions only run under the runner (see the guard in `sweep`).

   Shape: one story per curated screen, and the play function sweeps three
   viewports inside a single session. The screens are the docs-site demos
   (apps/docs/components/demos), the same fixtures the docs pages render, so
   the sweep measures what a reader of the docs would see rather than a
   fixture invented here. The five are D9's defensible subset of the shells
   (home, chat, studio, library, settings), which is the set the catalog
   would keep if block scope were ever revisited.

   Viewport choice is a branch argument, not a device list. `useIsMobile`
   (max-width: 767px, src/hooks/use-mobile.ts) is what swaps B1's sidebar for
   a drawer, and no registry component defines a breakpoint below Tailwind's
   `sm` (640px), so every width from 320 to 767 runs one layout branch whose
   worst case is the narrowest phone, and every width at or above 768 runs the
   other, whose worst case is exactly 768. 375 and 768 are therefore the two
   worst cases; 430 is kept because the largest phone should be measured
   rather than argued from "no breakpoint fires between them".

   Light mode only: overflow and hit size are geometry, and the theme axis
   moves no geometry in this token sheet.

   The two checks are a PAIR, and neither claims "usable at 375px" alone. A
   screen that cannot fit has two failure shapes: SPILL (content escapes
   sideways, the overflow check) and SQUEEZE (content compresses until a
   control collapses under the 24px floor, the tap check). Green here means
   "no spill, no sub-floor control", not "designed for a phone". */

const meta = {
  title: "Foundations/Mobile viewport",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Ids appear in every failure message so a red run names its exact
 *  viewport without re-running. */
const VIEWPORTS = [
  { id: "375", w: 375, h: 667 }, // the narrowest phone still in common use; worst case of the mobile branch
  { id: "430", w: 430, h: 932 }, // the largest phone; measured rather than inferred
  { id: "768", w: 768, h: 1024 }, // worst case of the desktop branch, where useIsMobile has just flipped off
] as const;

/** Everything a finger can hit. `[tabindex]` variants are left out on
 *  purpose: a focusable-but-not-clickable wrapper is a keyboard concern, not
 *  a tap-target one. */
const INTERACTIVE =
  'a[href], button, input, select, textarea, [role="button"], [role="tab"],' +
  ' [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"],' +
  ' [role="option"], [role="combobox"]';

/** Shrink-only ledger, the same shape as the a11y exclusion baseline: every
 *  entry is a reasoned exception scoped to one story and to the viewports it
 *  was measured at, matched by substring against describeTarget()'s output,
 *  and a new undersized target fails the suite instead of joining silently.
 *
 *  What the first sweep found (2026-09-04): no screen spills at any width,
 *  and every sub-floor control below is the component's own resting height,
 *  measured identical at 375, 430 and 768. None is a squeeze symptom, so
 *  none will resolve with layout room, and the entries carry all three
 *  widths for that reason. Six control shapes are under the floor, and the
 *  fix owner differs by tier: two are vendored shadcn primitives (fixing them
 *  means diverging from upstream, the same open decision
 *  vendored-token-findings.md holds), four are registry primitives whose own
 *  geometry has to grow. Recorded in CONTINUE.md §8; re-arm an entry by
 *  deleting it once its component clears 24px. */
const TAP_EXEMPT: Array<{
  story: string;
  match: string;
  viewports: readonly string[];
  reason: string;
}> = [
  {
    story: "home-shell",
    match: "[data-slot=credits-indicator-trigger]",
    viewports: ["375", "430", "768"],
    reason:
      "M2 credits-indicator's counter form is a text-height button, 86×16 at " +
      "every width: the topbar row around it is taller, but the button's own " +
      "box is the line box. Registry-owned; the fix is vertical padding on the " +
      "trigger, not on the shell.",
  },
  {
    story: "studio-shell",
    match: "[data-slot=section-header-trigger]",
    viewports: ["375", "430", "768"],
    reason:
      "A12 section-header's collapsible trigger is the heading text itself, " +
      "16 to 20px tall. Registry-owned, and shared with library-shell below: " +
      "the trigger needs a min-height, so the fix lands once in the primitive.",
  },
  {
    story: "studio-shell",
    match: "[data-slot=reset-affordance]",
    viewports: ["375", "430", "768"],
    reason:
      "A11 reset-affordance is a 20×20 icon button beside every editable " +
      "value in the inspector. Registry-owned; 24px is one size step up and " +
      "the field-row gutter has the room.",
  },
  {
    story: "library-shell",
    match: "[data-slot=section-header-trigger]",
    viewports: ["375", "430", "768"],
    reason: "Same A12 trigger as studio-shell, 16px tall on the facet rail's three group headings.",
  },
  {
    story: "library-shell",
    match: "[data-slot=checkbox]",
    viewports: ["375", "430", "768"],
    reason:
      "The vendored shadcn checkbox (components/ui/checkbox.tsx) is size-4, " +
      "16×16, ten times on the facet rail. Upstream geometry; growing it means " +
      "diverging from shadcn, which nobody has decided. Reported, not fixed.",
  },
  {
    story: "library-shell",
    match: "[data-slot=filter-chip-remove]",
    viewports: ["375", "430", "768"],
    reason:
      "A5 filter-bar's per-chip remove button is 16×16, the hardest target on " +
      "any of the five screens. Registry-owned; the chip is 24px tall, so the " +
      "button can take the chip's full height without moving anything else.",
  },
  {
    story: "settings-shell",
    match: "[data-slot=switch]",
    viewports: ["375", "430", "768"],
    reason:
      "The vendored shadcn switch (components/ui/switch.tsx) is 32×18, four " +
      "times on the settings sections. Upstream geometry, same status as the " +
      "checkbox: reported, not fixed.",
  },
];

/** Stable-enough identity for a failure message and the ledger: data-slot is
 *  the registry's own part vocabulary, so prefer it; fall back to the
 *  accessible name, then the tag. Tailwind class soup is deliberately not
 *  used: it churns on every restyle and would rot the ledger. */
function describeTarget(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const slot = el.getAttribute("data-slot");
  const label = el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 32) ?? "";
  return `${tag}${slot ? `[data-slot=${slot}]` : ""}(${label})`;
}

/** A stretched-link recipe (`after:absolute after:inset-0`) puts the tappable
 *  box on a pseudo-element that getBoundingClientRect cannot see. Detected by
 *  its computed signature, the measurement moves to offsetParent, which for
 *  an inset-0 pseudo is exactly the box it covers. */
function effectiveRect(el: HTMLElement): DOMRect {
  const after = getComputedStyle(el, "::after");
  const stretched =
    after.position === "absolute" &&
    after.top === "0px" &&
    after.right === "0px" &&
    after.bottom === "0px" &&
    after.left === "0px";
  if (stretched && el.offsetParent instanceof HTMLElement) {
    return el.offsetParent.getBoundingClientRect();
  }
  return el.getBoundingClientRect();
}

/** One viewport's tap-target failures. 0.5px of slack: getBoundingClientRect
 *  is subpixel, and a 23.6px reading on a 24px control is zoom rounding, not
 *  a design decision. */
function tapFailures(storyId: string, viewportId: string): string[] {
  const failures: string[] = [];
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE))) {
    const rect = effectiveRect(el);
    if (rect.width === 0 && rect.height === 0) continue; // display:none branch (the drawer's sidebar at phone width)
    // WCAG 2.5.8's inline exception: a link inside a sentence is sized by the
    // prose around it and is exempt by the success criterion itself.
    if (getComputedStyle(el).display === "inline") continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const key = describeTarget(el);
    if (
      TAP_EXEMPT.some((x) => x.story === storyId && x.viewports.includes(viewportId) && key.includes(x.match))
    )
      continue;
    if (rect.width + 0.5 < 24 || rect.height + 0.5 < 24) {
      failures.push(`${key} ${Math.round(rect.width)}×${Math.round(rect.height)}`);
    }
  }
  return failures;
}

/** The sweep every screen story runs: for each viewport, resize once, then
 *  record whether the page scrolls sideways and which tappable things are
 *  under the floor. Every viewport is measured before anything is asserted,
 *  so one red run names every cell instead of stopping at the first. Same
 *  browser-only guard and viewport-restore discipline as
 *  style-axes.stories.tsx: the viewport is process-wide state. */
function sweep(storyId: string) {
  return async () => {
    if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return;
    const { page } = await import("vitest/browser");
    const root = document.documentElement;
    const prev = { w: window.innerWidth, h: window.innerHeight };
    const problems: string[] = [];
    try {
      for (const vp of VIEWPORTS) {
        await page.viewport(vp.w, vp.h);
        void root.offsetWidth; // force reflow before measuring
        if (root.scrollWidth > root.clientWidth) {
          problems.push(
            `[${storyId}/${vp.id}] horizontal scroll: scrollWidth ${root.scrollWidth} > clientWidth ${root.clientWidth}`,
          );
        }
        for (const failure of tapFailures(storyId, vp.id)) {
          problems.push(`[${storyId}/${vp.id}] under 24×24px: ${failure}`);
        }
      }
    } finally {
      await page.viewport(prev.w, prev.h);
    }
    await expect(problems, `${storyId}: spill or sub-floor controls`).toEqual([]);
  };
}

/* ————— Instrument control —————
   A clean sweep from an unproven scanner is this repo's recurring failure
   (a11y-baseline.md opens with an a11y gate that asserted nothing for a whole
   suite), so the instrument proves it can fire before any screen is allowed
   to pass it. The fixture is sized normally at rest and shrunk only inside
   the play, so the axe pass that follows the play measures a control that is
   not undersized; the assertion is about what the scanner reports on the
   shrunken geometry, not about shipping a 16px button. */

export const InstrumentControl: Story = {
  name: "Instrument control — the checks can fire",
  render: () => (
    <div className="p-4">
      <button
        type="button"
        data-testid="tap-fixture"
        className="bg-primary text-primary-foreground rounded-lg text-xs"
        style={{ width: 32, height: 32, padding: 0 }}
      >
        Fixture
      </button>
      <div data-testid="spill-fixture" style={{ width: 1, height: 1 }} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return;
    const { page } = await import("vitest/browser");
    const root = document.documentElement;
    const button = canvasElement.querySelector<HTMLElement>('[data-testid="tap-fixture"]');
    const spill = canvasElement.querySelector<HTMLElement>('[data-testid="spill-fixture"]');
    if (!button || !spill) throw new Error("instrument fixtures missing");
    const prev = { w: window.innerWidth, h: window.innerHeight };
    try {
      button.style.width = "16px";
      button.style.height = "16px";
      spill.style.width = "9000px";
      // Per viewport, not once: a sweep that silently kept the first viewport
      // for every later width would report the same green as a real one.
      for (const vp of VIEWPORTS) {
        await page.viewport(vp.w, vp.h);
        void root.offsetWidth;
        await expect(
          window.innerWidth,
          `control: page.viewport(${vp.w}) must actually resize; if this fails, later cells measure the previous viewport`,
        ).toBe(vp.w);
        await expect(
          root.scrollWidth,
          `control: a 9000px child must overflow a ${vp.id}px viewport; if this fails, the overflow check measures nothing`,
        ).toBeGreaterThan(root.clientWidth);
        await expect(
          tapFailures("instrument-control", vp.id).some((f) => f.startsWith("button") && f.includes("16×16")),
          `control: a 16×16 button must be flagged at ${vp.id}px; if this fails, the tap-target scanner is blind`,
        ).toBe(true);
      }
    } finally {
      button.style.width = "32px";
      button.style.height = "32px";
      spill.style.width = "1px";
      await page.viewport(prev.w, prev.h);
    }
  },
};

/* ————— The curated screens ————— */

export const HomeShell: Story = {
  name: "Home shell",
  render: () => <HomeShellDemo />,
  play: sweep("home-shell"),
};

export const ChatShell: Story = {
  name: "Chat shell",
  render: () => <ChatShellDemo />,
  play: sweep("chat-shell"),
};

export const StudioShell: Story = {
  name: "Studio shell",
  render: () => <StudioShellDemo />,
  play: sweep("studio-shell"),
};

export const LibraryShell: Story = {
  name: "Library shell",
  render: () => <LibraryShellDemo />,
  play: sweep("library-shell"),
};

export const SettingsShell: Story = {
  name: "Settings shell",
  render: () => <SettingsShellDemo />,
  play: sweep("settings-shell"),
};
