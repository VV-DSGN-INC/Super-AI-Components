import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

const meta: Meta<typeof Carousel> = {
  title: "shadcn/ui/Carousel",
  component: Carousel,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Carousel>;

const renders = [
  { seed: "alley", title: "Neon alley" },
  { seed: "forest", title: "Bioluminescent forest" },
  { seed: "desert", title: "Mars dunes" },
  { seed: "city", title: "Floating city" },
  { seed: "ocean", title: "Deep reef" },
];

export const Default: Story = {
  render: () => (
    <div className="px-12">
      <Carousel className="w-72">
        <CarouselContent>
          {renders.map((r) => (
            <CarouselItem key={r.seed}>
              <Card className="overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/${r.seed}/400/300`}
                  alt={r.title}
                  className="h-48 w-full object-cover"
                />
                <CardContent className="py-3 text-center font-medium">
                  {r.title}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const Variations: Story = {
  render: () => (
    <div className="px-12">
      <Carousel opts={{ align: "start" }} className="w-80">
        <CarouselContent>
          {Array.from({ length: 6 }).map((_, i) => (
            <CarouselItem key={i} className="basis-1/2">
              <div className="flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 text-lg font-semibold text-white">
                v{i + 1}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};
