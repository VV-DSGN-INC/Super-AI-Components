import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cpu, Layers, Zap } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { BentoCard, BentoGrid } from "@/components/marketing/bento-grid";
import BentoGridDemo from "@/components/marketing/demos/bento-grid-demo";
import { settledFocusRing } from "@/lib/focus-ring";

const meta: Meta<typeof BentoGridDemo> = {
  title: "Marketing/Layout/Bento Grid",
  component: BentoGridDemo,
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj<typeof BentoGridDemo>;

export const Default: Story = {};

/** Cards with links, so there is something to tab to. Hash hrefs: a play never activates them. */
function LinkedGrid() {
  return (
    <BentoGrid className="max-w-2xl">
      <BentoCard
        className="sm:col-span-2"
        name="Batteries included"
        description="Auth, billing, and analytics wired on day one."
        icon={<Layers />}
        href="#batteries"
        cta="See what ships"
      />
      <BentoCard
        name="Fast by default"
        description="Edge-rendered, everywhere."
        icon={<Zap />}
        href="#performance"
        cta="Read the benchmarks"
      />
      <BentoCard name="Own your stack" description="Eject anything, anytime." icon={<Cpu />} />
    </BentoGrid>
  );
}

/**
 * A real phone, not a 375px box: the grid's columns key on `sm` and `lg`, so
 * the play moves the breakpoint with `page.viewport` (story-conventions.md
 * fact 2) rather than squeezing the desktop layout. Before the fix the grid
 * was `grid-cols-3` at every width, three columns of about 100px each on a
 * phone, with the demo's `col-span-2` cards half the screen.
 *
 * Asserted: one column track (dictated by `grid-cols-1`, so portable per D21),
 * every card spans the full grid, and the grid sets no horizontal overflow on
 * the page. A bare `col-span-2` here would add an implicit second column; the
 * fixture uses `sm:col-span-2`, which the component's doc comment asks for.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="w-full">
      <LinkedGrid />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    const grid = canvasElement.querySelector<HTMLElement>('[data-slot="bento-grid"]')!;
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await waitFor(() => expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(1));
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-slot="bento-card"]'));
    await expect(cards).toHaveLength(3);
    for (const card of cards) {
      await expect(card.getBoundingClientRect().width).toBe(grid.getBoundingClientRect().width);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * The tab sequence is the cards' links and nothing else, in reading order: a
 * card without `href` contributes no stop (it used to render a "Learn more"
 * link to `#`, a dead stop with a name that says nothing out of context).
 *
 * At every stop the link is `:focus-visible`, paints a settled ring (it had
 * no focus style before), and its hover-revealed row is fully visible, because
 * the reveal also keys on `group-focus-within`. The closing Tab leaves the
 * grid. The links are never activated: a real navigation closes the test
 * browser (story-conventions.md fact 6).
 */
export const KeyboardOrder: Story = {
  render: () => <LinkedGrid />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole("link");
    await expect(links.map((l) => l.textContent)).toEqual(["See what ships", "Read the benchmarks"]);

    for (const link of links) {
      await userEvent.tab();
      await waitFor(() => expect(document.activeElement).toBe(link));
      await expect(link.matches(":focus-visible")).toBe(true);
      await settledFocusRing(link, waitFor);
      const reveal = link.closest<HTMLElement>('[data-slot="bento-card-cta"]')!;
      await waitFor(() => expect(getComputedStyle(reveal).opacity).toBe("1"));
    }

    await userEvent.tab();
    await expect(canvasElement.contains(document.activeElement)).toBe(false);
  },
};
