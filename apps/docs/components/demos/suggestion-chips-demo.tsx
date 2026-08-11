"use client";

import { FileText, Sparkles } from "lucide-react";
import { useState } from "react";

import { SuggestionChip, SuggestionChips, SuggestionChipsOverflow } from "@/registry/super-ai/suggestion-chips";

export default function SuggestionChipsDemo() {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <SuggestionChips>
        <SuggestionChip suggestion="Summarize this document" onSelect={setDraft} />
        <SuggestionChip suggestion="Draft a reply" icon={<Sparkles />} onSelect={setDraft} />
        <SuggestionChip
          suggestion="Continue from last template"
          thumbnail={
            <div className="bg-primary/15 flex size-full items-center justify-center">
              <FileText className="text-primary size-3" />
            </div>
          }
          onSelect={setDraft}
        />
        <SuggestionChipsOverflow count={3} href="#" />
      </SuggestionChips>
      <p className="text-foreground text-sm">
        Composer: <span className="font-medium">{draft || "(empty — click a chip)"}</span>
      </p>
    </div>
  );
}
