import * as React from "react";
import type { Preview } from "@storybook/react-vite";
import type { DocsContainer } from "@storybook/addon-docs/blocks";

import "../src/index.css";

/** The two document-level axes the workbench offers, and their boot values.
 *  `preview.initialGlobals` and the docs container's cold-boot fallback both
 *  read this, so a docs deep-link can never boot a different theme than the
 *  canvas. */
const INITIAL_GLOBALS = { theme: "light", direction: "ltr" };

/** The `dir` this preview last wrote, so it only ever removes its own.
 *  Several case stories set `document.documentElement.dir = "rtl"` themselves
 *  (`AccountMenu`, `TaskTray`, `WorkspaceSwitcher`, `ShortcutsSheet`) because a
 *  Base UI portal inherits direction from the document, and a child's effect
 *  runs before this decorator's: writing "ltr" unconditionally here clobbered
 *  theirs and failed four of their assertions (a11y run, 2026-09-04). */
let writtenDir: "rtl" | null = null;

/** Writes the axes onto <html>: the `.dark` class the token sheet keys on
 *  (`@custom-variant dark (&:is(.dark *))` in src/index.css) and, when the
 *  toolbar asks for it, the `dir` attribute. The story decorator and the docs
 *  container both call this from the same globals, so the canvas and the docs
 *  pages cannot disagree about what is on the document. */
function applyAxes(theme: string | undefined, direction: string | undefined) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  if (direction === "rtl") {
    root.setAttribute("dir", "rtl");
    writtenDir = "rtl";
  } else if (writtenDir === "rtl") {
    root.removeAttribute("dir");
    writtenDir = null;
  }
  document.body.style.backgroundColor = "var(--background)";
  document.body.style.color = "var(--foreground)";
}

/** The docs container and Storybook's docs themes, loaded only when a docs
 *  page renders. Importing `@storybook/addon-docs/blocks` at module scope
 *  would put it in the preview graph the vitest runner composes for every
 *  story file, and that extra weight was enough to expose a focus-timing race
 *  in `AccountMenu`'s `KeyboardOrder` story under parallel load (2026-09-04:
 *  the story passed alone and under the original preview, and failed only
 *  under the heavier one). Docs mode has already loaded this module by the
 *  time the container renders, so the lazy import resolves immediately there. */
const LazyDocsContainer = React.lazy(async () => {
  const [{ DocsContainer: Container }, { themes }] = await Promise.all([
    import("@storybook/addon-docs/blocks"),
    import("storybook/theming"),
  ]);
  function DocsContainerWithTheme({
    dark,
    ...props
  }: React.ComponentProps<typeof DocsContainer> & { dark: boolean }) {
    return <Container {...props} theme={dark ? themes.dark : themes.light} />;
  }
  return { default: DocsContainerWithTheme };
});

/** Docs-only MDX pages (Welcome, Guides, Foundations, Content) render no
 *  story, so the story decorator below never runs for them and the toolbar's
 *  theme would stop at the canvas. This container mirrors the globals onto the
 *  docs page instead: the `.dark` class for the token sheet, `dir` for the
 *  direction axis, and Storybook's own dark docs theme for the page chrome. It
 *  reads the boot globals, then follows toolbar changes over the channel. */
function ThemedDocsContainer(props: React.ComponentProps<typeof DocsContainer>) {
  const { channel } = props.context;
  const [globals, setGlobals] = React.useState<Record<string, string>>(() => {
    // channel.last() replays the boot-time globals emit, so the initial state
    // comes from the same event stream the subscription follows. On a cold
    // docs deep-link where no emit exists yet, fall back to the same
    // initialGlobals the preview declares, so docs boot the way the canvas does.
    const last = channel.last("globalsUpdated") as [{ globals?: Record<string, string> }] | undefined;
    return last?.[0]?.globals ?? INITIAL_GLOBALS;
  });
  React.useEffect(() => {
    const onUpdate = ({ globals }: { globals?: Record<string, string> }) => {
      // globalsUpdated carries the full merged globals object, not a delta.
      if (globals) setGlobals(globals);
    };
    channel.on("globalsUpdated", onUpdate);
    return () => channel.off("globalsUpdated", onUpdate);
  }, [channel]);
  const dark = globals.theme === "dark";
  // Layout effect: the class must land before paint or token-backed content
  // renders one frame in the previous theme.
  React.useLayoutEffect(() => {
    applyAxes(globals.theme, globals.direction);
  }, [globals.theme, globals.direction]);
  return (
    <React.Suspense fallback={null}>
      <LazyDocsContainer {...props} dark={dark} />
    </React.Suspense>
  );
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
    docs: {
      container: ThemedDocsContainer,
      toc: { headingSelector: "h2", title: "On this page" },
    },
    options: {
      storySort: {
        // Sidebar order. Welcome, Architecture and Changelog are root-level
        // docs on purpose: Storybook renders root docs above every folder
        // whatever this order says, which is the "read these first" layout
        // wanted here; they sort against each other by this list. Then the
        // Guides, the rulebook (Foundations, Content), and the three
        // component layers plus Marketing. Within-section arrays pin page
        // order; unlisted entries fall after these, alphabetically.
        //
        // Entries match one title segment each, so the shadcn section is
        // "shadcn" (its stories are titled "shadcn/ui/<Name>") — spelling it
        // "shadcn/ui" matches nothing and drops the whole section into the
        // unordered tail, which silently pushed it below Marketing. Nested
        // arrays order children. Marketing's subgroups are ordered explicitly
        // so the Storybook sidebar matches the docs sidebar
        // (lib/marketing-catalog.ts MARKETING_GROUPS); left unordered they
        // fall into story-file order (Text/Layout/Effects/Buttons).
        order: [
          "Welcome",
          "Architecture",
          "Changelog",
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
            "App structure",
            "Data Visualization",
            "Icon creation",
            "Inclusive design",
            "Navigation",
            "Theming",
            "Style axes",
            "Icons",
            "Mobile viewport",
          ],
          "Content",
          ["Voice & principles", "Writing mechanics", "Error messages", "Empty states", "Inclusive writing"],
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
    direction: {
      description: "Writing direction",
      toolbar: {
        title: "Direction",
        icon: "transfer",
        items: [
          { value: "ltr", title: "LTR" },
          { value: "rtl", title: "RTL" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: INITIAL_GLOBALS,
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? "light";
      const direction = context.globals.direction ?? "ltr";
      React.useEffect(() => {
        applyAxes(theme, direction);
      }, [theme, direction]);
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
