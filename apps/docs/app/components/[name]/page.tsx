import fs from "node:fs";
import path from "node:path";

import { notFound } from "next/navigation";

import ChoiceChipsDemo from "@/components/demos/choice-chips-demo";
import CostChipDemo from "@/components/demos/cost-chip-demo";
import DateSectionDemo from "@/components/demos/date-section-demo";
import DotPatternDemo from "@/components/demos/dot-pattern-demo";
import FieldRowDemo from "@/components/demos/field-row-demo";
import FilterBarDemo from "@/components/demos/filter-bar-demo";
import GenSettingsBarDemo from "@/components/demos/gen-settings-bar-demo";
import KbdDemo from "@/components/demos/kbd-demo";
import ShortcutsSheetDemo from "@/components/demos/shortcuts-sheet-demo";
import ThreadListDemo from "@/components/demos/thread-list-demo";
import { PreviewTabs } from "@/components/preview-tabs";
import { CATALOG, CATALOG_ITEMS, type CatalogName } from "@/lib/catalog";
import { MARKETING, MARKETING_ITEMS, type MarketingName } from "@/lib/marketing-catalog";

const demos: Record<CatalogName, React.ComponentType> = {
  kbd: KbdDemo,
  "cost-chip": CostChipDemo,
  "date-section": DateSectionDemo,
  "choice-chips": ChoiceChipsDemo,
  "filter-bar": FilterBarDemo,
  "field-row": FieldRowDemo,
  "gen-settings-bar": GenSettingsBarDemo,
  "shortcuts-sheet": ShortcutsSheetDemo,
  "thread-list": ThreadListDemo,
};

// Grows one entry per component task (Tasks 6–20).
const marketingDemos: Record<MarketingName, React.ComponentType> = {
  "dot-pattern": DotPatternDemo,
};

export function generateStaticParams() {
  return [...CATALOG, ...MARKETING].map((name) => ({ name }));
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const isMarketing = MARKETING.includes(name);
  if (!CATALOG.includes(name as CatalogName) && !isMarketing) notFound();

  const item = isMarketing
    ? MARKETING_ITEMS.find((i) => i.name === name)!
    : CATALOG_ITEMS.find((i) => i.name === name)!;
  const Demo = isMarketing ? marketingDemos[name] : demos[name as CatalogName];
  if (!Demo) {
    throw new Error(
      `No demo registered for "${name}" in ${isMarketing ? "marketingDemos" : "demos"}`,
    );
  }

  const demoSource = fs.readFileSync(
    path.join(process.cwd(), "components/demos", `${name}-demo.tsx`),
    "utf8",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{item.title}</h1>
        <p className="text-muted-foreground mt-2">{item.description}</p>
      </div>

      <PreviewTabs preview={<Demo />} code={demoSource} />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Installation</h2>
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
          <code>{`npx shadcn@latest add https://super-ai-components.vercel.app/r/${name}.json`}</code>
        </pre>
      </div>
    </div>
  );
}
