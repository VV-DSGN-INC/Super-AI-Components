"use client";

import * as React from "react";

import { ComponentTile } from "@/components/showcase/component-tile";
import type { ShowcaseSection } from "@/lib/showcase";

export function SectionTabs({ sections }: { sections: ShowcaseSection[] }) {
  const [active, setActive] = React.useState(sections[0].id);
  const current = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <section data-slot="showcase-sections">
      <div role="tablist" aria-label="Component sections" className="flex flex-wrap gap-1 border-b">
        {sections.map((section) => {
          const selected = section.id === active;
          return (
            <button
              key={section.id}
              role="tab"
              type="button"
              id={`tab-${section.id}`}
              aria-selected={selected}
              aria-controls={`panel-${section.id}`}
              onClick={() => setActive(section.id)}
              className={
                selected
                  ? "border-foreground text-foreground -mb-px border-b-2 px-3 py-2 text-sm font-medium"
                  : "text-muted-foreground hover:text-foreground -mb-px border-b-2 border-transparent px-3 py-2 text-sm transition-colors"
              }
            >
              {section.title}
              <span className="text-muted-foreground ml-1.5 text-xs">{section.items.length}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="pt-6"
      >
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm">{current.blurb}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {current.items.map((item) => (
            <ComponentTile key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
