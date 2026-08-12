"use client";

import * as React from "react";
import type { RefCallback } from "react";

import { MANIFEST } from "@/lib/catalog.manifest";
import { demos } from "@/lib/demos.generated";
import { HERO_BLOCK_NAME } from "@/lib/showcase";

const heroRow = MANIFEST.find((i) => i.name === HERO_BLOCK_NAME)!;

/** Human labels for the block's own region ids. Region ids come from the
 *  manifest and the DOM; only the prose lives here. */
const REGION_LABELS: Record<string, string> = {
  topbar: "App topbar",
  "config-panel": "Parameters and presets",
  "cost-generate": "Cost and run",
  "result-canvas": "Results",
};

interface RegionRect {
  id: string;
  rect: DOMRect;
}

export function HeroApp() {
  const Demo = demos[HERO_BLOCK_NAME];
  const [regions, setRegions] = React.useState<RegionRect[]>([]);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const observer = React.useRef<ResizeObserver | null>(null);

  // Callback ref + ResizeObserver, not a ref object + `useEffect`: see
  // registry/super-ai/use-container-width.tsx for why. The block's demo can
  // paint its `[data-region]` children on a later pass than mount, and this
  // repo's `react-hooks/set-state-in-effect` rule forbids the effect-plus-
  // `setState` shape the brief originally sketched anyway.
  const rootRef = React.useCallback<RefCallback<HTMLDivElement>>((node) => {
    observer.current?.disconnect();
    observer.current = null;

    // React calls the ref with null on unmount; disconnecting above is the
    // whole cleanup.
    if (!node) return;
    // No ResizeObserver (old browser, some SSR shims): no overlay. The block
    // itself still renders and works.
    if (typeof ResizeObserver === "undefined") return;

    const root = node;

    function measure() {
      const rootRect = root.getBoundingClientRect();
      const found = Array.from(root.querySelectorAll<HTMLElement>("[data-region]")).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          id: el.dataset.region!,
          rect: new DOMRect(r.x - rootRect.x, r.y - rootRect.y, r.width, r.height),
        };
      });
      setRegions(found);
    }

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    observer.current = ro;
  }, []);

  return (
    <section className="space-y-4">
      <div ref={rootRef} className="relative overflow-hidden rounded-xl border">
        <Demo />
        <div className="pointer-events-none absolute inset-0">
          {regions.map((region) => (
            <div
              key={region.id}
              className={
                hovered === region.id
                  ? "border-foreground absolute rounded-md border-2 transition-opacity"
                  : "absolute rounded-md border-2 border-transparent transition-opacity"
              }
              style={{
                left: region.rect.x,
                top: region.rect.y,
                width: region.rect.width,
                height: region.rect.height,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {regions.map((region) => (
          <button
            key={region.id}
            type="button"
            data-slot="hero-region-key"
            onMouseEnter={() => setHovered(region.id)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(region.id)}
            onBlur={() => setHovered(null)}
            className="hover:border-foreground/40 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
          >
            {REGION_LABELS[region.id] ?? region.id}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        One block, <span className="font-mono text-xs">{HERO_BLOCK_NAME}</span>, composed from{" "}
        {heroRow.consumes.length} components. Blocks compose; they never reimplement.
      </p>
    </section>
  );
}
