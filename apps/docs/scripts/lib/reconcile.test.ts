import { describe, expect, it } from "vitest";

import type { ManifestItem } from "../../lib/manifest-types";
import { reconcileItem } from "./reconcile";

const base: ManifestItem = {
  id: "X1",
  name: "widget",
  title: "Widget",
  description: "",
  family: "A",
  layer: "component",
  status: "shipped",
  wave: 1,
  base: [],
  shadcn: [],
  consumes: [],
  npm: [],
  states: ["plain"],
  specAnchor: "component-specs.md#x1-widget",
};

const bundled = (names: string[]) =>
  names.map((n) => ({
    path: `registry/super-ai/${n}.tsx`,
    type: "registry:component",
    target: `components/super-ai/${n}.tsx`,
  }));

describe("reconcileItem", () => {
  it("unions imports across a multi-file item and excludes its own bundled files", () => {
    const item: ManifestItem = {
      ...base,
      shadcn: ["button"],
      consumes: ["use-view-mode"],
      npm: ["lucide-react"],
      files: bundled(["table-view", "feed-view"]),
    };
    const files: Record<string, string> = {
      "registry/super-ai/widget.tsx":
        'import { TableView } from "./table-view";\nimport { useViewMode } from "./use-view-mode";',
      "registry/super-ai/table-view.tsx":
        'import { Button } from "@/components/ui/button";\nimport { ChevronDown } from "lucide-react";',
      "registry/super-ai/feed-view.tsx": 'import { useViewMode } from "./use-view-mode";',
    };
    const result = reconcileItem(item, (p) => files[p]);
    // table-view and feed-view are this item's own files, so they are not consumes.
    expect(result.consumes).toEqual(["use-view-mode"]);
    // A bundled file's shadcn and npm imports still belong to the item.
    expect(result.shadcn).toEqual(["button"]);
    expect(result.npm).toEqual(["lucide-react"]);
    expect(result.drifted).toBe(false);
  });

  it("does not flag a declared shadcn dep an external item pulls in", () => {
    const item: ManifestItem = {
      ...base,
      shadcn: ["button", "scroll-area"],
      external: ["https://registry.ai-sdk.dev/suggestion.json"],
    };
    const files: Record<string, string> = {
      "registry/super-ai/widget.tsx": 'import { Button } from "@/components/ui/button";',
    };
    // scroll-area lives in the external item's tree, which this script cannot read.
    expect(reconcileItem(item, (p) => files[p]).drifted).toBe(false);
  });

  it("still flags an external item that under-declares what it really imports", () => {
    const item: ManifestItem = {
      ...base,
      shadcn: [],
      external: ["https://registry.ai-sdk.dev/suggestion.json"],
    };
    const files: Record<string, string> = {
      "registry/super-ai/widget.tsx": 'import { Button } from "@/components/ui/button";',
    };
    expect(reconcileItem(item, (p) => files[p]).drifted).toBe(true);
  });

  it("still flags a declared dep the source does not import", () => {
    const item: ManifestItem = { ...base, consumes: ["reset-affordance"] };
    const files: Record<string, string> = {
      "registry/super-ai/widget.tsx": 'import * as React from "react";',
    };
    expect(reconcileItem(item, (p) => files[p]).drifted).toBe(true);
  });

  it("collects npm deps, collapsing subpaths and keeping scopes", () => {
    const item: ManifestItem = { ...base, npm: [] };
    const files: Record<string, string> = {
      "registry/super-ai/widget.tsx": [
        'import { motion } from "motion/react";',
        'import { Slider } from "@base-ui/react/slider";',
        'import * as React from "react";',
        'import { readFileSync } from "node:fs";',
        'import { cn } from "@/lib/utils";',
        'import { Kbd } from "./kbd";',
      ].join("\n"),
    };
    const result = reconcileItem(item, (p) => files[p]);
    // react and node builtins are not consumer-installable payload; the alias
    // and the relative import are covered by shadcn/consumes instead.
    expect(result.npm).toEqual(["@base-ui/react", "motion"]);
  });
});

describe("npm drift is under-declaration only", () => {
  const withSource = (item: ManifestItem, source: string) =>
    reconcileItem(item, (p) => (p === "registry/super-ai/widget.tsx" ? source : undefined));

  it("accepts a declared package the source reaches through a vendored primitive", () => {
    // C5 skill-menu declares cmdk and imports it via @/components/ui/command.
    const item: ManifestItem = { ...base, shadcn: ["command"], npm: ["cmdk"] };
    const source = 'import { Command } from "@/components/ui/command";';
    expect(withSource(item, source).drifted).toBe(false);
  });

  it("flags a package the source imports and nobody declared", () => {
    const item: ManifestItem = { ...base, npm: [] };
    const source = 'import { LineChart } from "recharts";';
    const result = withSource(item, source);
    expect(result.npm).toEqual(["recharts"]);
    expect(result.drifted).toBe(true);
  });

  it("reads imports, not prose", () => {
    // record-list renders the text `from "4 min ago"`; rate-limit-banner renders
    // `from "not your fault"`. Both were reported as npm packages.
    const item: ManifestItem = { ...base, npm: [] };
    const source = '<span>Updated from "4 min ago" and it is not from "your fault"</span>';
    expect(withSource(item, source).npm).toEqual([]);
  });
});
