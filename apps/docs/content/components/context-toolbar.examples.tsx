"use client";

import { Bold, Copy, Crop, Italic, Link2, Palette, Scissors, Sparkles, Trash2, Type, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContextToolbar, type ContextToolbarAction } from "@/registry/super-ai/context-toolbar";

/**
 * Live examples for context-toolbar.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose: the docs
 * module is read by a Server Component, so it cannot carry "use client" and it
 * cannot hold JSX with event handlers. Everything interactive lives here and
 * crosses over as a zero-prop element.
 */

const TEXT_ACTIONS: ContextToolbarAction[] = [
  { id: "bold", label: "Bold", icon: <Bold /> },
  { id: "italic", label: "Italic", icon: <Italic /> },
  { id: "link", label: "Link", icon: <Link2 /> },
];

const MANY_ACTIONS: ContextToolbarAction[] = [
  ...TEXT_ACTIONS,
  { id: "crop", label: "Crop", icon: <Crop /> },
  { id: "fill", label: "Fill", icon: <Palette /> },
  { id: "text", label: "Add text", icon: <Type /> },
  { id: "remove-bg", label: "Remove background", icon: <Scissors /> },
  { id: "duplicate", label: "Duplicate", icon: <Copy /> },
  { id: "delete", label: "Delete", icon: <Trash2 /> },
];

/** The AI entry leads, and the rest of the bar stays short. */
export function AiEntryFirst() {
  return (
    <ContextToolbar
      selection="text"
      actions={TEXT_ACTIONS}
      onAction={() => {}}
      aiMenu={<div className="p-2 text-sm">Rewrite · Shorten · Translate</div>}
    />
  );
}

/** Nine actions supplied; eight buttons drawn, the rest behind the overflow menu. */
export function OverflowCollapses() {
  return <ContextToolbar selection="image" actions={MANY_ACTIONS} onAction={() => {}} />;
}

/** A hand-rolled bar: nine equal buttons, no cap, no AI entry, no names. */
export function EverythingInOneRow() {
  return (
    <div className="bg-popover text-popover-foreground flex w-fit items-center gap-0.5 rounded-lg border p-1 shadow-md">
      {MANY_ACTIONS.map((item) => (
        <Button key={item.id} variant="ghost" size="icon-sm">
          <span aria-hidden="true" className="flex items-center [&_svg]:size-4">
            {item.icon}
          </span>
        </Button>
      ))}
    </div>
  );
}

/** The AI entry pushed to the end, where nobody looks for it. */
export function AiEntryBuriedLast() {
  return (
    <div className="bg-popover text-popover-foreground flex w-fit items-center gap-0.5 rounded-lg border p-1 shadow-md">
      {TEXT_ACTIONS.map((item) => (
        <Button key={item.id} variant="ghost" size="icon-sm">
          <span aria-hidden="true" className="flex items-center [&_svg]:size-4">
            {item.icon}
          </span>
          <span className="sr-only">{item.label}</span>
        </Button>
      ))}
      <Button variant="ghost" size="sm">
        <Sparkles aria-hidden="true" />
        AI
      </Button>
    </div>
  );
}

/** Flipped below the selection — the host decides, the component reports it. */
export function FlippedBelowSelection() {
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="max-w-xs rounded-md border border-dashed p-2 text-sm">
        <span className="bg-primary/20 rounded-sm px-0.5">The selected object</span>
      </p>
      <ContextToolbar
        selection="shape"
        placement="below"
        actions={[
          { id: "fill", label: "Fill", icon: <Palette /> },
          { id: "duplicate", label: "Duplicate", icon: <Copy /> },
          { id: "effects", label: "Effects", icon: <Wand2 /> },
        ]}
        onAction={() => {}}
      />
    </div>
  );
}
