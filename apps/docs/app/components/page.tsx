import { IndexCard, IndexGrid } from "@/components/index-card";
import { SiteShell } from "@/components/site-shell";
import { MANIFEST } from "@/lib/catalog.manifest";
import { FAMILY_LABELS, FAMILY_ORDER } from "@/lib/families";
import { MARKETING_ITEMS } from "@/lib/marketing-catalog";
import { componentsNav } from "@/lib/site-nav";

export default function ComponentsIndex() {
  const shipped = MANIFEST.filter((i) => i.status === "shipped");
  const sections = [
    ...FAMILY_ORDER.map((f) => ({
      id: f,
      title: `${f} · ${FAMILY_LABELS[f]}`,
      items: shipped.filter((i) => i.family === f),
    })),
    // Marketing rides along so the 15 items do not become unreachable when
    // `/` stops being the flat grid.
    { id: "marketing", title: "Marketing", items: MARKETING_ITEMS },
  ]
    .filter((s) => s.items.length > 0)
    .map((s) => ({
      id: s.id,
      title: s.title,
      body: (
        <IndexGrid>
          {s.items.map((i) => (
            <IndexCard
              key={i.name}
              href={`/components/${i.name}`}
              title={i.title}
              description={i.description}
            />
          ))}
        </IndexGrid>
      ),
    }));
  return (
    <SiteShell
      area="components"
      navSections={componentsNav()}
      title="Components"
      lede="Every shipped item, by family. Each installs with one shadcn add."
      sections={sections}
    />
  );
}
