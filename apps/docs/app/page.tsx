import Link from "next/link";

import { CatalogIndex } from "@/components/catalog-index";
import { ThemeToggle } from "@/components/theme-toggle";
import { CATALOG_BY_FAMILY } from "@/lib/catalog";
import { COMPAT_NOTE } from "@/lib/install";
import { MARKETING_BY_GROUP } from "@/lib/marketing-catalog";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-6 sm:p-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Super-AI-Components</h1>
          <p className="text-muted-foreground mt-1">
            The missing half of AI Elements — components for AI applications.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <p className="text-sm">
        <Link className="underline underline-offset-4" href="/harness">
          Harness
        </Link>
        {" · "}
        <Link className="underline underline-offset-4" href="/architecture">
          Architecture
        </Link>
      </p>

      <div className="space-y-2">
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
          <code>{"npx shadcn@latest add https://super-ai-components.vercel.app/r/<name>.json"}</code>
        </pre>
        <p className="text-muted-foreground text-xs">{COMPAT_NOTE}</p>
      </div>

      <CatalogIndex families={[...CATALOG_BY_FAMILY, ...MARKETING_BY_GROUP]} />
    </main>
  );
}
