import Link from "next/link";

import type { ShowcaseItem } from "@/lib/showcase";

export function ComponentTile({ item }: { item: ShowcaseItem }) {
  return (
    <Link
      href={`/components/${item.name}`}
      data-slot="showcase-tile"
      className="hover:border-foreground/20 block rounded-lg border p-4 transition-colors"
    >
      <span className="block text-sm font-medium">
        {item.title}
      </span>
      <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
        {item.description}
      </span>
      <span className="text-muted-foreground mt-2 block font-mono text-[10px]">{item.name}</span>
    </Link>
  );
}
