"use client";

import "./no-devtools";

import {
  defineComponent,
  FormNameContext,
  useFormName,
  useGetFieldValue,
  useSetFieldValue,
  useTriggerAction,
  type ComponentGroup,
} from "@openuidev/react-lang";
import { Fragment, type ComponentProps, type ReactNode } from "react";
import { Streamdown } from "streamdown";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChoiceChip, ChoiceChips } from "@/registry/super-ai/choice-chips";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { FieldRow } from "@/registry/super-ai/field-row";
import { SectionHeader } from "@/registry/super-ai/section-header";
import { SourceCards } from "@/registry/super-ai/source-cards";
import { StatReadout } from "@/registry/super-ai/stat-readout";
import { SuggestionChip, SuggestionChips } from "@/registry/super-ai/suggestion-chips";
import { TraceTimeline, type TraceSpan } from "@/registry/super-ai/trace-timeline";

import { descriptionFor, enumFor, intentNote, notesFor } from "./catalog";

/** Every OpenUI surface this demo exposes, in dependency order. Registry
 *  items are compound components and OpenUI wants one flat, positional call
 *  per node, so each surface is a wrapper that names the slots the model may
 *  fill; every other slot keeps the component's default. A surface backed by
 *  a registry item takes its description and enums from the emitted catalog
 *  (`surfaceSlugs` below), so the meta is the contract the model reads. A
 *  docs-local surface (Page, Markdown, Card, Table, Button, Actions, Form)
 *  wraps a vendored `ui/` primitive and carries its own sentence. Overlays and
 *  charts are never surfaces: a menu or dialog opening mid-stream is a modal
 *  inside a conversation. */

const nodes = (values: unknown[], renderNode: (v: unknown) => ReactNode) =>
  values.map((v, i) => <Fragment key={i}>{renderNode(v)}</Fragment>);

// ── prose ────────────────────────────────────────────────────────────────

/** Slots: the text. Streamdown renders it, as AI Elements' message does. */
export const Markdown = defineComponent({
  name: "Markdown",
  description:
    "Prose: short paragraphs, lists, inline code. Every sentence the assistant says goes here. Never for a number that answers the question (that is a Stat) or for rows (that is a Table or a List).",
  props: z.object({ text: z.string() }),
  component: ({ props }) => <Streamdown className="text-sm leading-relaxed">{props.text}</Streamdown>,
});

/** Slots: title, count, size. Not filled: action, collapsible. */
export const HeadingSurface = defineComponent({
  name: "Heading",
  description: descriptionFor("section-header"),
  props: z.object({
    title: z.string(),
    count: z.number().int().min(0).optional().describe("how many items the section below holds"),
    size: enumFor("section-header", "size"),
  }),
  component: ({ props }) => (
    <SectionHeader
      title={props.title}
      count={props.count}
      size={props.size as ComponentProps<typeof SectionHeader>["size"]}
    />
  ),
});

// ── values ───────────────────────────────────────────────────────────────

/** One label and value pair inside Stats; it has no rendering of its own. */
export const StatSurface = defineComponent({
  name: "Stat",
  description: "One label and its value inside Stats. The value carries its unit, e.g. 2.6 s.",
  props: z.object({ label: z.string(), value: z.string() }),
  component: ({ props }) => (
    <span>
      {props.label}: {props.value}
    </span>
  ),
});

/** Slots: items (from Stat children), columns. Not filled: copyable. */
export const StatsSurface = defineComponent({
  name: "Stats",
  description: descriptionFor("stat-readout"),
  props: z.object({
    items: z.array(StatSurface.ref).min(1),
    columns: enumFor("stat-readout", "columns"),
  }),
  component: ({ props }) => {
    const items = (props.items as unknown[]).flatMap((node) => {
      const p = elementProps(node);
      return p ? [{ label: String(p.label), value: String(p.value) }] : [];
    });
    return <StatReadout items={items} columns={Number(props.columns) as 1 | 2} />;
  },
});

// ── rows and collections ─────────────────────────────────────────────────

