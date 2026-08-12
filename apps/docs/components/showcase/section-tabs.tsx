"use client";

import * as React from "react";

import { ComponentTile } from "@/components/showcase/component-tile";
import type { ShowcaseSection } from "@/lib/showcase";

export function SectionTabs({ sections }: { sections: ShowcaseSection[] }) {
  const [active, setActive] = React.useState(sections[0].id);
  const current = sections.find((s) => s.id === active) ?? sections[0];
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const moveFocus = (index: number) => {
    const section = sections[index];
    setActive(section.id);
    tabRefs.current[index]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Modified arrows belong to the browser, not to the tablist: Alt+Arrow is
    // back/forward on Windows and Linux, and Ctrl/Cmd variants are reserved
    // too. Swallowing them here broke history navigation for anyone whose
    // focus happened to be on a tab. `shiftKey` is deliberately not in this
    // list — Shift+Arrow has no browser default on a button, so leaving it to
    // move the selection costs nothing.
    if (event.altKey || event.ctrlKey || event.metaKey) return;

    const from = sections.findIndex((s) => s.id === active);
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        moveFocus((from + 1) % sections.length);
        break;
      case "ArrowLeft":
        event.preventDefault();
        moveFocus((from - 1 + sections.length) % sections.length);
        break;
      case "Home":
        event.preventDefault();
        moveFocus(0);
        break;
      case "End":
        event.preventDefault();
        moveFocus(sections.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <section data-slot="showcase-sections">
      <div
        role="tablist"
        aria-label="Component sections"
        onKeyDown={handleKeyDown}
        className="flex flex-wrap gap-1 border-b"
      >
        {sections.map((section, index) => {
          const selected = section.id === active;
          return (
            <button
              key={section.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              type="button"
              id={`tab-${section.id}`}
              aria-selected={selected}
              aria-controls={`panel-${section.id}`}
              tabIndex={selected ? 0 : -1}
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
