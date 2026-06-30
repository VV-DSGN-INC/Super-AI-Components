import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof Table> = {
  title: "shadcn/ui/Table",
  component: Table,
  parameters: { layout: "centered" },
};

export default meta;

type Story = StoryObj<typeof Table>;

type Generation = {
  prompt: string;
  model: string;
  cost: number;
  status: "Ready" | "Rendering" | "Failed" | "Queued";
};

const generations: Generation[] = [
  {
    prompt: "neon koi pond at dusk, cinematic",
    model: "Aurora XL",
    cost: 12,
    status: "Ready",
  },
  {
    prompt: "isometric cozy coffee shop, 3D",
    model: "Aurora XL",
    cost: 12,
    status: "Ready",
  },
  {
    prompt: "portrait of an astronaut, film grain",
    model: "Lumina v2",
    cost: 8,
    status: "Rendering",
  },
  {
    prompt: "watercolor mountains at sunrise",
    model: "Sketch Mini",
    cost: 3,
    status: "Queued",
  },
  {
    prompt: "cyberpunk street market, rain",
    model: "Aurora XL",
    cost: 12,
    status: "Failed",
  },
  {
    prompt: "minimal logo, single line, gold",
    model: "Lumina v2",
    cost: 8,
    status: "Ready",
  },
];

const statusVariant: Record<
  Generation["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  Ready: "default",
  Rendering: "secondary",
  Queued: "outline",
  Failed: "destructive",
};

export const Default: Story = {
  render: () => (
    <div className="w-[36rem]">
      <Table>
        <TableCaption>Recent image generations</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Prompt</TableHead>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {generations.map((row) => (
            <TableRow key={row.prompt}>
              <TableCell className="max-w-[18rem] truncate font-medium">
                {row.prompt}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.model}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.cost} cr
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total spent</TableCell>
            <TableCell className="text-right tabular-nums">
              {generations.reduce((sum, r) => sum + r.cost, 0)} cr
            </TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  ),
};
