"use client";

import "@/components/openui/no-devtools";

import { createLibrary, defineComponent } from "@openuidev/react-lang";
import * as React from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GeneratedBody } from "@/registry/super-ai/generated-body";
import { StatReadout } from "@/registry/super-ai/stat-readout";

/** A node's props, read off the element a parent was handed. */
function elementProps(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || !("props" in value)) return null;
  const props = (value as { props: unknown }).props;
  return typeof props === "object" && props !== null ? (props as Record<string, unknown>) : null;
}

const Markdown = defineComponent({
  name: "Markdown",
  description: "Prose: a short sentence or paragraph.",
  props: z.object({ text: z.string() }),
  component: ({ props }) => <p className="text-sm">{props.text}</p>,
});

const Stat = defineComponent({
  name: "Stat",
  description: "One label and its value inside Stats. The value carries its unit.",
  props: z.object({ label: z.string(), value: z.string() }),
  component: ({ props }) => (
    <span>
      {props.label}: {props.value}
    </span>
  ),
});

const Stats = defineComponent({
  name: "Stats",
  description: "A short set of labelled values.",
  props: z.object({ items: z.array(Stat.ref).min(1), columns: z.enum(["1", "2"]) }),
  component: ({ props }) => {
    const items = (props.items as unknown[]).flatMap((node) => {
      const p = elementProps(node);
      return p ? [{ label: String(p.label), value: String(p.value) }] : [];
    });
    return <StatReadout items={items} columns={props.columns === "1" ? 1 : 2} />;
  },
});

const DataTable = defineComponent({
  name: "Table",
  description: "Rows of records with the same columns. Every cell is short text.",
  props: z.object({
    columns: z.array(z.string()).min(1).max(5),
    rows: z.array(z.array(z.string())).min(1),
  }),
  component: ({ props }) => (
    <Table>
      <TableHeader>
        <TableRow>
          {props.columns.map((c) => (
            <TableHead key={c}>{c}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((row, r) => (
          <TableRow key={r}>
            {row.map((cell, c) => (
              <TableCell key={c} className="whitespace-normal">
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
});

const Page = defineComponent({
  name: "Page",
  description: "The one root of a view. Blocks top to bottom.",
  props: z.object({ children: z.array(z.union([Markdown.ref, Stats.ref, DataTable.ref])).min(1) }),
  component: ({ props, renderNode }) => (
    <div className="flex min-w-0 flex-col gap-4">
      {(props.children as unknown[]).map((child, i) => (
        <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
      ))}
    </div>
  ),
});

/** The library the stories, the demo and the docs examples share: Page, Stats,
 *  Stat, Table and Markdown. There is no Chart, which is what the failing
 *  version below asks for. */
export const generatedBodyLibrary = createLibrary({
  root: "Page",
  components: [Markdown, Stat, Stats, DataTable, Page],
});

const SPEND_LINES = [
  "root = Page([intro, totals, projects])",
  'intro = Markdown("Credits spent, by project.")',
  'totals = Stats([s0, s1, s2, s3], "2")',
  's0 = Stat("Video", "420 credits")',
  's1 = Stat("Image", "150 credits")',
  's2 = Stat("Audio", "40 credits")',
  's3 = Stat("Total", "610 credits")',
  'projects = Table(["Project", "Runs", "Credits"], [["Onboarding video", "9", "380"], ["Spring campaign", "18", "170"], ["Podcast intro", "8", "60"]])',
];

/** What "Show spend by project" produces. */
export const SPEND_PROGRAM = SPEND_LINES.join("\n");

/** "Add a daily trend": the same body plus a Chart, which the library does not expose. */
export const TREND_PROGRAM = [
  "root = Page([intro, totals, trend, projects])",
  ...SPEND_LINES.slice(1, 7),
  'trend = Chart("line", days)',
  SPEND_LINES[7],
].join("\n");

/** What Retry comes back with: the body again, and a sentence in place of the chart. */
export const RETRY_PROGRAM = [
  "root = Page([intro, note, totals, projects])",
  SPEND_LINES[1],
  'note = Markdown("Daily figures are not available, so the trend is left out.")',
  ...SPEND_LINES.slice(2),
].join("\n");

/** The spend body cut off before its last line: what arrives mid-stream. */
export const CUT_OFF_PROGRAM = SPEND_LINES.slice(0, 5).join("\n");

const LINE_MS = 280;

type Run = { text: string; shown: number };

export default function GeneratedBodyDemo() {
  const [run, setRun] = React.useState<Run | null>(null);
  const [lastGood, setLastGood] = React.useState<string | null>(null);
  const [retryText, setRetryText] = React.useState<string | null>(null);

  const lines = run ? run.text.split("\n") : [];
  const streaming = run !== null && run.shown < lines.length;

  React.useEffect(() => {
    if (!streaming) return;
    const timer = setTimeout(() => setRun((r) => (r ? { ...r, shown: r.shown + 1 } : r)), LINE_MS);
    return () => clearTimeout(timer);
  }, [streaming, run?.shown]);

  const start = (text: string, onFail: string | null = null) => {
    setRetryText(onFail);
    setRun({ text, shown: 0 });
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => start(SPEND_PROGRAM)}>
          Show spend by project
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => start(TREND_PROGRAM, RETRY_PROGRAM)}
          disabled={lastGood === null}
        >
          Add a daily trend
        </Button>
      </div>
      {run ? (
        <GeneratedBody
          program={lines.slice(0, run.shown).join("\n")}
          library={generatedBodyLibrary}
          streaming={streaming}
          fallbackProgram={lastGood}
          onRetry={retryText ? () => start(retryText) : undefined}
          onRender={({ ok }) => {
            if (ok) setLastGood(run.text);
          }}
        />
      ) : (
        <p className="text-foreground text-sm">Choose a view to stream it in.</p>
      )}
    </div>
  );
}
