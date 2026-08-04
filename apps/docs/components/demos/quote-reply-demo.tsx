"use client";

import { useState } from "react";

import { QuoteReply, type QuoteReplySource } from "@/registry/super-ai/quote-reply";

interface DemoQuote {
  id: string;
  source: QuoteReplySource;
  excerpt: string;
  anchor: string;
}

const INITIAL_QUOTES: DemoQuote[] = [
  {
    id: "text",
    source: "text-range",
    excerpt: "the model needs the negative prompt to stay in sync with the reference strip",
    anchor: "¶4",
  },
  { id: "image", source: "image-region", excerpt: "the torn edge of the poster", anchor: "212,88 · 160×120" },
  { id: "cell", source: "table-cell", excerpt: "$42,300", anchor: "Q3 Budget!C12" },
  { id: "timeline", source: "timeline-range", excerpt: "so that's the part we want to cut", anchor: "0:42–0:51" },
];

export default function QuoteReplyDemo() {
  const [quotes, setQuotes] = useState(INITIAL_QUOTES);

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      {quotes.map((quote) => (
        <QuoteReply
          key={quote.id}
          source={quote.source}
          excerpt={quote.excerpt}
          anchor={quote.anchor}
          thumbnail={quote.source === "image-region" ? <div className="bg-accent size-full" aria-hidden /> : undefined}
          onRemove={() => setQuotes((prev) => prev.filter((q) => q.id !== quote.id))}
        />
      ))}
      {quotes.length === 0 ? <p className="text-muted-foreground text-sm">No quotes attached.</p> : null}
    </div>
  );
}
