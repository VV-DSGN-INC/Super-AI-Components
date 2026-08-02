import fs from "node:fs";
import path from "node:path";

import { notFound } from "next/navigation";

import { PreviewTabs } from "@/components/preview-tabs";
import { CATALOG, CATALOG_ITEMS, type CatalogName } from "@/lib/catalog";
import { MARKETING, MARKETING_ITEMS } from "@/lib/marketing-catalog";

// Grows one entry per component task (Tasks 6–20).
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
  // Resolved from the catalog rather than a hand-maintained map: adding a
  // component means adding one catalog entry and one demo file, and never
  // touching this route. Two components can then be built in parallel without
  // colliding here.
  const { default: Demo } = await import(`../../../components/demos/${name}-demo`);

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
