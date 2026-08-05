"use client";

import { RenderQueue, type RenderJob } from "@/registry/super-ai/render-queue";

/** Live examples for render-queue.docs.tsx — client sidecar, see the docs module. */

const SPEC = { format: "MP4", codec: "H.264", resolution: "3840×2160", fps: 24 };

const AUDITABLE: RenderJob[] = [
  { id: "1", name: "Opening titles", spec: { ...SPEC, resolution: "1280×720" }, stage: "preview", state: "done", cost: { amount: 4 } },
  { id: "2", name: "Main cut", spec: SPEC, stage: "export", state: "streaming", progress: 62, cost: { amount: 900, per: "min" } },
];

const NAMES_ONLY: RenderJob[] = [
  { id: "1", name: "Opening titles", spec: {}, stage: "export", state: "done", cost: { amount: 4 } },
  { id: "2", name: "Main cut", spec: {}, stage: "export", state: "queued" },
];

const FAILED_WITH_SPEC: RenderJob[] = [
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

const FAILED_BARE: RenderJob[] = [
  { id: "4", name: "Credits roll", spec: {}, stage: "export", state: "failed" },
];

/** DO — every row carries the spec that will be billed. */
export function RowsCarryTheirSpec() {
  return <RenderQueue jobs={AUDITABLE} onCancel={() => {}} onDownload={() => {}} />;
}

/** DO — a failed row keeps its settings and offers retry in place. */
export function FailedKeepsItsSpec() {
  return <RenderQueue jobs={FAILED_WITH_SPEC} onRetry={() => {}} />;
}

/** DON&apos;T — filenames with no output spec. Nothing here can be audited before it bills. */
export function FilenamesOnly() {
  return <RenderQueue jobs={NAMES_ONLY} onCancel={() => {}} onDownload={() => {}} />;
}

/** DON&apos;T — a failure that drops the settings, so retrying means rebuilding the job. */
export function FailedWithoutContext() {
  return <RenderQueue jobs={FAILED_BARE} onRetry={() => {}} />;
}
