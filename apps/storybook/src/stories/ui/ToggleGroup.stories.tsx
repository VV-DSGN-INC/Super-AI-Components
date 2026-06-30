import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  RectangleHorizontal,
  RectangleVertical,
  Square,
} from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const meta: Meta<typeof ToggleGroup> = {
  title: "shadcn/ui/Toggle Group",
  component: ToggleGroup,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof ToggleGroup>;

const aspectRatios = [
  { value: "1:1", label: "1:1", icon: Square },
  { value: "16:9", label: "16:9", icon: RectangleHorizontal },
  { value: "9:16", label: "9:16", icon: RectangleVertical },
  { value: "4:3", label: "4:3", icon: RectangleHorizontal },
];

export const Default: Story = {
  // Base UI ToggleGroup value is an array; single-select keeps one entry.
  render: () => {
    function AspectRatioGroup() {
      const [value, setValue] = React.useState<string[]>(["1:1"]);
      return (
        <div className="flex flex-col items-center gap-3">
          <ToggleGroup
            variant="outline"
            value={value}
            onValueChange={setValue}
          >
            {aspectRatios.map(({ value: v, label, icon: Icon }) => (
              <ToggleGroupItem key={v} value={v} aria-label={`Aspect ratio ${label}`}>
                <Icon />
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            Output: {value[0] ?? "none"}
          </p>
        </div>
      );
    }
    return <AspectRatioGroup />;
  },
};

export const TextAlign: Story = {
  render: () => {
    function AlignGroup() {
      const [value, setValue] = React.useState<string[]>(["left"]);
      return (
        <ToggleGroup spacing={0} value={value} onValueChange={setValue}>
          <ToggleGroupItem value="left" aria-label="Align left">
            <AlignLeft />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            <AlignCenter />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <AlignRight />
          </ToggleGroupItem>
        </ToggleGroup>
      );
    }
    return <AlignGroup />;
  },
};

export const MultiSelect: Story = {
  render: () => {
    function StyleTags() {
      const [value, setValue] = React.useState<string[]>(["cinematic", "hdr"]);
      const tags = ["cinematic", "hdr", "moody", "vibrant", "film grain"];
      return (
        <div className="flex flex-col items-center gap-3">
          <ToggleGroup
            multiple
            variant="outline"
            value={value}
            onValueChange={setValue}
            className="flex-wrap"
          >
            {tags.map((tag) => (
              <ToggleGroupItem key={tag} value={tag} size="sm">
                {tag}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            {value.length} modifier{value.length === 1 ? "" : "s"} active
          </p>
        </div>
      );
    }
    return <StyleTags />;
  },
};
