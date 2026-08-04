import * as React from "react";
import type { Preview } from "@storybook/react-vite";

import "../src/index.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    // @storybook/addon-a11y defaults parameters.a11y.test to "todo", which
    // only records violations as warnings and never fails the vitest run
    // (see addon-a11y's preview.mjs: getMode() only returns "failed", which
    // triggers `expect(result).toHaveNoViolations()`, when test === "error").
    // Without this, the whole a11y gate is silent — set here so it's the
    // default contract for every story, not opt-in per story.
    //
    // `context.exclude` is axe-core's own context parameter (see addon-a11y's
    // preview.mjs `run()`: `input.context.exclude` is concatenated onto the
    // addon's own default excludes, then the whole `context` object is passed
    // straight to `axe.run(context, options)` — this is not an addon-invented
    // option, it's axe-core's documented context.exclude, verified by reading
    // dist/preview.mjs in node_modules). `[data-base-ui-focus-guard]` is the
    // attribute Base UI's `FocusGuard` component (utils/FocusGuard.js) stamps
    // on every popup focus-trap span it renders — see
    // docs/design-system/a11y-baseline.md for why this is excluded and why
    // the exclusion must not be widened beyond this exact selector.
    a11y: { test: "error", context: { exclude: ["[data-base-ui-focus-guard]"] } },
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
