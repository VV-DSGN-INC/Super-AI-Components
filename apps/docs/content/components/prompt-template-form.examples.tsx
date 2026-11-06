"use client";

import { PromptTemplateForm } from "@/registry/super-ai/prompt-template-form";
import type { TemplateSegment } from "@/registry/super-ai/prompt-template-form";

/**
 * Live examples for prompt-template-form.docs.tsx.
 *
 * Client sidecar: the docs module is plain data read by a Server Component, so
 * anything that needs a handler or state lives here and crosses over as a
 * zero-prop element.
 */

const ANNOUNCEMENT: TemplateSegment[] = [
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
  ".",
];

export function RequiredMarkedInPlace() {
  return <PromptTemplateForm template={ANNOUNCEMENT} showMissing />;
}

export function CarriedValueStaysEditable() {
  return (
    <PromptTemplateForm
      step={{ current: 2, total: 3, label: "Outline" }}
      template={[
        "Outline an article about ",
        { id: "topic", label: "Topic", kind: "text", required: true, carriedFrom: "Brief" },
        ".",
      ]}
      defaultValues={{ topic: "heat pumps for first-time buyers" }}
    />
  );
}

export function DefaultPassedAsValue() {
  // The template's choice delivered as an entered value: it reads as the
  // person's own, so nobody knows it was never chosen.
  return (
    <PromptTemplateForm
      template={[
        "Write a ",
        {
          id: "tone",
          label: "Tone",
          kind: "select",
          options: ["friendly", "formal", "playful"],
        },
        " reminder.",
      ]}
      defaultValues={{ tone: "friendly" }}
    />
  );
}

export function ParameterAsBlank() {
  // A generation setting dressed as a variable. It does not belong in the
  // prompt text, so it does not belong in the template.
  return (
    <PromptTemplateForm
      template={[
        "Summarise the report at temperature ",
        { id: "temperature", label: "Temperature", kind: "text", defaultValue: "0.7" },
        ".",
      ]}
    />
  );
}
