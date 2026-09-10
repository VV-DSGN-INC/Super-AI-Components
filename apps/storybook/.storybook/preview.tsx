import * as React from "react";
import type { Preview } from "@storybook/react-vite";
import { DocsContainer } from "@storybook/addon-docs/blocks";
import { themes } from "storybook/theming";

import "../src/index.css";

type ThemedDocsContainerProps = React.ComponentProps<typeof DocsContainer>;
type GlobalsUpdate = { globals?: { theme?: string } };

function readTheme(channel: ThemedDocsContainerProps["context"]["channel"]) {
  // channel.last() replays the boot-time globals emit, so the initial theme
  // comes from the same public event stream the subscription follows.
  const last = channel.last("globalsUpdated") as [GlobalsUpdate] | undefined;
  return last?.[0]?.globals?.theme === "dark";
}

/** Docs-only MDX pages (the Guides, Foundations, Content and Patterns
 *  sections) have no story decorators, so the `theme` global never reaches
 *  them. This container mirrors it: `.dark` on <html> for the tokens, and
 *  Storybook's own dark docs theme for the page chrome. It reads the boot-time
 *  globals from the channel's replay, then follows toolbar changes. The story
 *  decorator below toggles the same class from the same global, so the two
 *  overlap idempotently rather than fighting.
 *
 *  A class, not hooks, on purpose. In `storybook dev` the docs renderer drives
 *  this container's first render from a React instance whose dispatcher is
 *  not the one `import React from "react"` binds here, so `useState` threw
 *  "Invalid hook call" on every docs page load and only the error boundary's
 *  retry rendered it (measured 2026-09-09, Storybook 9.1.20 with Vite). A
 *  class component needs no dispatcher: react-dom duck-types it through
 *  `prototype.isReactComponent`, so it renders cleanly from either instance.
 *  `componentDidMount` runs before paint, like a layout effect, so the class
 *  lands before token-coloured content draws. */
class ThemedDocsContainer extends React.Component<ThemedDocsContainerProps, { dark: boolean }> {
  state = { dark: readTheme(this.props.context.channel) };

  onUpdate = ({ globals }: GlobalsUpdate) => {
    if (globals && "theme" in globals) this.setState({ dark: globals.theme === "dark" });
  };

  componentDidMount() {
    this.props.context.channel.on("globalsUpdated", this.onUpdate);
    this.apply();
  }

  componentDidUpdate() {
    this.apply();
  }

  componentWillUnmount() {
    this.props.context.channel.off("globalsUpdated", this.onUpdate);
  }

  apply() {
    document.documentElement.classList.toggle("dark", this.state.dark);
  }

  render() {
    return <DocsContainer {...this.props} theme={this.state.dark ? themes.dark : themes.light} />;
  }
}

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
    docs: { container: ThemedDocsContainer },
    options: {
      storySort: {
        // Entries match one title segment each, so the shadcn section is "shadcn"
        // (its stories are titled "shadcn/ui/<Name>") — spelling it "shadcn/ui"
        // matches nothing and drops the whole section into the unordered tail,
        // which silently pushed it below Marketing. Nested arrays order children.
        // Marketing's subgroups are ordered explicitly so the Storybook sidebar
        // matches the docs sidebar (lib/marketing-catalog.ts MARKETING_GROUPS);
        // left unordered they fall into story-file order (Text/Layout/Effects/Buttons).
        // The four guidance sections sit between Overview and the component
        // catalogs, each with its page order pinned. A new guidance page is
        // added to its array here or it falls to the bottom of its section.
        order: [
          "Overview",
          "Guides",
          [
            "Getting Started",
            "Contributing",
            "Documentation Guidelines",
            "Component Lifecycle",
            "Browser Support",
          ],
          "Foundations",
          [
            "Principles",
            "Design Tokens",
            "Color",
            "Typography",
            "Layout & spacing",
            "States",
            "Motion",
            "Iconography",
            "Icon creation",
            "Inclusive design",
            "Navigation",
            "App structure",
            "Data Visualization",
            "Theming",
          ],
          "Content",
          ["Voice & principles", "Writing mechanics", "Error messages", "Empty states", "Inclusive writing"],
          "Patterns",
          [
            "Resource index",
            "Resource details",
            "Forms & wizards",
            "Actions & confirmation",
            "Status & feedback",
            "Loading states",
            "AI conversation",
          ],
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
