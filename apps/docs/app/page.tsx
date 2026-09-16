import { IndexCard, IndexGrid } from "@/components/index-card";
import { SiteShell } from "@/components/site-shell";
import { STAGES } from "@/lib/pattern-docs";
import type { PatternEntry } from "@/lib/patterns";
import { byStage } from "@/lib/patterns";
import { patternModules } from "@/lib/patterns.generated";
import { patternsNav } from "@/lib/site-nav";

export default function Home() {
  const entries: PatternEntry[] = Object.entries(patternModules).map(([slug, docs]) => ({ slug, docs }));
  const grouped = byStage(entries);
  const sections = STAGES.map((s) => {
    const list = grouped.get(s.id) ?? [];
    return {
      id: s.id,
      title: `${s.label}: ${s.question}`,
      body: list.length ? (
        <IndexGrid>
          {list.map((e) => (
            <IndexCard
              key={e.slug}
              href={`/patterns/${e.slug}`}
              title={e.docs.title}
              description={e.docs.definition}
              chips={e.docs.components}
              badge={e.docs.status === "unfilled" ? "Unfilled" : undefined}
            />
          ))}
        </IndexGrid>
      ) : (
        <p>Nothing here yet.</p>
      ),
    };
  });
  return (
    <SiteShell
      area="patterns"
      navSections={patternsNav(entries)}
      title="Patterns"
      lede="What an AI interface does for the user, stage by stage, and the components that build each behaviour."
      sections={sections}
    />
  );
}
