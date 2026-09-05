import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Button } from "@/components/ui/button";

/* One assertion per axis, not one per component. If the preview decorator
   stops applying an axis, every story silently loses it, so the axis itself is
   what gets tested here. The workbench has two document-level axes, written
   onto <html> by .storybook/preview.tsx from the toolbar globals: the theme
   (a `.dark` class, which is what the token sheet's dark variant keys on) and
   the writing direction (a `dir` attribute). Reduced motion and the phone
   viewport are not toolbar axes; the two stories for them state what the test
   runner does about each, because that is where they are enforced. */

const meta = {
  title: "Foundations/Style axes",
  component: Button,
  args: { children: "Generate a render" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DarkApplies: Story = {
  name: "Dark — the class reaches the document",
  globals: { theme: "dark" },
  play: async () => {
    await expect(document.documentElement.classList.contains("dark")).toBe(true);
  },
};

export const RtlApplies: Story = {
  name: "RTL — direction reaches the document",
  globals: { direction: "rtl" },
  play: async () => {
    await expect(document.documentElement.getAttribute("dir")).toBe("rtl");
  },
};

/** Reads the media feature live, so the workbench shows which form of a
 *  component you are looking at right now. */
function ReducedMotionNote() {
  const [reduced, setReduced] = React.useState<boolean | null>(null);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return (
    <p role="status" className="text-muted-foreground max-w-sm text-xs">
      {reduced === null
        ? "Reading the media feature…"
        : reduced
          ? "This browser prefers reduced motion. Components that branch on the media feature are showing their reduced form."
          : "This browser does not prefer reduced motion. Under pnpm test:stories every story renders with it on."}
    </p>
  );
}

export const ReducedMotionApplies: Story = {
  name: "Reduced motion — the runner emulates the preference",
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <Button {...args} />
      <ReducedMotionNote />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "There is no reduced-motion toolbar. apps/storybook/vitest.config.ts sets Playwright's `reducedMotion: \"reduce\"` for every test, so the axe gate always measures the reduced form, and a component only differs there if it branches on the media feature (story-conventions.md, fact 3). This story asserts that the emulation is on under the runner; in the workbench it reports your own browser's preference and asserts nothing.",
      },
    },
  },
  play: async () => {
    // Under the runner only: the workbench's own browser has whatever
    // preference its OS has, and asserting on that would fail on correct code.
    if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return;
    await expect(window.matchMedia("(prefers-reduced-motion: reduce)").matches).toBe(true);
  },
};

export const MobileApplies: Story = {
  name: "Mobile — 375px viewport has no horizontal scroll",
  decorators: [
    (StoryFn) => (
      // Storybook cannot resize its own preview iframe, so the workbench gets
      // a stand-in rather than the axis itself: a column exactly as wide as
      // the phone the assertion measures, drawn with a dashed rule so the
      // width is visible rather than implied. `min()` keeps the column from
      // exceeding a narrow panel, and from being the element that overflows
      // once the runner really does resize to 375. Same wrapper the `Mobile`
      // case story uses across the registry (story-conventions.md, fact 2).
      <div className="border-border w-[min(375px,100%)] border border-dashed p-4">
        <StoryFn />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          "The 375px column is a drawing of the axis, not the assertion. The assertion resizes the real browser viewport and therefore only runs under `pnpm test:stories`; opened in the workbench this story renders the column and asserts nothing. The curated screens are swept in Foundations → Mobile viewport.",
      },
    },
  },
  play: async () => {
    // `vitest/browser` must not be imported at module scope: outside browser
    // mode it resolves to a module whose body throws, and Storybook's Vite
    // builder resolves it like any other import. The guard, not the dynamic
    // import, is what keeps the workbench safe, because Storybook auto-runs
    // play functions and an unguarded import would throw in the Interactions
    // panel instead of the page.
    if (!(globalThis as { __vitest_browser__?: boolean }).__vitest_browser__) return;
    const { page } = await import("vitest/browser");
    const { innerWidth, innerHeight } = window;
    await page.viewport(375, 667);
    try {
      const root = document.documentElement;
      await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    } finally {
      // Restore, because the viewport is process-wide state: a later story
      // in any file would otherwise render at phone width and attribute
      // whatever it found there to itself.
      await page.viewport(innerWidth, innerHeight);
    }
  },
};
