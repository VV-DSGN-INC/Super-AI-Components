"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolPanel, type ToolPanelSection } from "@/registry/super-ai/tool-panel";

/**
 * Live examples for tool-panel.docs.tsx. This file is the client sidecar:
 * every export is a zero-prop component, so the docs module stays plain,
 * serializable data that a Server Component can read.
 */

function shapes(action?: ReactNode): ToolPanelSection[] {
  return [
    {
      id: "shapes",
      title: "Shapes",
      count: 4,
      action,
      items: [
        { id: "circle", label: "Circle" },
        { id: "square", label: "Square" },
        { id: "arrow", label: "Arrow" },
        { id: "star", label: "Star" },
      ],
    },
  ];
}

function PromptBox() {
  return (
    <div className="flex items-center gap-2">
      <Input aria-label="Describe an element" placeholder="Describe an element…" />
      <Button size="sm">Generate</Button>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return <div className="h-64 w-56">{children}</div>;
}

export function PromptPinnedBelowSections() {
  return (
    <Frame>
      <ToolPanel label="Elements" sections={shapes()} prompt={<PromptBox />} />
    </Frame>
  );
}

export function PromptScrollsAway() {
  return (
    <Frame>
      <ToolPanel
        label="Elements"
        sections={[
          ...shapes(),
          // Wrong: the prompt is just another section, so it scrolls out of
          // reach and the panel degrades into an asset browser.
          { id: "prompt", title: "Generate", render: () => <PromptBox /> },
        ]}
      />
    </Frame>
  );
}

export function ViewAllIsALink() {
  return (
    <Frame>
      <ToolPanel
        label="Elements"
        sections={shapes(
          <a href="#all-shapes" className="underline underline-offset-2">
            View all
          </a>,
        )}
      />
    </Frame>
  );
}

export function ViewAllAsButton() {
  return (
    <Frame>
      {/* Wrong: View all navigates to the full library. A button promises an
          action that happens in place. */}
      <ToolPanel
        label="Elements"
        sections={shapes(
          <Button variant="ghost" size="sm">
            View all
          </Button>,
        )}
      />
    </Frame>
  );
}
