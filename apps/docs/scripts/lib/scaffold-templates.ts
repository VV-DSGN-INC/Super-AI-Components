import type { ManifestItem } from "../../lib/manifest-types";

const pascal = (name: string) =>
  name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

/**
 * Manifest `states` are free text copied from catalog.md — they can contain
 * spaces, slashes, digits at the start, or be empty. A story export name
 * must be a valid JS identifier, so this splits on any run of non
 * alphanumeric characters, title-cases each surviving word, and falls back
 * to a safe default when the result would be empty or start with a digit.
 */
export const statePascal = (state: string): string => {
  const words = state.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  const ident = words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
  if (!ident) return "State";
  return /^[0-9]/.test(ident) ? `State${ident}` : ident;
};

export function renderScaffold(item: ManifestItem): Record<string, string> {
  const Comp = pascal(item.name);

  const component = `import { cn } from "@/lib/utils";

/**
 * ${item.title} — ${item.description}
 *
 * Spec: docs/design-system/${item.specAnchor}
 * States: ${item.states.join(" · ")}
 */
export function ${Comp}({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="${item.name}" className={cn(className)} {...props} />;
}
`;

  const test = `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ${Comp} } from "./${item.name}";

describe("${Comp}", () => {
${item.states
  .map(
    (state) => `  it("renders the ${state} state", () => {
    expect.fail("implement the ${state} state per docs/design-system/${item.specAnchor}");
  });
`,
  )
  .join("\n")}
  it("passes className through", () => {
    render(<${Comp} className="test-class" />);
    expect(document.querySelector('[data-slot="${item.name}"]')!.className).toContain("test-class");
  });
});
`;

  const demo = `"use client";

import { ${Comp} } from "@/registry/super-ai/${item.name}";

export default function ${Comp}Demo() {
  return <${Comp} />;
}
`;

  const docs = `import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/${item.specAnchor}.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 */
export const ${Comp}Docs: ComponentDocs = {
  whatItIs: "${item.description}",
  whyItMatters: "",
  evidence: [],
  anatomy: [],
  usage: "",
  dos: [],
  donts: [],
  pitfalls: [],
};
`;

  const story = `import type { Meta, StoryObj } from "@storybook/react-vite";

import { ${Comp} } from "@/registry/super-ai/${item.name}";
import { ${Comp}Docs } from "@/content/components/${item.name}.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof ${Comp}> = {
  title: "Super AI/${item.title}",
  component: ${Comp},
  parameters: { layout: "centered", docs: { page: componentDocsPage(${Comp}Docs) } },
};

export default meta;
type Story = StoryObj<typeof ${Comp}>;

${item.states.map((state) => `export const ${statePascal(state)}: Story = {};`).join("\n")}
`;

  return {
    [`registry/super-ai/${item.name}.tsx`]: component,
    [`registry/super-ai/${item.name}.test.tsx`]: test,
    [`components/demos/${item.name}-demo.tsx`]: demo,
    [`content/components/${item.name}.docs.tsx`]: docs,
    [`../storybook/src/stories/super-ai/${Comp}.stories.tsx`]: story,
  };
}
