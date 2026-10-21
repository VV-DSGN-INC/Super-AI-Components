"use client";

import * as React from "react";

import { Textarea } from "@/components/ui/textarea";
import { PromptEnhancer } from "@/registry/super-ai/prompt-enhancer";

/**
 * A stand-in for a model call: it waits, then appends the constraints a person
 * would otherwise type. Swap it for your own endpoint.
 */
function enhance(value: string, refinement?: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const base = value.trim();
      if (refinement === "More concise") resolve(`${base}, in four lines`);
      else if (refinement === "Add examples")
        resolve(`${base}, in the style of a haiku, for example one about low tide`);
      else resolve(`${base}, in four lines, with a calm tone`);
    }, 900);
  });
}

export default function PromptEnhancerDemo() {
  const [value, setValue] = React.useState("write a short poem about the sea");
  return (
    <div className="flex w-full max-w-xl flex-col gap-2">
      <Textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-20"
      />
      <PromptEnhancer value={value} onEnhance={enhance} onAccept={setValue} />
    </div>
  );
}
