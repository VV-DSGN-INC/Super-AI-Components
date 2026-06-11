import Link from "next/link";

import { CATALOG_ITEMS } from "@/lib/catalog";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <h1 className="text-2xl font-bold">Super-AI-Components</h1>
      <p className="text-muted-foreground">
        The missing half of AI Elements — components for AI applications.
      </p>
      <ul className="grid grid-cols-2 gap-2">
        {CATALOG_ITEMS.map((item) => (
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
    </main>
  );
}
