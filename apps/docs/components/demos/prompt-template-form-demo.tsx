"use client";

import * as React from "react";

import { PromptTemplateForm, type TemplateSegment } from "@/registry/super-ai/prompt-template-form";

const TEMPLATE: TemplateSegment[] = [
  "Write a ",
  {
    id: "tone",
    label: "Tone",
    kind: "select",
    options: ["friendly", "formal", "playful"],
    defaultValue: "friendly",
  },
  " announcement for ",
  { id: "audience", label: "Audience", kind: "text", required: true, placeholder: "who it is for" },
  " about ",
  { id: "topic", label: "Topic", kind: "text", required: true, placeholder: "what changed" },
  ".",
];

export default function PromptTemplateFormDemo() {
  const [sent, setSent] = React.useState<string | null>(null);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      <PromptTemplateForm template={TEMPLATE} layout="inline" onRun={(prompt) => setSent(prompt)} />
      {sent ? (
        <p role="status" className="text-sm">
          Sent: {sent}
        </p>
      ) : null}
    </div>
  );
}
