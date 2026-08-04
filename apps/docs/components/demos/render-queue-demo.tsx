"use client";

import * as React from "react";

import { RenderQueue, type RenderJob } from "@/registry/super-ai/render-queue";

const SPEC = { format: "MP4", codec: "H.264", resolution: "3840×2160", fps: 24 };

const INITIAL: RenderJob[] = [
  {
    id: "1",
    name: "Opening titles",
    spec: { ...SPEC, resolution: "1280×720" },
    stage: "preview",
    state: "done",
    cost: { amount: 4 },
  },
  {
    id: "2",
    name: "Main cut",
    spec: SPEC,
    stage: "export",
    state: "streaming",
    progress: 62,
    cost: { amount: 900, per: "min" },
  },
  { id: "3", name: "Alt ending", spec: SPEC, stage: "export", state: "queued" },
  {
    id: "4",
    name: "Credits roll",
    spec: SPEC,
    stage: "export",
    state: "failed",
    cost: { amount: 55 },
    error: "Encoder ran out of memory",
  },
];

export default function RenderQueueDemo() {
  const [jobs, setJobs] = React.useState(INITIAL);

  const update = (id: string, patch: Partial<RenderJob>) =>
    setJobs((current) => current.map((j) => (j.id === id ? { ...j, ...patch } : j)));

  return (
    <RenderQueue
      jobs={jobs}
      // A retried job keeps its spec — that is the point of the row carrying it.
      onRetry={(id) => update(id, { state: "queued", error: undefined })}
      onCancel={(id) => setJobs((current) => current.filter((j) => j.id !== id))}
      onDownload={() => {}}
    />
  );
}
