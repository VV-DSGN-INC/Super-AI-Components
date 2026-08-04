"use client";

import { AlertTriangle, CheckCircle2, Download, Loader2, RotateCcw, X } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatCost, type Cost } from "@/registry/super-ai/cost";

/**
 * Render Queue — staged export jobs, with the spec that will be billed.
 *
 * Spec: docs/design-system/component-specs.md#f6-render-queue
 * States: per-row-spec · progress · retry · cancel · download
 *
 * Three rules, all of them about being able to audit the queue before it
 * charges you:
 *
 * 1. "Rows carry their output spec (codec, resolution, fps). A queue showing
 *    only filenames cannot be audited before it bills you." The spec is a
 *    column, not a tooltip.
 * 2. "Preview and export are separate stages — a 15-second preview costs
 *    almost nothing." The stage is visible per row, because the economics of
 *    the two are not comparable.
 * 3. "Failed rows keep their spec and offer retry in place." A failure that
 *    drops the settings makes you rebuild the job to try again.
 */

type RenderJobState = "queued" | "streaming" | "done" | "failed";

interface RenderJobSpec {
  format?: string;
  codec?: string;
  resolution?: string;
  fps?: number;
}

interface RenderJob {
  id: string;
  name: string;
  /** Rows carry their spec. This is what makes the queue auditable. */
  spec: RenderJobSpec;
  /** Separate stages, separate economics. */
  stage: "preview" | "export";
  state: RenderJobState;
  progress?: number;
  cost?: Cost;
  downloadUrl?: string;
  error?: React.ReactNode;
}

interface RenderQueueProps extends React.ComponentProps<"div"> {
  jobs: RenderJob[];
  /** Failed rows KEEP their spec, so a retry re-runs the same job. */
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDownload?: (id: string) => void;
}

const STATE_TEXT: Record<RenderJobState, string> = {
  queued: "Queued",
  streaming: "Rendering",
  done: "Done",
  failed: "Failed",
};

const STATE_ICON: Record<RenderJobState, React.ReactNode> = {
  queued: <span aria-hidden className="bg-foreground/30 size-2 rounded-full" />,
  streaming: <Loader2 aria-hidden className="size-4 animate-spin" />,
  done: <CheckCircle2 aria-hidden className="size-4" />,
  failed: <AlertTriangle aria-hidden className="text-destructive size-4" />,
};

/** "MP4 · H.264 · 3840×2160 · 24 fps" — every part the caller supplied, in order. */
function formatSpec(spec: RenderJobSpec): string {
  return [spec.format, spec.codec, spec.resolution, spec.fps ? `${spec.fps} fps` : undefined]
    .filter(Boolean)
    .join(" · ");
}

function RenderQueue({
  jobs,
  onRetry,
  onCancel,
  onDownload,
  className,
  ...props
}: RenderQueueProps) {
  return (
    <div data-slot="render-queue" className={cn("w-full", className)} {...props}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Output</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const inFlight = job.state === "queued" || job.state === "streaming";
            return (
              <TableRow key={job.id} data-slot="render-queue-row" data-state={job.state}>
                <TableCell className="text-foreground font-medium">{job.name}</TableCell>

                <TableCell>
                  {/* A preview and an export are not the same purchase, so the
                      stage is a visible column rather than something you infer
                      from the price. */}
                  <Badge
                    data-slot="render-queue-stage"
                    variant={job.stage === "export" ? "default" : "secondary"}
                  >
                    {job.stage === "export" ? "Export" : "Preview"}
                  </Badge>
                </TableCell>

                {/* Kept in every state, failures included. */}
                <TableCell data-slot="render-queue-spec" className="text-foreground text-xs">
                  {formatSpec(job.spec)}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span
                      data-slot="render-queue-status"
                      className="text-foreground flex items-center gap-1.5 text-xs"
                    >
                      {/* Icon plus words: the state never rests on colour. */}
                      {STATE_ICON[job.state]}
                      {STATE_TEXT[job.state]}
                    </span>
                    {job.state === "streaming" ? (
                      <Progress data-slot="render-queue-progress" value={job.progress ?? null}>
                        <ProgressLabel className="sr-only">{`${job.name} progress`}</ProgressLabel>
                      </Progress>
                    ) : null}
                    {job.state === "failed" && job.error ? (
                      <span data-slot="render-queue-error" className="text-foreground text-xs">
                        {job.error}
                      </span>
                    ) : null}
                  </div>
                </TableCell>

                <TableCell data-slot="render-queue-cost" className="text-foreground text-xs">
                  {/* formatCost, so a queue and a run button never disagree
                      about what the same job costs. Absent cost renders an
                      em-dash, never a zero. */}
                  {job.cost ? formatCost(job.cost) : "—"}
                </TableCell>

                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {job.state === "failed" && onRetry ? (
                      <Button
                        data-slot="render-queue-retry"
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onRetry(job.id)}
                        aria-label={`Retry ${job.name}`}
                      >
                        <RotateCcw aria-hidden />
                        Retry
                      </Button>
                    ) : null}
                    {inFlight && onCancel ? (
                      <Button
                        data-slot="render-queue-cancel"
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onCancel(job.id)}
                        aria-label={`Cancel ${job.name}`}
                      >
                        <X aria-hidden />
                      </Button>
                    ) : null}
                    {job.state === "done" && onDownload ? (
                      <Button
                        data-slot="render-queue-download"
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onDownload(job.id)}
                        aria-label={`Download ${job.name}`}
                      >
                        <Download aria-hidden />
                        Download
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { RenderQueue };
export type { RenderJob, RenderJobSpec, RenderJobState, RenderQueueProps };
