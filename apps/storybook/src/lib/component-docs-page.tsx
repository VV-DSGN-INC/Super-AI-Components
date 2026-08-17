import { Controls, Primary, Stories, Subtitle, Title } from "@storybook/addon-docs/blocks";

import type { ComponentDocs } from "@/lib/component-docs";
import { ComponentDocsView } from "@/components/component-docs";
import { DEFAULT_LOCALE } from "@/lib/i18n/types";

/**
 * The docs page every super-ai story uses. Same guidance renderer as the docs
 * site, so the two surfaces cannot describe a component differently.
 * Storybook has no locale switcher, so this always renders the default locale.
 */
export const componentDocsPage = (docs: ComponentDocs) =>
  function DocsPage() {
    return (
      <>
        <Title />
        <Subtitle />
        <ComponentDocsView docs={docs} locale={DEFAULT_LOCALE} />
        <Primary />
        <Controls />
        <Stories />
      </>
    );
  };
