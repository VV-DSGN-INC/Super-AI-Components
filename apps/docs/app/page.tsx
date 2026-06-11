import Link from "next/link";

import { CATALOG_ITEMS, type CatalogItem } from "@/lib/catalog";

const GROUPS: CatalogItem["group"][] = ["Primitives", "Components", "Flow Kit"];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 p-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Super-AI-Components</h1>
        <p className="text-muted-foreground">
          The missing half of AI Elements — components for AI applications.
        </p>
      </div>
      {GROUPS.map((group) => (
        <section key={group} className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{group}</h2>
            {group === "Flow Kit" && (
              <Link className="text-muted-foreground hover:text-foreground text-sm underline" href="/flow">
                image → video chain demo
              </Link>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {CATALOG_ITEMS.filter((item) => item.group === group).map((item) => (
              <li key={item.name}>
                <Link
                  className="hover:bg-accent block rounded-md border px-3 py-2 text-sm"
                  href={`/components/${item.name}`}
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">{item.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
