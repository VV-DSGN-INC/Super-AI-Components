import Link from "next/link";

import { CATALOG, FLOW_CATALOG } from "@/lib/catalog";

function CatalogList({ names }: { names: readonly string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2">
      {names.map((name) => (
        <li key={name}>
          <Link
            className="hover:bg-accent block rounded-md border px-3 py-2 text-sm"
            href={`/components/${name}`}
          >
            {name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <h1 className="text-2xl font-bold">Super-AI-Components</h1>
      <p className="text-muted-foreground">
        The missing half of AI Elements — components for AI applications.
      </p>
      <CatalogList names={CATALOG} />
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Flow Kit</h2>
          <Link className="text-muted-foreground hover:text-foreground text-sm underline" href="/flow">
            image → video chain demo
          </Link>
        </div>
        <p className="text-muted-foreground text-sm">
          Canvas wiring, node anatomy, and the headless runner for node-based generation flows.
        </p>
        <CatalogList names={FLOW_CATALOG} />
      </section>
    </main>
  );
}
