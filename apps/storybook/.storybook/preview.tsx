import * as React from "react";
import type { Preview } from "@storybook/react-vite";

import "../src/index.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
    options: {
      storySort: {
        // Entries match one title segment each, so the shadcn section is "shadcn"
        // (its stories are titled "shadcn/ui/<Name>") — spelling it "shadcn/ui"
        // matches nothing and drops the whole section into the unordered tail,
        // which silently pushed it below Marketing. Nested arrays order children.
        // Marketing's subgroups are ordered explicitly so the Storybook sidebar
        // matches the docs sidebar (lib/marketing-catalog.ts MARKETING_GROUPS);
        // left unordered they fall into story-file order (Text/Layout/Effects/Buttons).
        order: [
          "Overview",
          "Super AI",
          "AI Elements",
          "shadcn",
          ["ui"],
          "Marketing",
          ["Layout", "Text", "Buttons", "Effects"],
        ],
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Color theme",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light";
      React.useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        document.body.style.backgroundColor = "var(--background)";
        document.body.style.color = "var(--foreground)";
      }, [theme]);
      return (
        <div className="bg-background text-foreground" data-theme={theme}>
          <Story />
        </div>
      );
    },
  ],
  tags: ["autodocs"],
};

export default preview;
