import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Bold, Italic, Pin, Star } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";

const meta: Meta<typeof Toggle> = {
  title: "shadcn/ui/Toggle",
  component: Toggle,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => {
    function FavoriteToggle() {
      const [favorited, setFavorited] = React.useState(true);
      return (
        <div className="flex flex-col items-center gap-3">
          <Toggle
            variant="outline"
            aria-label="Favorite this generation"
            pressed={favorited}
            onPressedChange={setFavorited}
          >
            <Star className={favorited ? "fill-current" : undefined} />
            {favorited ? "Favorited" : "Favorite"}
          </Toggle>
          <p className="text-xs text-muted-foreground">
            {favorited ? "Saved to your favorites" : "Not in favorites"}
          </p>
        </div>
      );
    }
    return <FavoriteToggle />;
  },
};

export const PinIcon: Story = {
  render: () => {
    function PinToggle() {
      const [pinned, setPinned] = React.useState(false);
      return (
        <Toggle
          size="sm"
          aria-label="Pin to canvas"
          pressed={pinned}
          onPressedChange={setPinned}
        >
          <Pin className={pinned ? "fill-current" : undefined} />
        </Toggle>
      );
    }
    return <PinToggle />;
  },
};

export const Formatting: Story = {
  render: () => {
    function FormattingToggles() {
      const [bold, setBold] = React.useState(true);
      const [italic, setItalic] = React.useState(false);
      return (
        <div className="flex items-center gap-1.5">
          <Toggle
            variant="outline"
            aria-label="Bold"
            pressed={bold}
            onPressedChange={setBold}
          >
            <Bold />
          </Toggle>
          <Toggle
            variant="outline"
            aria-label="Italic"
            pressed={italic}
            onPressedChange={setItalic}
          >
            <Italic />
          </Toggle>
        </div>
      );
    }
    return <FormattingToggles />;
  },
};
