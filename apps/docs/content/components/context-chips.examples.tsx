"use client";

import { ContextChip, ContextChipOverflow, ContextChips } from "@/registry/super-ai/context-chips";

/**
 * Live examples for context-chips.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so context-chips.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<MarksUnresolvedTargets />`), so a handler like
 * `onRemove` never has to be serialized across the server/client boundary —
 * it's created and consumed entirely inside this client module.
 */

export function MarksUnresolvedTargets() {
  return (
    <ContextChips>
      <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
      <ContextChip kind="file" label="brief.pdf" unresolved onRemove={() => {}} />
    </ContextChips>
  );
}

export function OverflowInsteadOfScroll() {
  return (
    <ContextChips>
      <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
      <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
      <ContextChip kind="url" label="vercel.com/docs" onRemove={() => {}} />
      <ContextChipOverflow count={4} onClick={() => {}} />
    </ContextChips>
  );
}

export function UnresolvedRenderedAsNormal() {
  // The wrong way: the source file was deleted, but nothing about this chip
  // says so — same border, same icon, same weight as every live reference.
  // A caller who skips the `unresolved` prop when a target stops resolving
  // produces exactly this: a broken attachment silently passing as a good
  // one, which is worse than showing no chip at all.
  return (
    <ContextChips>
      <ContextChip kind="file" label="brief.pdf" onRemove={() => {}} />
    </ContextChips>
  );
}

export function HorizontalScrollInsteadOfOverflow() {
  // The wrong way: hiding chips behind trackpad-only scroll instead of
  // collapsing to a count. A chip a user cannot see is context they cannot
  // audit or remove.
  return (
    <div className="max-w-56 overflow-x-auto">
      <ContextChips className="flex-nowrap">
        <ContextChip kind="file" label="design.fig" onRemove={() => {}} />
        <ContextChip kind="selection" label="lines 12-40" onRemove={() => {}} />
        <ContextChip kind="url" label="vercel.com/docs" onRemove={() => {}} />
        <ContextChip kind="mention" label="@teammate" onRemove={() => {}} />
        <ContextChip kind="file" label="notes.md" onRemove={() => {}} />
      </ContextChips>
    </div>
  );
}
