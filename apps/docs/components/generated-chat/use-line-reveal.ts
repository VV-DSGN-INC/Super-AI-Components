"use client";

import * as React from "react";

/**
 * Reveals a recorded program one line per step, the way a model streams one,
 * and starts over whenever `key` changes (a new version, or a rerun). A step
 * of 0 shows the whole program at once. Each step is scheduled from an effect,
 * so StrictMode's dev remount resumes the reveal rather than freezing it.
 */
export function useLineReveal(program: string | null, key: string, stepMs: number) {
  const total = program ? program.split("\n").length : 0;
  const start = stepMs <= 0 ? total : 0;
  const [shown, setShown] = React.useState({ key, count: start });
  // A new key restarts the reveal in the same render it arrives in.
  if (shown.key !== key) setShown({ key, count: start });
  const count = shown.key === key ? shown.count : start;

  React.useEffect(() => {
    if (count >= total) return;
    const timer = setTimeout(
      () => setShown((s) => (s.key === key ? { key, count: s.count + 1 } : s)),
      stepMs,
    );
    return () => clearTimeout(timer);
  }, [count, total, key, stepMs]);

  return {
    text: program ? program.split("\n").slice(0, count).join("\n") : null,
    streaming: count < total,
  };
}
