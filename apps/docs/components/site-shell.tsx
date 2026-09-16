"use client";

import { Layers, Waypoints } from "lucide-react";
import { useRouter } from "next/navigation";
import type * as React from "react";

import { DocsShell, type DocsShellProps } from "@/registry/super-ai/docs-shell";

type Area = "patterns" | "components";

const AREAS: NonNullable<DocsShellProps["areas"]> = [
  { id: "patterns", label: "Patterns", icon: <Waypoints /> },
  { id: "components", label: "Components", icon: <Layers /> },
];
const AREA_HREF: Record<Area, string> = { patterns: "/", components: "/components" };

export interface SiteShellProps {
  area: Area;
  navSections: NonNullable<DocsShellProps["navSections"]>;
  navPinned?: DocsShellProps["navPinned"];
  activePageId?: string;
  title: string;
  /** Inline text only: the block renders it inside a <p>. */
  lede?: string;
  sections: NonNullable<DocsShellProps["sections"]>;
  children?: React.ReactNode;
}

/** The site's chrome is the registry's own O11 block, composed rather than
 *  reimplemented (block-build-brief.md). Height comes from here because the
 *  block is embeddable and sizes to its container. */
export function SiteShell({
  area,
  navSections,
  navPinned,
  activePageId,
  title,
  lede,
  sections,
  children,
}: SiteShellProps) {
  const router = useRouter();
  return (
    <DocsShell
      className="h-dvh"
      areas={AREAS}
      activeAreaId={area}
      onSelectArea={(id) => router.push(AREA_HREF[id as Area])}
      railLabel="Super-AI-Components"
      // The rail is 3rem at icon width, so the brand is a mark rather than the
      // name: the name is already on the nav header, from railLabel.
      railBrand={
        <span
          aria-hidden
          className="bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded text-[11px] font-semibold"
        >
          SA
        </span>
      }
      navLabel={area === "patterns" ? "Patterns by stage" : "Components by family"}
      navSections={navSections}
      navPinned={navPinned}
      activePageId={activePageId}
      title={title}
      lede={lede}
      sections={sections}
    >
      {children}
    </DocsShell>
  );
}
