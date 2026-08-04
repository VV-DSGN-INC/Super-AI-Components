"use client";

import * as React from "react";

import { VoiceCloneRecorder, type VoiceCloneRecorderState } from "@/registry/super-ai/voice-clone-recorder";

const SCRIPT = [
  "The quick brown fox jumps over the lazy dog near the riverbank.",
  "She sells seashells by the seashore every summer morning.",
  "A journey of a thousand miles begins with a single step.",
];

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function VoiceCloneRecorderDemo() {
  const [state, setState] = React.useState<VoiceCloneRecorderState>("prompt-script");
  const [currentLine, setCurrentLine] = React.useState(0);
  const [seconds, setSeconds] = React.useState(0);
  const [level, setLevel] = React.useState(0);

  // Stands in for a real getUserMedia + analyser loop: this component only
  // renders the level and elapsed time it's given, it never captures audio
  // itself.
  React.useEffect(() => {
    if (state !== "level-metering") return;
    const interval = setInterval(() => {
      setSeconds((value) => value + 1);
      setLevel(20 + Math.round(Math.random() * 60));
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  return (
    <div className="w-full max-w-md">
      <VoiceCloneRecorder
        script={SCRIPT}
        currentLine={currentLine}
        state={state}
        level={level}
        elapsedLabel={formatElapsed(seconds)}
        takeSummary={`Take recorded — ${formatElapsed(seconds)}`}
        speakerName="Jamie"
        onStartRecording={() => {
          setSeconds(0);
          setLevel(0);
          setState("level-metering");
        }}
        onStopRecording={() => setState("retake")}
        onRetake={() => {
          setSeconds(0);
          setLevel(0);
          setState("prompt-script");
        }}
        onAcceptTake={() => setState("consent-capture")}
        onConsentCancel={() => setState("retake")}
        onConsent={() => {
          // The only point at which a consumer would actually kick off
          // cloning — logged here since this demo has nowhere to send it.
          setCurrentLine((line) => Math.min(line + 1, SCRIPT.length - 1));
          setSeconds(0);
          setState("prompt-script");
        }}
      />
    </div>
  );
}
