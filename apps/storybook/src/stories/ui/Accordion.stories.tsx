import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const meta: Meta<typeof Accordion> = {
  title: "shadcn/ui/Accordion",
  component: Accordion,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <Accordion defaultValue={["models"]} className="w-96">
      <AccordionItem value="models">
        <AccordionTrigger>Which models can I run?</AccordionTrigger>
        <AccordionContent>
          <p>
            Aurora Studio ships with Aurora-XL for photoreal renders, Sketch-v3
            for fast concepts, and Lumen-Turbo for live previews. You can switch
            models per-thread without losing your prompt history.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="credits">
        <AccordionTrigger>How are credits charged?</AccordionTrigger>
        <AccordionContent>
          <p>
            A standard 1024&times;1024 render costs 4 credits. Upscales add 2
            credits and video frames are billed at 1 credit each. Your plan
            refreshes 5,000 credits on the 1st of every month.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="exports">
        <AccordionTrigger>What export formats are supported?</AccordionTrigger>
        <AccordionContent>
          <p>
            Export to PNG, WebP, and layered PSD. Pro workspaces unlock 8K TIFF
            and transparent-background cutouts. See the{" "}
            <a href="#">export guide</a> for batch options.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const MultipleOpen: Story = {
  render: () => (
    <Accordion multiple defaultValue={["latency", "safety"]} className="w-96">
      <AccordionItem value="latency">
        <AccordionTrigger>Reduce generation latency</AccordionTrigger>
        <AccordionContent>
          <p>
            Enable Turbo sampling and drop steps to 20. Most prompts finish in
            under 3 seconds on Lumen-Turbo.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="safety">
        <AccordionTrigger>Content safety filters</AccordionTrigger>
        <AccordionContent>
          <p>
            The default safety layer blocks unsafe outputs. Workspace admins can
            tune sensitivity in Settings &rarr; Moderation.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
