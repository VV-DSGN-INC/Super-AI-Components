import Link from "next/link";

import { CATALOG } from "@/lib/catalog";

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <h1 className="text-2xl font-bold">Super-AI-Components</h1>
      <p className="text-muted-foreground">
        The missing half of AI Elements — components for AI applications.
      </p>
      <ul className="grid grid-cols-2 gap-2">
        {CATALOG.map((name) => (
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
    </main>
  );
}
