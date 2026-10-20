"use client";

import * as React from "react";

import {
  CUT_OFF_PROGRAM,
  generatedBodyLibrary,
  RETRY_PROGRAM,
  SPEND_PROGRAM,
  TREND_PROGRAM,
} from "@/components/demos/generated-body-demo";
import { GeneratedBody } from "@/registry/super-ai/generated-body";

/**
 * Live examples for generated-body.docs.tsx.
 *
 * A client sidecar: component-docs.tsx is a Server Component and reads the
 * docs module as plain data, so any example that needs state or a handler
 * lives here and crosses over as a zero-prop element. The library and the
 * programs are the demo's, so every body here is one this system could emit.
 */

export function FallbackKeepsTheLastVersion() {
  const [program, setProgram] = React.useState(TREND_PROGRAM);
  return (
    <GeneratedBody
      program={program}
      library={generatedBodyLibrary}
      fallbackProgram={SPEND_PROGRAM}
      onRetry={() => setProgram(RETRY_PROGRAM)}
    />
  );
}

export function RecordTheLastGoodVersion() {
  const [program, setProgram] = React.useState(SPEND_PROGRAM);
  const [lastGood, setLastGood] = React.useState<string | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          type="button"
          className="border-input rounded-md border px-2.5 py-1 text-sm"
          onClick={() => setProgram(SPEND_PROGRAM)}
        >
          Use the spend body
        </button>
        <button
          type="button"
          className="border-input rounded-md border px-2.5 py-1 text-sm"
          onClick={() => setProgram(TREND_PROGRAM)}
        >
          Use the trend body
        </button>
      </div>
      <GeneratedBody
        program={program}
        library={generatedBodyLibrary}
        fallbackProgram={lastGood}
        onRender={({ ok }) => {
          if (ok) setLastGood(program);
        }}
      />
      <p className="text-foreground text-sm">
        Last good version kept: <span className="font-medium">{lastGood ? "yes" : "none yet"}</span>
      </p>
    </div>
  );
}

export function StreamEndedEarly() {
  // The caller flipped `streaming` off before the last lines arrived.
  return <GeneratedBody program={CUT_OFF_PROGRAM} library={generatedBodyLibrary} />;
}

export function StillStreaming() {
  return <GeneratedBody program={CUT_OFF_PROGRAM} library={generatedBodyLibrary} streaming />;
}

export function NoFallbackShowsTheAlertAlone() {
  return <GeneratedBody program={TREND_PROGRAM} library={generatedBodyLibrary} />;
}