/** Slots: title, description. Not filled: icon, trailing, selection. */
export const RowSurface = defineComponent({
  name: "Row",
  description: descriptionFor("entity-row"),
  props: z.object({ title: z.string(), description: z.string().optional() }),
  component: ({ props }) => <EntityRow title={props.title} description={props.description} />,
});

export const ListSurface = defineComponent({
  name: "List",
  description:
    "Two to eight Rows stacked, for a short set of named things. More than eight, or more than two facts per thing, is a Table.",
  props: z.object({ rows: z.array(RowSurface.ref).min(1).max(8) }),
  component: ({ props, renderNode }) => (
    <div role="list" className="flex flex-col">
      {(props.rows as unknown[]).map((row, i) => (
        <div role="listitem" key={i}>
          {renderNode(row)}
        </div>
      ))}
    </div>
  ),
});

/** Slots: columns, rows, caption. Every cell is text. */
export const TableSurface = defineComponent({
  name: "Table",
  description:
    "Rows of records with the same columns. Every cell is short text; the first column names the row.",
  props: z.object({
    columns: z.array(z.string()).min(1).max(5),
    rows: z.array(z.array(z.string())).min(1).describe("one array per row, cells in column order"),
    caption: z.string().optional(),
  }),
  component: ({ props }) => (
    <Table>
      {props.caption ? <TableCaption>{props.caption}</TableCaption> : null}
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
              // Wrap instead of the cell's default nowrap: at 375px a long
              // task title would otherwise push the table past the viewport.
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

const SPAN_STATUS = ["ok", "error", "running"] as const satisfies readonly TraceSpan["status"][];
const SPAN_KIND = ["llm", "tool", "chain", "step"] as const satisfies readonly NonNullable<
  TraceSpan["kind"]
>[];

/** One span inside Trace; it has no rendering of its own. */
export const SpanSurface = defineComponent({
  name: "Span",
  description: "One timed step of an agent run inside Trace. A retry names the id of the span it retries.",
  props: z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(SPAN_STATUS),
    startMs: z.number().min(0),
    durationMs: z.number().min(0),
    kind: z.enum(SPAN_KIND).optional(),
    error: z.string().nullable().optional(),
    retryOf: z.string().nullable().optional(),
  }),
  component: ({ props }) => <span>{props.name}</span>,
});

/** Slots: spans (from Span children). Not filled: expansion state, detail renderer. */
export const TraceSurface = defineComponent({
  name: "Trace",
  description: descriptionFor("trace-timeline"),
  props: z.object({ spans: z.array(SpanSurface.ref).min(1) }),
  component: ({ props }) => {
    const spans = (props.spans as unknown[]).flatMap((node): TraceSpan[] => {
      const p = elementProps(node);
      if (!p) return [];
      return [
        {
          id: String(p.id),
          name: String(p.name),
          status: p.status as TraceSpan["status"],
          startMs: Number(p.startMs),
          durationMs: Number(p.durationMs),
          ...(p.kind ? { kind: p.kind as TraceSpan["kind"] } : {}),
          ...(p.error ? { error: String(p.error) } : {}),
          ...(p.retryOf ? { retryOf: String(p.retryOf) } : {}),
        },
      ];
    });
    return <TraceTimeline spans={spans} />;
  },
});

const RELEVANCE = ["high", "medium", "low"] as const;

/** One retrieved document inside Sources; it has no rendering of its own. */
export const SourceSurface = defineComponent({
  name: "Source",
  description:
    "One retrieved document inside Sources, with how relevant it was and whether the answer used it.",
  props: z.object({
    title: z.string(),
    snippet: z.string().optional(),
    relevance: z.enum(RELEVANCE),
    used: z.boolean(),
  }),
  component: ({ props }) => <span>{props.title}</span>,
});

/** Slots: sources (from Source children), hidden count. Not filled: open handlers. */
export const SourcesSurface = defineComponent({
  name: "Sources",
  description: descriptionFor("source-cards"),
  props: z.object({
    sources: z.array(SourceSurface.ref).min(1),
    hidden: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("sources withheld because the user may not read them"),
  }),
  component: ({ props }) => {
    const sources = (props.sources as unknown[]).flatMap((node, i) => {
      const p = elementProps(node);
      if (!p) return [];
      return [
        {
          id: `source-${i}`,
          title: String(p.title),
          ...(p.snippet ? { snippet: String(p.snippet) } : {}),
          relevance: p.relevance as (typeof RELEVANCE)[number],
          used: p.used === true,
        },
      ];
    });
    return <SourceCards sources={sources} permissionFilteredCount={props.hidden ?? 0} />;
  },
});

// ── actions ──────────────────────────────────────────────────────────────

/** Slots: label, action, variant. The size stays the vendored default. */
export const ButtonSurface = defineComponent({
  name: "Button",
  description: "One action the user can take next. Pressing it sends `action` as the user's next message.",
  props: z.object({
    label: z.string().describe("verb plus object, e.g. Add a task"),
    action: z
      .string()
      .describe("what the user is asking for when they press it; sent back as their next message"),
    variant: z
      .enum(["default", "outline"])
      .default("outline")
      .describe(
        "default: the one action the answer recommends, at most one per Page. outline: every other action.",
      ),
  }),
  component: function ButtonView({ props }) {
    const trigger = useTriggerAction();
    return (
      <Button variant={props.variant} onClick={() => void trigger(props.action)}>
        {props.label}
      </Button>
    );
  },
});

export const ActionsSurface = defineComponent({
  name: "Actions",
  description: "A row of one to three Buttons. At most one of them is the default variant.",
  props: z.object({ buttons: z.array(ButtonSurface.ref).min(1).max(3) }),
  component: ({ props, renderNode }) => (
    <div className="flex flex-wrap gap-2">{nodes(props.buttons, renderNode)}</div>
  ),
});

/** Slots: the suggestion strings. Not filled: icon, thumbnail, overflow link. */
export const FollowUpsSurface = defineComponent({
  name: "FollowUps",
  description: descriptionFor("suggestion-chips"),
  props: z.object({ items: z.array(z.string()).min(1).max(4) }),
  component: function FollowUpsView({ props }) {
    const trigger = useTriggerAction();
    return (
      <SuggestionChips aria-label="Follow-up questions">
        {props.items.map((s) => (
          <SuggestionChip key={s} suggestion={s} onSelect={(v) => void trigger(v)} />
        ))}
      </SuggestionChips>
    );
  },
});

/** Slots: title, description, size, one action Button. Not filled: icon,
 *  secondary action, example pair. */
export const EmptySurface = defineComponent({
  name: "Empty",
  description: descriptionFor("empty-state"),
  props: z.object({
    title: z.string(),
    description: z.string(),
    size: enumFor("empty-state", "size", { exclude: ["page"] }),
    action: z.optional(ButtonSurface.ref),
  }),
  component: ({ props, renderNode }) => (
    <EmptyState
      title={props.title}
      description={props.description}
      size={props.size as ComponentProps<typeof EmptyState>["size"]}
      action={props.action ? renderNode(props.action) : undefined}
    />
  ),
});

// ── form ─────────────────────────────────────────────────────────────────

function useField(name: string, componentType: string) {
  const formName = useFormName();
  const get = useGetFieldValue();
  const set = useSetFieldValue();
  return {
    value: get(formName, name) as unknown,
    setValue: (value: unknown) => set(formName, componentType, name, value, false),
  };
}

/** Slots: name, label, hint. The control is the vendored Input, required. */
export const TextFieldSurface = defineComponent({
  name: "TextField",
  description: descriptionFor("field-row"),
  props: z.object({
    name: z.string().describe("field key, lowercase"),
    label: z.string(),
    hint: z.string().optional(),
  }),
  component: function TextFieldView({ props }) {
    const field = useField(props.name, "TextField");
    return (
      <FieldRow label={props.label} hint={props.hint}>
        {(id, describedBy) => (
          <Input
            id={id}
            name={props.name}
            required
            aria-describedby={describedBy}
            value={typeof field.value === "string" ? field.value : ""}
            onChange={(e) => field.setValue(e.target.value)}
          />
        )}
      </FieldRow>
    );
  },
});

/** Slots: name, label, options. One chip per option. */
export const ChoiceFieldSurface = defineComponent({
  name: "ChoiceField",
  description: descriptionFor("choice-chips"),
  props: z.object({
    name: z.string(),
    label: z.string(),
    options: z.array(z.string()).min(2).max(6),
  }),
  component: function ChoiceFieldView({ props }) {
    const field = useField(props.name, "ChoiceField");
    // On a field-row so it aligns with TextField. The row's <label> points at
    // the radiogroup, which a label cannot name, so the group carries its own
    // aria-label with the same text.
    return (
      <FieldRow label={props.label}>
        {(id) => (
          <ChoiceChips
            id={id}
            aria-label={props.label}
            value={typeof field.value === "string" ? field.value : undefined}
            onValueChange={(v) => field.setValue(v)}
          >
            {props.options.map((o) => (
              <ChoiceChip key={o} value={o}>
                {o}
              </ChoiceChip>
            ))}
          </ChoiceChips>
        )}
      </FieldRow>
    );
  },
});

export const FormSurface = defineComponent({
  name: "Form",
  description:
    "A short form the user fills in and submits. Fields in the order they are asked for; the submit label names the outcome.",
  props: z.object({
    name: z.string().describe("form key, lowercase, unique in the answer"),
    title: z.string(),
    fields: z.array(z.union([TextFieldSurface.ref, ChoiceFieldSurface.ref])).min(1),
    submitLabel: z.string(),
  }),
  component: function FormView({ props, renderNode }) {
    const trigger = useTriggerAction();
    const titleId = `openui-${props.name}-title`;
    return (
      <FormNameContext.Provider value={props.name}>
        <form
          aria-labelledby={titleId}
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void trigger(props.submitLabel, props.name);
          }}
        >
          <h3 id={titleId} className="text-base font-medium">
            {props.title}
          </h3>
          {nodes(props.fields, renderNode)}
          <div>
            <Button type="submit">{props.submitLabel}</Button>
          </div>
        </form>
      </FormNameContext.Provider>
    );
  },
});

