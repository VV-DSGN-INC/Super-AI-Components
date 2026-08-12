"use client";

import Link from "next/link";
import * as React from "react";
import type { RefCallback } from "react";

import { demos } from "@/lib/demos.generated";

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
  /** The components inside this region, alphabetical. Always a subset of
   *  `consumes` — see `measure()`. */
  components: string[];
}

export interface HeroAppProps {
  /** The block the hero renders, e.g. `generation-shell`. */
  blockName: string;
  /** The block's manifest `consumes` array, passed in rather than imported:
   *  this is a client component, and importing the manifest to read two fields
   *  ships all 70KB of it to the front door. */
  consumes: string[];
}

export function HeroApp({ blockName, consumes }: HeroAppProps) {
  const Demo = demos[blockName];
  const [regions, setRegions] = React.useState<RegionRect[]>([]);
  const [active, setActive] = React.useState<string | null>(null);
  const observer = React.useRef<ResizeObserver | null>(null);

  // Callback ref + ResizeObserver, not a ref object + `useEffect`: see
  // registry/super-ai/use-container-width.tsx for why. The block's demo can
  // paint its `[data-region]` children on a later pass than mount, and this
  // repo's `react-hooks/set-state-in-effect` rule forbids the effect-plus-
  // `setState` shape the brief originally sketched anyway.
  const rootRef = React.useCallback<RefCallback<HTMLDivElement>>(
    (node) => {
      observer.current?.disconnect();
      observer.current = null;

      // React calls the ref with null on unmount; disconnecting above is the
      // whole cleanup.
      if (!node) return;
      // No ResizeObserver (old browser, some SSR shims): no overlay. The block
      // itself still renders and works.
      if (typeof ResizeObserver === "undefined") return;

      const root = node;
      // The manifest's list, so a name the block does not declare it consumes
      // cannot be shown even if some child grows a matching `data-slot`.
      const declared = new Set(consumes);

      function measure() {
        const rootRect = root.getBoundingClientRect();
        const found = Array.from(root.querySelectorAll<HTMLElement>("[data-region]")).map((el) => {
          const r = el.getBoundingClientRect();
          // Region-to-components is derived, not authored: every component in
          // this registry stamps `data-slot="<its own name>"` on its root, so
          // the region's own slot plus its subtree's slots, intersected with
          // `consumes`, is the list. The region element itself has to be in
          // the query — `topbar` and `config-panel` sit on the component.
          const slots = [
            ...(el.dataset.slot ? [el.dataset.slot] : []),
            ...Array.from(el.querySelectorAll<HTMLElement>("[data-slot]")).map(
              (child) => child.dataset.slot!,
            ),
          ].filter((slot) => declared.has(slot));
          return {
            id: el.dataset.region!,
            rect: new DOMRect(r.x - rootRect.x, r.y - rootRect.y, r.width, r.height),
            components: [...new Set(slots)].sort(),
          };
        });
        setRegions(found);
      }

      measure();

      const ro = new ResizeObserver(() => measure());
      ro.observe(root);
      observer.current = ro;
    },
    [consumes],
  );

  return (
    <section className="space-y-4">
      <div ref={rootRef} className="relative overflow-hidden rounded-xl border">
        <Demo />
        <div className="pointer-events-none absolute inset-0">
          {regions.map((region) => (
            <div
              key={region.id}
              className={
                active === region.id
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

      {/* One column per region: the key outlines the region, and the names
          beneath it are the components inside it, each linking to its page.
          Hover and focus drive the same state and the links stay in the tab
          order, so a keyboard reaches everything a mouse does. */}
      <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        {regions.map((region) => {
          const on = active === region.id;
          return (
            <div
              key={region.id}
              onMouseEnter={() => setActive(region.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(region.id)}
              onBlur={() => setActive(null)}
              className="space-y-1.5"
            >
              <button
                type="button"
                data-slot="hero-region-key"
                data-active={on ? "" : undefined}
                onClick={() => setActive(on ? null : region.id)}
                className={
                  on
                    ? "border-foreground w-full rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors"
                    : "hover:border-foreground/40 w-full rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors"
                }
              >
                {REGION_LABELS[region.id] ?? region.id}
              </button>
              <ul data-slot="hero-region-components" className="space-y-0.5 px-2.5">
                {region.components.map((name) => (
                  <li key={name}>
                    <Link
                      href={`/components/${name}`}
                      className={
                        on
                          ? "text-foreground block font-mono text-[10px] underline underline-offset-2"
                          : "text-muted-foreground hover:text-foreground block font-mono text-[10px] underline-offset-2 hover:underline"
                      }
                    >
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground text-sm">
        One block, <span className="font-mono text-xs">{blockName}</span>, composed from{" "}
        {consumes.length} components. Blocks compose; they never reimplement.
      </p>
    </section>
  );
}
