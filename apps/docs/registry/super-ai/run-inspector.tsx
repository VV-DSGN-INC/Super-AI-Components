"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { StatReadout, type StatReadoutItem } from "@/registry/super-ai/stat-readout";

/**
 * Run Inspector — Span detail: I/O, tokens, cost, errors
 *
 * Spec: docs/design-system/component-specs.md#n5-run-inspector
 * States: input-tab · output-tab · metadata-tab · error-tab
 *
 * Base: Tabs (components/ui/tabs, Base UI) and A10 `stat-readout` for the
 * metadata pane. Three spec sentences are load-bearing and enforced here
 * rather than left to the call site:
 *
 * 1. **Raw input and output are copyable JSON, not just pretty-printed.**
 *    `RunInspectorJsonPane` always pairs its `<pre>` block with a copy
 *    button whose payload is `JSON.stringify(value, null, 2)` — the same
 *    text that's visible, so what a bug report gets is exactly what was
 *    read on screen.
 * 2. **Cache hit/miss sits beside cost**, not in its own row. When `cost` is
 *    given, `cacheHit` renders as a badge inside the *same* stat-readout
 *    `dd` as the cost chip, because cache state is usually the largest
 *    lever on spend and a reader should not have to hunt a separate row
 *    for it.
 * 3. **The error tab states retry lineage in both directions**, in visible
 *    text: `retriedAttempt` ("what this run retried, and did *that* fail")
 *    and `retriedBy` ("what retried this run, and did it work"). Neither is
 *    inferred from `error` alone.
 *
 * This component is standalone: it does not import N4 `trace-timeline`.
 * `retriedAttempt`/`retriedBy` are shaped identically to N4's exported
 * `TraceSpanRetryOutcome` (`{ id, name, status }`) on purpose, so a host
 * driving N4's `renderDetail(span, retriedBy)` callback can hand `retriedBy`
 * straight through, and derive `retriedAttempt` with one lookup of its own
 * `spans` array by `span.retryOf` (`retriedBy` only points forward; a host
 * already holds the full span list, so the one step backward is a single
 * `.find()`, not a new capability this component would need to expose).
 *
 * **Tabs orientation:** the vendored `ui/tabs.tsx` wrapper re-emits
 * `orientation` only as `data-orientation` — a `variant="vertical"` tab list
 * built from it would keep horizontal arrow keys and announce
 * `aria-orientation="horizontal"` regardless of what's asked for. This
 * component never sets `orientation`, so it stays on the wrapper's default
 * (horizontal) the whole way through — the natural shape for a top-of-panel
 * tab bar — and the bug never gets a chance to fire. A vertical rail would
 * need Base UI's `Tabs` composed directly instead of this wrapper.
 */

type RunInspectorTab = "input" | "output" | "metadata" | "error";

type RunInspectorRetryStatus = "ok" | "error" | "running";

/** Shaped identically to N4 trace-timeline's exported `TraceSpanRetryOutcome`. */
interface RunInspectorRetryOutcome {
  id: string;
  name: string;
  status: RunInspectorRetryStatus;
}

interface RunInspectorMetadata {
  model?: string;
  /** Milliseconds. */
  latencyMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number;
  /** Defaults to "credits" — matches A2 `cost-chip`'s own default. */
  costUnit?: string;
  /** Rendered beside cost, in the same stat row. Omit when cache doesn't apply. */
  cacheHit?: boolean;
  /** Additional freeform rows, appended after the fixed fields above. */
  extra?: StatReadoutItem[];
}

interface RunInspectorProps extends Omit<React.ComponentProps<"div">, "onSelect"> {
  /** The raw request payload. Always shown pretty-printed and copyable. */
  input: unknown;
  /** The raw response payload. Omit while a run is still in flight. */
  output?: unknown;
  metadata?: RunInspectorMetadata;
  /** Visible in the error tab. `undefined` means this run didn't error. */
  error?: string;
  /** The attempt this run itself retried, if any — "what was retried". */
  retriedAttempt?: RunInspectorRetryOutcome;
  /** The attempt that retried this run, if any — "whether it worked". */
  retriedBy?: RunInspectorRetryOutcome;
  tab?: RunInspectorTab;
  defaultTab?: RunInspectorTab;
  onTabChange?: (tab: RunInspectorTab) => void;
  /** Accessible name for the tab list. */
  tabsLabel?: string;
}

const RETRY_STATUS_LABEL: Record<RunInspectorRetryStatus, string> = {
  ok: "Succeeded",
  error: "Failed",
  running: "Running",
};

/** `380ms`, `2.4s` — matches the millisecond-vs-second cutoff other timing surfaces in this registry use. */
function formatLatencyMs(ms: number): string {
  const safe = Number.isFinite(ms) && ms > 0 ? ms : 0;
  if (safe < 1000) return `${Math.round(safe)}ms`;
  return `${(safe / 1000).toFixed(safe < 10000 ? 2 : 1)}s`;
}

