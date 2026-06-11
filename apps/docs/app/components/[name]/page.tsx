import { notFound } from "next/navigation";

import ChoiceChipsDemo from "@/components/demos/choice-chips-demo";
import CostChipDemo from "@/components/demos/cost-chip-demo";
import DateSectionDemo from "@/components/demos/date-section-demo";
import FieldRowDemo from "@/components/demos/field-row-demo";
import FilterBarDemo from "@/components/demos/filter-bar-demo";
import GenSettingsBarDemo from "@/components/demos/gen-settings-bar-demo";
import KbdDemo from "@/components/demos/kbd-demo";
import ShortcutsSheetDemo from "@/components/demos/shortcuts-sheet-demo";
import ThreadListDemo from "@/components/demos/thread-list-demo";
import { CATALOG, type CatalogName } from "@/lib/catalog";

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

export function generateStaticParams() {
  return CATALOG.map((name) => ({ name }));
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!CATALOG.includes(name as CatalogName)) notFound();
  const Demo = demos[name as CatalogName];
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <h1 className="text-2xl font-bold">{name}</h1>
      <div className="flex min-h-40 items-center justify-center rounded-xl border p-8">
        <Demo />
      </div>
      <pre className="bg-muted overflow-x-auto rounded-lg p-3 text-xs">
        <code>{`npx shadcn@latest add https://super-ai-components.vercel.app/r/${name}.json`}</code>
      </pre>
    </main>
  );
}
