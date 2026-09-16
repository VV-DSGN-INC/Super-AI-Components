import fs from "node:fs";
import path from "node:path";

import Link from "next/link";
import { notFound } from "next/navigation";

import { PreviewTabs } from "@/components/preview-tabs";
import { SiteShell } from "@/components/site-shell";
import { UnfilledAnatomy } from "@/components/unfilled-anatomy";
import { CATALOG_ITEMS } from "@/lib/catalog";
import { componentDocs } from "@/lib/docs.generated";
import { STAGES } from "@/lib/pattern-docs";
import type { PatternEntry } from "@/lib/patterns";
import { installCommands, relatedPatterns } from "@/lib/patterns";
import { patternDemos, patternModules } from "@/lib/patterns.generated";
import { anchored, patternsNav } from "@/lib/site-nav";

export function generateStaticParams() {
  return Object.keys(patternModules).map((slug) => ({ slug }));
}

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const docs = patternModules[slug];
  if (!docs) notFound();

  const entries: PatternEntry[] = Object.entries(patternModules).map(([s, d]) => ({ slug: s, docs: d }));
  const Demo = patternDemos[slug];
  const demoSource = Demo
    ? fs.readFileSync(path.join(process.cwd(), "components/demos/patterns", `${slug}-demo.tsx`), "utf8")
    : null;
  const stage = STAGES.find((s) => s.id === docs.stage)!;
  const evidence = [
    ...new Set([
      ...docs.components.flatMap((n) => componentDocs[n]?.evidence ?? []),
      ...(docs.evidence ?? []),
    ]),
  ];
  const install = installCommands(docs.components);

  // The hero is the first section, not a band above the title: the block
  // renders the title first and has no slot above it (spec §6.4, §7).
  const { sections, pinned } = anchored([
    {
      id: "live",
      title: "Live",
      body:
        Demo && demoSource ? (
          <PreviewTabs preview={<Demo />} code={demoSource} fullBleed />
        ) : (
          <UnfilledAnatomy anatomy={docs.anatomy} because={docs.unfilledBecause} />
        ),
    },
    { id: "why", title: "Why it matters", body: <p>{docs.whyItMatters}</p> },
    {
      id: "anatomy",
      title: "Anatomy",
      body: (
        <ol className="space-y-2">
          {docs.anatomy.map((slot, i) => (
            <li key={slot.slot} className="flex items-start gap-3">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-xs">
                {i + 1}
              </span>
              <span>
                <code className="text-xs">{slot.slot}</code> <span>{slot.note}</span>
              </span>
            </li>
          ))}
        </ol>
      ),
    },
    {
      id: "components",
      title: "Components, in composition order",
      body: docs.components.length ? (
        <ul className="space-y-3">
          {docs.components.map((name, i) => {
            const item = CATALOG_ITEMS.find((c) => c.name === name)!;
            return (
              <li key={name} className="flex flex-col gap-1">
                <Link href={`/components/${name}`} className="font-medium underline-offset-4 hover:underline">
                  {item.title}
                </Link>
                <span>{componentDocs[name]?.whatItIs ?? item.description}</span>
                <code className="text-xs">{install[i]}</code>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>None yet. {docs.unfilledBecause}</p>
      ),
    },
    {
      id: "pitfalls",
      title: "Pitfalls",
      body: docs.pitfalls.length ? (
        <ul className="list-disc space-y-1 pl-5">
          {docs.pitfalls.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : (
        <p>None recorded.</p>
      ),
    },
    {
      id: "evidence",
      title: "Evidence",
      body: <p>{evidence.length ? evidence.join(", ") : "None recorded."}</p>,
    },
    {
      id: "related",
      title: "Related patterns",
      body: (
        <ul className="space-y-1">
          {relatedPatterns(entries, slug).map((e) => (
            <li key={e.slug}>
              <Link href={`/patterns/${e.slug}`} className="underline-offset-4 hover:underline">
                {e.docs.title}
              </Link>
              {e.docs.status === "unfilled" ? " (unfilled)" : ""}
            </li>
          ))}
        </ul>
      ),
    },
  ]);

  return (
    <SiteShell
      area="patterns"
      navSections={patternsNav(entries)}
      navPinned={pinned}
      activePageId={slug}
      title={docs.title}
      lede={`${stage.label} · ${docs.definition}`}
      sections={sections}
    />
  );
}
