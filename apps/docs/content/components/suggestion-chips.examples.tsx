"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { SuggestionChip, SuggestionChips, SuggestionChipsOverflow } from "@/registry/super-ai/suggestion-chips";

/**
 * Live examples for suggestion-chips.docs.tsx.
 *
 * This is a client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence`, etc. directly, so suggestion-chips.docs.tsx has to stay
 * plain server-evaluable data — it cannot carry "use client" itself. Every
 * example lives here instead and crosses into the docs module as a
 * zero-prop element (e.g. `<FillsComposerOnSelect />`), so a handler like
 * `onSelect` never has to be serialized across the server/client boundary —
 * it's created and consumed entirely inside this client module.
 */

export function FillsComposerOnSelect() {
  const [draft, setDraft] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <SuggestionChips>
        <SuggestionChip suggestion="Summarize this document" onSelect={setDraft} />
        <SuggestionChip suggestion="Draft a reply" icon={<Sparkles />} onSelect={setDraft} />
      </SuggestionChips>
      <p className="text-foreground text-sm">
        Composer: <span className="font-medium">{draft || "(empty — click a chip)"}</span>
      </p>
    </div>
  );
}

export function CappedRowWithOverflowLink() {
  return (
    <SuggestionChips>
      <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
      <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
      <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
      <SuggestionChipsOverflow count={6} href="#" />
    </SuggestionChips>
  );
}

export function ChipsClipWithoutOverflow() {
  // The wrong way: five chips packed into a fixed-width row with no
  // SuggestionChipsOverflow. Suggestions (the vendored AI Elements row)
  // hides its own scrollbar — `<ScrollBar className="hidden" />` in
  // components/ai-elements/suggestion.tsx — so anything past the visible
  // width is a half-visible chip with no affordance telling anyone it's
  // there to scroll to.
  return (
    <div className="w-72 rounded-md border p-2">
      <SuggestionChips>
        <SuggestionChip suggestion="Summarize this document" onSelect={() => {}} />
        <SuggestionChip suggestion="Find action items" onSelect={() => {}} />
        <SuggestionChip suggestion="Draft a reply" onSelect={() => {}} />
        <SuggestionChip suggestion="Translate to Spanish" onSelect={() => {}} />
        <SuggestionChip suggestion="Extract key dates" onSelect={() => {}} />
      </SuggestionChips>
    </div>
  );
}

export function SelectHandlerSubmitsImmediately() {
  // The wrong way: treating onSelect as a submit handler instead of a
  // composer-fill handler. A chip is a starting point the user can still
  // edit before running it — firing the request the instant it's clicked
  // removes that editing step, which is what separates a suggestion chip
  // from a menu action.
  return (
    <SuggestionChips>
      <SuggestionChip
        suggestion="Summarize this document"
        onSelect={(text) => {
          // sendMessage(text) — wrong: skips the edit step chips exist for.
          void text;
        }}
      />
    </SuggestionChips>
  );
}
