import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { DerivedTable } from "@/components/system/derived-table";
import { FigureFrame } from "@/components/system/figure-frame";
import { GatesTable } from "@/components/system/gates-table";
import { HarnessParts } from "@/components/system/harness-parts";
import { DERIVED_ROWS } from "@/content/system/derived";
import facts from "@/content/system/facts.json";
import { GATE_ROWS } from "@/content/system/gates";

/**
 * The figures and lists from the Harness and Architecture pages, one story
 * each, so the a11y gate renders them. MDX pages are not stories and axe never
 * sees them. This file lives outside `stories/super-ai/` on purpose: the
 * contract gates map catalog names to that folder and must not claim it.
 */
const meta: Meta = {
  title: "System/Figures",
  parameters: { layout: "padded" },
};

export default meta;
type Story = StoryObj;

/** Nothing scrolls sideways inside a 375px column. */
const noSidewaysScroll: Story["play"] = async ({ canvasElement }) => {
  const column = canvasElement.querySelector('[data-narrow="true"]') as HTMLElement;
  await expect(column).not.toBeNull();
  await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
  for (const child of Array.from(column.querySelectorAll<HTMLElement>("[data-slot]"))) {
    await expect(child.scrollWidth).toBeLessThanOrEqual(child.clientWidth);
  }
};

const Narrow = ({ children }: { children: React.ReactNode }) => (
  <div data-narrow="true" className="w-[375px]">
    {children}
  </div>
);

export const HarnessPartsFigure: Story = {
  render: () => (
    <FigureFrame id="harness-parts" caption="The harness, part by part.">
      <HarnessParts facts={facts} />
    </FigureFrame>
  ),
};

export const HarnessPartsNarrow: Story = {
  render: () => (
    <Narrow>
      <FigureFrame id="harness-parts" caption="The harness, part by part.">
        <HarnessParts facts={facts} />
      </FigureFrame>
    </Narrow>
  ),
  play: noSidewaysScroll,
};

export const Gates: Story = { render: () => <GatesTable rows={GATE_ROWS} /> };

export const GatesNarrow: Story = {
  render: () => (
    <Narrow>
      <GatesTable rows={GATE_ROWS} />
    </Narrow>
  ),
  play: noSidewaysScroll,
};

export const Derived: Story = { render: () => <DerivedTable rows={DERIVED_ROWS} /> };

export const DerivedNarrow: Story = {
  render: () => (
    <Narrow>
      <DerivedTable rows={DERIVED_ROWS} />
    </Narrow>
  ),
  play: noSidewaysScroll,
};