// ── containers ───────────────────────────────────────────────────────────

/** The props of a rendered child, when it is an OpenUI ElementNode.
 *  `defineComponent` sets `.ref` to the bare props schema, so at render time
 *  every child arrives as `{ typeName, props }`; a parent that hands its
 *  children to a data-driven registry component (Stats, Trace, Sources)
 *  reads them here instead of rendering them. */
function elementProps(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || !("props" in value)) return null;
  const props = (value as { props: unknown }).props;
  return typeof props === "object" && props !== null ? (props as Record<string, unknown>) : null;
}

function isElementNamed(value: unknown, names: string[]): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "typeName" in value &&
    names.includes((value as { typeName: unknown }).typeName as string)
  );
}

// Card holds one discrete object. Its schema admits no Card, no Sources (a
// stack of cards) and no Empty or Form, so a card never nests a card. Zod
// validates a union of refs by shape only, so Card's renderer also drops
// those types at render time: the schema is what the prompt reads, the filter
// is what the page enforces.
const cardBlockRefs = [
  Markdown.ref,
  HeadingSurface.ref,
  StatsSurface.ref,
  ListSurface.ref,
  TableSurface.ref,
] as const;
const notInCard = ["Card", "Sources", "Empty", "Form", "Page"];

/** Slots: title, description, children. Not filled: header action, footer. */
export const CardSurface = defineComponent({
  name: "Card",
  description:
    "One discrete object the answer is about, such as the record just created. Never a wrapper for a whole answer.",
  props: z.object({
    title: z.string(),
    description: z.string().optional(),
    children: z.array(z.union(cardBlockRefs)).min(1),
  }),
  component: ({ props, renderNode }) => (
    <Card>
      <CardHeader>
        <CardTitle>{props.title}</CardTitle>
        {props.description ? <CardDescription>{props.description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {nodes(
          (props.children as unknown[]).filter((v) => !isElementNamed(v, notInCard)),
          renderNode,
        )}
      </CardContent>
    </Card>
  ),
});

export const PageSurface = defineComponent({
  name: "Page",
  description: "The one root of an answer. Blocks top to bottom, the block that answers the question first.",
  props: z.object({
    children: z
      .array(
        z.union([
          ...cardBlockRefs,
          TraceSurface.ref,
          SourcesSurface.ref,
          CardSurface.ref,
          EmptySurface.ref,
          FormSurface.ref,
          ActionsSurface.ref,
          FollowUpsSurface.ref,
        ]),
      )
      .min(1),
  }),
  component: ({ props, renderNode }) => (
    <div className="flex min-w-0 flex-col gap-4">{nodes(props.children, renderNode)}</div>
  ),
});

export const ROOT = "Page";

export const components = [
  Markdown,
  HeadingSurface,
  StatSurface,
  StatsSurface,
  RowSurface,
  ListSurface,
  TableSurface,
  SpanSurface,
  TraceSurface,
  SourceSurface,
  SourcesSurface,
  ButtonSurface,
  ActionsSurface,
  FollowUpsSurface,
  EmptySurface,
  TextFieldSurface,
  ChoiceFieldSurface,
  FormSurface,
  CardSurface,
  PageSurface,
];

/** Which registry item backs each surface; null for a docs-local one over a
 *  vendored primitive. A child node (Stat, Span, Source) names the item its
 *  parent hands it to. The exposed-surfaces table and the tests read this. */
export const surfaceSlugs: Record<string, string | null> = {
  Markdown: null,
  Heading: "section-header",
  Stat: "stat-readout",
  Stats: "stat-readout",
  Row: "entity-row",
  List: null,
  Table: null,
  Span: "trace-timeline",
  Trace: "trace-timeline",
  Source: "source-cards",
  Sources: "source-cards",
  Button: null,
  Actions: null,
  FollowUps: "suggestion-chips",
  Empty: "empty-state",
  TextField: "field-row",
  ChoiceField: "choice-chips",
  Form: null,
  Card: null,
  Page: null,
};

export const componentGroups: ComponentGroup[] = [
  {
    name: "Composition",
    components: ["Page", "Card", "Heading", "Markdown", "Actions", "FollowUps"],
    notes: [
      "Page is the root and appears once. Never nest a Page.",
      "Never put a Card inside a Card. Use one Card only for a discrete object; separate sections with a Heading.",
      "Markdown carries every sentence. Numbers that answer the question go in Stats; more than five named things is a Table.",
      "At most one Button with the default variant per Page; every other Button is outline. A Button label is a verb plus its object.",
      intentNote("section-header", "size", "Heading"),
      "End with FollowUps only when there is a real next question.",
      ...notesFor("section-header", "Heading"),
      ...notesFor("suggestion-chips", "FollowUps"),
    ],
  },
  {
    name: "Data",
    components: ["Stats", "Stat", "Table", "List", "Row", "Trace", "Span", "Sources", "Source"],
    notes: [
      intentNote("stat-readout", "columns", "Stats"),
      ...notesFor("stat-readout", "Stats"),
      ...notesFor("entity-row", "Row"),
      ...notesFor("trace-timeline", "Trace"),
      ...notesFor("source-cards", "Sources"),
    ],
  },
  {
    name: "Feedback",
    components: ["Empty"],
    notes: [
      intentNote("empty-state", "size", "Empty", { exclude: ["page"] }),
      ...notesFor("empty-state", "Empty"),
    ],
  },
  {
    name: "Input",
    components: ["Form", "TextField", "ChoiceField", "Button"],
    notes: [
      "A Form appears once per Page and never inside a Card.",
      ...notesFor("field-row", "TextField"),
      ...notesFor("choice-chips", "ChoiceField"),
    ],
  },
];
