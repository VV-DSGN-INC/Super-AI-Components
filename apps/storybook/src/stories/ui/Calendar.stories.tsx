import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/components/ui/calendar";

const meta: Meta<typeof Calendar> = {
  title: "shadcn/ui/Calendar",
  component: Calendar,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        className="rounded-xl border"
      />
    );
  },
};

export const UsageRange: Story = {
  render: () => {
    const [range, setRange] = React.useState<DateRange | undefined>(() => {
      const from = new Date();
      from.setDate(from.getDate() - 5);
      return { from, to: new Date() };
    });
    return (
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={2}
        className="rounded-xl border"
      />
    );
  },
};

export const WithDropdowns: Story = {
  render: () => {
    const [date, setDate] = React.useState<Date | undefined>(new Date());
    return (
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        captionLayout="dropdown"
        className="rounded-xl border"
      />
    );
  },
};
