"use client";

import { AlertTriangle, Coins, LoaderCircle, RotateCw, Table2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ApprovalCard } from "@/registry/super-ai/approval-card";
import { CostChip } from "@/registry/super-ai/cost-chip";
import { EntityRow } from "@/registry/super-ai/entity-row";
import {
  isQuestionLocked,
  type QuestionData,
  type QuestionStatus,
  type ReplyRenderers,
  type ViewCardData,
} from "@/registry/super-ai/generated-chat";
import { StatReadout } from "@/registry/super-ai/stat-readout";
import { SuggestionChip, SuggestionChips } from "@/registry/super-ai/suggestion-chips";
import { Widget } from "@/registry/super-ai/widget";
import { WidgetGrid, WidgetGridItem } from "@/registry/super-ai/widget-grid";

import {
  creditsLeft,
  failedOvernight,
  fmt,
  overnightRuns,
  PLAN,
  runningNow,
  timedOutOvernight,
  weekSpend,
} from "./fixtures";
import { retryQuestion } from "./turns";

/** What a card may ask of the page. Cards take data props and reach the chat only through this. */
export interface DemoActions {
  submit: (text: string) => void;
  ask: (question: QuestionData) => void;
  answer: (question: QuestionData, approved: boolean) => void;
  undo: (question: QuestionData) => void;
  statusFor: (question: QuestionData, cardKey: string) => QuestionStatus | undefined;
  /** The question's latest status, whichever card shows it. */
  statusOf: (questionId: string) => QuestionStatus | undefined;
  showView: (viewId: string) => void;
  activeViewId: string | null;
  viewLabel: (viewId: string) => string;
  /** A reply is arriving: every chip and action waits. */
  busy: boolean;
}

export const DemoActionsContext = React.createContext<DemoActions | null>(null);

function useDemoActions(): DemoActions {
  const actions = React.useContext(DemoActionsContext);
  if (!actions) throw new Error("Generated chat cards render inside DemoActionsContext.");
  return actions;
}

