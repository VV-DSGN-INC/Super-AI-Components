import type { StorybookConfig } from "@storybook/react-vite";
import remarkGfm from "remark-gfm";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    // Storybook's MDX pipeline is CommonMark only, so a pipe table renders as
    // literal pipes rather than a <table>. Several docs pages state genuinely
    // tabular facts (the browser floor, the CI step list, the documentation
    // surfaces), and remark-gfm is what makes those render as tables.
    {
      name: "@storybook/addon-docs",
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    reactDocgen: "react-docgen",
  },
  // The docs tier pulls these two npm packages in only when a docs page or
  // the Icons story is opened. Left to discovery, Vite re-optimises on the
  // first visit and reloads the preview mid-render ("optimized dependencies
  // changed"), which read as blank pages while verifying the tier on
  // 2026-09-04. Naming them up front makes the first visit render like every
  // later one. Storybook's own packages must NOT be listed here: the builder
  // serves them unoptimised through @fs, and pre-bundling a second copy of
  // @storybook/addon-docs/blocks or storybook/theming gives the docs renderer
  // and the MDX pages different module instances, which rendered every docs
  // page blank in the manager (same date).
  viteFinal: async (config) => ({
    ...config,
    optimizeDeps: {
      ...config.optimizeDeps,
      include: [...(config.optimizeDeps?.include ?? []), "@mdx-js/react", "lucide-react"],
    },
  }),
};

export default config;
