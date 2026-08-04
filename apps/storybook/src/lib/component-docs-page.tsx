import { Controls, Primary, Stories, Subtitle, Title } from "@storybook/addon-docs/blocks";

import type { ComponentDocs } from "@/lib/component-docs";
import { ComponentDocsView } from "@/components/component-docs";

/**
 * The docs page every super-ai story uses. Same guidance renderer as the docs
 * site, so the two surfaces cannot describe a component differently.
 */
export const componentDocsPage = (docs: ComponentDocs) =>
  function DocsPage() {
    return (
      <>
        <Title />
        <Subtitle />
        <ComponentDocsView docs={docs} />
        <Primary />
        <Controls />
        <Stories />
      </>
    );
  };
