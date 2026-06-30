import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

const meta: Meta<typeof ChartContainer> = {
  title: "shadcn/ui/Chart",
  component: ChartContainer,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof ChartContainer>;

const usageData = [
  { day: "Mon", images: 86, videos: 12 },
  { day: "Tue", images: 124, videos: 18 },
  { day: "Wed", images: 98, videos: 9 },
  { day: "Thu", images: 152, videos: 24 },
  { day: "Fri", images: 210, videos: 31 },
  { day: "Sat", images: 178, videos: 27 },
  { day: "Sun", images: 96, videos: 14 },
];

const usageConfig = {
  images: { label: "Images", color: "var(--chart-1, #6366f1)" },
  videos: { label: "Videos", color: "var(--chart-2, #ec4899)" },
} satisfies ChartConfig;

export const CreditsBar: Story = {
  render: () => (
    <ChartContainer config={usageConfig} className="h-56 w-96">
      <BarChart data={usageData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="images" fill="var(--color-images)" radius={4} />
        <Bar dataKey="videos" fill="var(--color-videos)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

const latencyData = [
  { hour: "00", ms: 2400 },
  { hour: "04", ms: 1800 },
  { hour: "08", ms: 3200 },
  { hour: "12", ms: 4100 },
  { hour: "16", ms: 3600 },
  { hour: "20", ms: 2900 },
];

const latencyConfig = {
  ms: { label: "Latency (ms)", color: "var(--chart-3, #14b8a6)" },
} satisfies ChartConfig;

export const LatencyArea: Story = {
  render: () => (
    <ChartContainer config={latencyConfig} className="h-56 w-96">
      <AreaChart data={latencyData}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="ms"
          type="monotone"
          fill="var(--color-ms)"
          fillOpacity={0.25}
          stroke="var(--color-ms)"
        />
      </AreaChart>
    </ChartContainer>
  ),
};