function FailedRunsCard() {
  const { ask, busy, statusOf } = useDemoActions();
  const question = retryQuestion();
  const runs = failedOvernight();
  const retryable = timedOutOvernight();
  const locked = isQuestionLocked(statusOf(question.id));
  return (
    <Card data-slot="failed-runs-card" className="gap-3">
      <CardHeader>
        <CardTitle>Failed overnight</CardTitle>
        <CardDescription className="text-foreground">
          {runs.length} of {overnightRuns().length} runs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* E6 generation-queue always draws a batch bar, which reads a settled
            list of failures as work finishing; rows are entity-row instead. */}
        <ul aria-label="Failed runs" className="flex flex-col">
          {runs.map((r) => (
            <li key={r.id}>
              <EntityRow
                icon={<AlertTriangle aria-hidden className="text-destructive" />}
                title={r.prompt}
                description={`${r.reason} · ${r.project} · ${r.at}`}
                trailing={<span className="text-foreground text-xs">Failed</span>}
              />
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="justify-end">
        <Button type="button" size="sm" disabled={busy || locked} onClick={() => ask(question)}>
          <RotateCw aria-hidden />
          Retry {retryable.length} timed-out runs
        </Button>
      </CardFooter>
    </Card>
  );
}

function WeekSpendCard() {
  const spend = weekSpend();
  return (
    <Card data-slot="week-spend-card" className="gap-3">
      <CardHeader>
        <CardTitle>Credits this week</CardTitle>
        <CardDescription className="text-foreground">Monday 19 to Tuesday 20 October</CardDescription>
      </CardHeader>
      <CardContent>
        <StatReadout
          items={[
            { label: "Video", value: <CostChip amount={fmt(spend.video)} /> },
            { label: "Image", value: <CostChip amount={fmt(spend.image)} /> },
            { label: "Audio", value: <CostChip amount={fmt(spend.audio)} /> },
            { label: "Total", value: <CostChip amount={fmt(spend.total)} /> },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function CreditsWidget() {
  const { submit, busy } = useDemoActions();
  const left = creditsLeft();
  const used = Math.round((PLAN.used / PLAN.credits) * 100);
  return (
    <Widget
      size="small"
      title="Credits left"
      icon={<Coins />}
      onOpen={() => {
        if (!busy) submit("How much have we spent this week?");
      }}
      openLabel={`Credits left, ${fmt(left)} of ${fmt(PLAN.credits)}. Ask how much was spent this week`}
    >
      <div className="flex h-full flex-col justify-end gap-2">
        <span className="text-3xl font-semibold tabular-nums">{fmt(left)}</span>
        <Progress value={used} aria-label={`${used} percent of the plan used`} />
        <span className="text-foreground text-xs">of {fmt(PLAN.credits)}</span>
      </div>
    </Widget>
  );
}

function FailedWidget() {
  const { submit, busy } = useDemoActions();
  const failed = failedOvernight();
  return (
    <Widget
      size="small"
      title="Failed overnight"
      icon={<AlertTriangle />}
      onOpen={() => {
        if (!busy) submit("What failed overnight?");
      }}
      openLabel={`Failed overnight, ${failed.length} of ${overnightRuns().length} runs. Ask what failed`}
    >
      <div className="flex h-full flex-col justify-end gap-2">
        <span className="text-3xl font-semibold tabular-nums">{failed.length}</span>
        <span className="text-foreground text-xs">of {overnightRuns().length} runs</span>
      </div>
    </Widget>
  );
}

function RunningWidget() {
  const running = runningNow();
  return (
    <Widget size="medium" title="Running now" icon={<LoaderCircle />} meta={String(running.length)}>
      <ul className="flex flex-col gap-2">
        {running.map((r) => (
          <li key={r.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">{`${r.project}, ${r.prompt}`}</span>
              <span className="text-foreground tabular-nums">{r.progress}%</span>
            </div>
            <Progress value={r.progress ?? 0} aria-label={`${r.prompt}, ${r.progress} percent`} />
          </li>
        ))}
      </ul>
    </Widget>
  );
}

function QuestionCard({ data, cardKey }: { data: QuestionData; cardKey: string }) {
  const { answer, undo, statusFor } = useDemoActions();
  const status = statusFor(data, cardKey);
  const resolved = status === "approved" || status === "skipped";
  return (
    <ApprovalCard
      title={data.title}
      summary={
        <>
          {data.summary}
          {data.cost !== undefined ? (
            <>
              {" "}
              <CostChip amount={data.cost} />
            </>
          ) : null}
        </>
      }
      state={resolved ? "resolved" : "pending"}
      resolution={status === "approved" ? "confirmed" : resolved ? "skipped" : undefined}
      onConfirm={status === "requested" ? () => answer(data, true) : undefined}
      onSkip={status === "requested" ? () => answer(data, false) : undefined}
      onUndo={data.undoable && status === "approved" ? () => undo(data) : undefined}
      undoWindowMs={10000}
    />
  );
}

function ViewCard({ data }: { data: ViewCardData }) {
  const { showView, activeViewId, viewLabel, busy } = useDemoActions();
  const showing = activeViewId === data.viewId;
  return (
    <div data-slot="view-card" className="bg-card rounded-xl border">
      <EntityRow
        icon={<Table2 aria-hidden />}
        title={data.title}
        description={viewLabel(data.viewId)}
        trailing={
          showing ? (
            <span className="text-foreground text-xs">Showing</span>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              aria-label={`Show ${data.title}`}
              onClick={() => showView(data.viewId)}
            >
              Show
            </Button>
          )
        }
      />
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  const { submit, busy } = useDemoActions();
  return (
    <SuggestionChips>
      {items.map((item) => (
        <SuggestionChip key={item} suggestion={item} disabled={busy} onSelect={submit} />
      ))}
    </SuggestionChips>
  );
}

export const RENDERERS: ReplyRenderers = {
  cards: { "failed-runs": FailedRunsCard, "week-spend": WeekSpendCard },
  widgets: {
    credits: { small: CreditsWidget },
    failed: { small: FailedWidget },
    running: { medium: RunningWidget },
  },
  widgetGrid: (items) => (
    <WidgetGrid>
      {items.map((item) => (
        <WidgetGridItem key={item.key} size={item.size}>
          {item.node}
        </WidgetGridItem>
      ))}
    </WidgetGrid>
  ),
  question: (data, cardKey) => <QuestionCard data={data} cardKey={cardKey} />,
  view: (data) => <ViewCard data={data} />,
  suggestions: (items) => <Chips items={items} />,
};
