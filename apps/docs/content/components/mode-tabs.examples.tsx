"use client";

import { MessageSquare, PenLine, Sparkles } from "lucide-react";

import { ModeTabs } from "@/registry/super-ai/mode-tabs";

/**
 * Live examples for mode-tabs.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so mode-tabs.docs.tsx has to stay plain
 * server-evaluable data — it cannot carry "use client" itself, because
 * Next.js turns "use client" exports into opaque client references, and a
 * plain object read through one of those comes back with every field
 * undefined. Every example lives here instead and crosses into the docs
 * module as a zero-prop element (e.g. `<ValidModeCount />`), so state and
 * handlers never have to be serialized across the server/client boundary —
 * they're created and consumed entirely inside this client module.
 */

export function ValidModeCount() {
  return (
    <ModeTabs
      modes={[
        { value: "ask", label: "Ask", icon: <MessageSquare /> },
        { value: "design", label: "Design", icon: <PenLine /> },
        { value: "build", label: "Build", icon: <Sparkles /> },
      ]}
      variant="with-icon"
      defaultValue="design"
    />
  );
}

export function TooltipNotOnlyName() {
  return (
    <ModeTabs
      modes={[
        { value: "chat", label: "Chat", icon: <MessageSquare /> },
        { value: "cowork", label: "Cowork", icon: <Sparkles /> },
      ]}
      variant="with-tooltip"
      defaultValue="chat"
    />
  );
}

/**
 * The anti-pattern: hand-rolled icon-only buttons whose only label lives in
 * the native `title` tooltip. No visible text, no `aria-label`, no sr-only
 * span — a screen reader announces nothing until the tooltip itself fires,
 * and it never fires from keyboard focus at all in most browsers. Built with
 * raw markup (not ModeTabs) specifically to show the mistake ModeTabs'
 * `with-tooltip` variant prevents by always shipping a real (sr-only) label.
 */
export function TooltipOnlyLabel() {
  return (
    <div className="bg-muted inline-flex w-fit gap-1 rounded-lg p-[3px]">
      <button type="button" title="Chat" className="hover:bg-background rounded-md p-2">
        <MessageSquare aria-hidden="true" className="size-4" />
      </button>
      <button type="button" title="Cowork" className="hover:bg-background rounded-md p-2">
        <Sparkles aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

/**
 * The anti-pattern: past five modes, ModeTabs stops being a segmented
 * control and starts being a horizontal-scroll problem. Rendered as static
 * markup, matching ModeTabs' own trigger styling, to show the failure mode
 * without implying the real component enforces the cap for you.
 */
export function TooManyModes() {
  const labels = ["Ask", "Design", "Build", "Review", "Ship", "Archive"];
  return (
    <div className="bg-muted inline-flex w-fit max-w-64 gap-1 overflow-x-auto rounded-lg p-[3px]">
      {labels.map((label) => (
        <span key={label} className="text-foreground/60 shrink-0 rounded-md px-2.5 py-0.5 text-sm whitespace-nowrap">
          {label}
        </span>
      ))}
    </div>
  );
}