function toRawJson(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function RunInspectorCopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={label}
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function RunInspectorJsonPane({
  panelId,
  heading,
  value,
  emptyText,
}: {
  panelId: "input" | "output";
  heading: string;
  value: unknown;
  emptyText: string;
}) {
  const raw = toRawJson(value);
  return (
    <div data-run-inspector-panel-id={panelId} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-foreground text-sm font-medium">{heading}</h4>
        {raw !== undefined ? (
          <RunInspectorCopyButton label={`Copy ${heading.toLowerCase()} JSON`} value={raw} />
        ) : null}
      </div>
      {raw !== undefined ? (
        <pre className="bg-muted text-foreground max-h-80 overflow-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">
          {raw}
        </pre>
      ) : (
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      )}
    </div>
  );
}

function buildMetadataItems(metadata: RunInspectorMetadata | undefined): StatReadoutItem[] {
  if (!metadata) return [];
  const items: StatReadoutItem[] = [];

  if (metadata.model !== undefined) {
    items.push({ label: "Model", value: metadata.model });
  }
  if (metadata.latencyMs !== undefined) {
    items.push({ label: "Latency", value: formatLatencyMs(metadata.latencyMs) });
  }
  if (metadata.tokensIn !== undefined) {
    items.push({ label: "Tokens in", value: metadata.tokensIn.toLocaleString() });
  }
  if (metadata.tokensOut !== undefined) {
    items.push({ label: "Tokens out", value: metadata.tokensOut.toLocaleString() });
  }

  // Cache hit/miss rides in the *same* value as cost — see rule 2 in the
  // file-header comment. When there's no cost to attach it to, it still
  // gets its own row rather than being dropped.
  if (metadata.cost !== undefined) {
    items.push({
      label: "Cost",
      value: (
        <span className="flex flex-wrap items-center gap-1.5">
          <CostChip amount={metadata.cost} unit={metadata.costUnit ?? "credits"} />
          {metadata.cacheHit !== undefined ? (
            <span className="text-foreground rounded-full border px-1.5 py-0 text-[10px] font-medium">
              {metadata.cacheHit ? "Cache hit" : "Cache miss"}
            </span>
          ) : null}
        </span>
      ),
    });
  } else if (metadata.cacheHit !== undefined) {
    items.push({ label: "Cache", value: metadata.cacheHit ? "Hit" : "Miss" });
  }

  if (metadata.extra) items.push(...metadata.extra);

  return items;
}

function RunInspectorErrorPane({
  error,
  retriedAttempt,
  retriedBy,
}: {
  error?: string;
  retriedAttempt?: RunInspectorRetryOutcome;
  retriedBy?: RunInspectorRetryOutcome;
}) {
  const hasRetryInfo = Boolean(retriedAttempt || retriedBy);

  if (!error && !hasRetryInfo) {
    return <p className="text-muted-foreground text-sm">No error recorded for this run.</p>;
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      {error ? (
        <p className="text-destructive">
          <span className="font-medium">Error: </span>
          {error}
        </p>
      ) : (
        <p className="text-muted-foreground">This run did not error.</p>
      )}
      {retriedAttempt ? (
        <p>
          <span className="text-foreground font-medium">Retried attempt: </span>
          {`${retriedAttempt.name} — ${RETRY_STATUS_LABEL[retriedAttempt.status]}`}
        </p>
      ) : null}
      {retriedBy ? (
        <p>
          <span className="text-foreground font-medium">Retried by: </span>
          {`${retriedBy.name} — ${RETRY_STATUS_LABEL[retriedBy.status]}`}
        </p>
      ) : null}
    </div>
  );
}

function RunInspector({
  input,
  output,
  metadata,
  error,
  retriedAttempt,
  retriedBy,
  tab: tabProp,
  defaultTab = "input",
  onTabChange,
  tabsLabel = "Run detail",
  className,
  ...props
}: RunInspectorProps) {
  const [internalTab, setInternalTab] = React.useState<RunInspectorTab>(defaultTab);
  const currentTab = tabProp ?? internalTab;
  const metadataItems = React.useMemo(() => buildMetadataItems(metadata), [metadata]);

  return (
    <div data-slot="run-inspector" className={cn("flex flex-col gap-3", className)} {...props}>
      <Tabs
        value={currentTab}
        onValueChange={(next) => {
          if (typeof next !== "string") return;
          if (tabProp === undefined) setInternalTab(next as RunInspectorTab);
          onTabChange?.(next as RunInspectorTab);
        }}
      >
        <TabsList aria-label={tabsLabel} data-slot="run-inspector-tabs" className="w-full justify-start">
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="error">
            Error
            {error ? (
              <span aria-hidden className="bg-destructive ml-1 inline-block size-1.5 rounded-full" />
            ) : null}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="input" data-slot="run-inspector-input-panel">
          <RunInspectorJsonPane
            panelId="input"
            heading="Input"
            value={input}
            emptyText="No input recorded."
          />
        </TabsContent>
        <TabsContent value="output" data-slot="run-inspector-output-panel">
          <RunInspectorJsonPane
            panelId="output"
            heading="Output"
            value={output}
            emptyText="No output recorded — this run may still be in flight."
          />
        </TabsContent>
        <TabsContent value="metadata" data-slot="run-inspector-metadata-panel">
          <div data-run-inspector-panel-id="metadata">
            <StatReadout items={metadataItems} />
          </div>
        </TabsContent>
        <TabsContent value="error" data-slot="run-inspector-error-panel">
          <div data-run-inspector-panel-id="error">
            <RunInspectorErrorPane error={error} retriedAttempt={retriedAttempt} retriedBy={retriedBy} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export { RunInspector };
export type { RunInspectorMetadata, RunInspectorProps, RunInspectorRetryOutcome, RunInspectorTab };
