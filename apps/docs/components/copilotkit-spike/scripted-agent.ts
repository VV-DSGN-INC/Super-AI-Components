import { AbstractAgent, type RunAgentInput } from "@ag-ui/client";
import { EventType, type BaseEvent, type Message } from "@ag-ui/core";
import { Observable } from "rxjs";

import { fmt, retryCost, RUNS, timedOutOvernight, type Run } from "@/components/generated-chat/fixtures";

/**
 * SPIKE. A scripted AG-UI agent: no model, no key, no cost.
 *
 * It answers over the same fixture workspace as /generated-chat, so the two
 * demos tell one story through two runtimes. The script is a pure function of
 * the conversation so far, which is all an AG-UI agent is; CopilotKit cannot
 * tell it from a model-backed agent.
 */

export const LIST_TOOL = "list_failed_runs";
export const RETRY_TOOL = "retry_runs";

export type AgentPhase = "idle" | "reading" | "waiting" | "retrying" | "done";

export interface AgentState {
  phase: AgentPhase;
  /** Runs found by the read tool. */
  failed: number;
  /** Runs the human let the agent retry. */
  retried: number;
}

export interface RetryArgs {
  runIds: string[];
  credits: number;
}

/** What the browser sends back from the approval surface. */
export interface RetryDecision {
  approved: boolean;
  /** Present when the human edited the call before approving it. */
  runIds?: string[];
}

type ScriptInput = Pick<RunAgentInput, "threadId" | "runId" | "messages">;

const text = (messageId: string, body: string): BaseEvent[] => [
  { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" } as BaseEvent,
  // One event per word, the way a model streams, so the UI has something to reveal.
  ...body
    .split(/(?<=\s)/)
    .map((delta) => ({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta }) as BaseEvent),
  { type: EventType.TEXT_MESSAGE_END, messageId } as BaseEvent,
];

const toolCall = (toolCallId: string, toolCallName: string, args: unknown): BaseEvent[] => [
  { type: EventType.TOOL_CALL_START, toolCallId, toolCallName } as BaseEvent,
  { type: EventType.TOOL_CALL_ARGS, toolCallId, delta: JSON.stringify(args) } as BaseEvent,
  { type: EventType.TOOL_CALL_END, toolCallId } as BaseEvent,
];

const state = (snapshot: AgentState): BaseEvent =>
  ({ type: EventType.STATE_SNAPSHOT, snapshot }) as BaseEvent;

/** The retry call the last tool message answers, if that is what it answers. */
function answeredRetry(messages: Message[]): RetryDecision | null {
  const last = messages.at(-1);
  if (last?.role !== "tool") return null;
  const asked = messages.some(
    (m) =>
      m.role === "assistant" &&
      m.toolCalls?.some((c) => c.id === last.toolCallId && c.function.name === RETRY_TOOL),
  );
  if (!asked) return null;
  try {
    const parsed: unknown = JSON.parse(typeof last.content === "string" ? last.content : "");
    if (parsed && typeof parsed === "object" && "approved" in parsed) return parsed as RetryDecision;
  } catch {
    // An unreadable answer is a refusal: never spend on a reply we cannot parse.
  }
  return { approved: false };
}

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

export function scriptFor({ threadId, runId, messages }: ScriptInput): BaseEvent[] {
  const id = (suffix: string) => `${runId}-${suffix}`;
  const open: BaseEvent = { type: EventType.RUN_STARTED, threadId, runId } as BaseEvent;
  const close: BaseEvent = { type: EventType.RUN_FINISHED, threadId, runId } as BaseEvent;
  const failed = timedOutOvernight();

  const decision = answeredRetry(messages);
  if (decision) {
    // Second run: the human answered. An edited call wins over the one proposed.
    const chosen: Run[] = decision.runIds ? RUNS.filter((r) => decision.runIds?.includes(r.id)) : failed;
    if (!decision.approved || chosen.length === 0) {
      return [
        open,
        ...text(id("declined"), "Left them as they are. Nothing was spent."),
        state({ phase: "done", failed: failed.length, retried: 0 }),
        close,
      ];
    }
    return [
      open,
      state({ phase: "retrying", failed: failed.length, retried: 0 }),
      ...text(
        id("retried"),
        `Retrying ${plural(chosen.length, "run")} now for ${fmt(retryCost(chosen))} credits. Back in the queue.`,
      ),
      state({ phase: "done", failed: failed.length, retried: chosen.length }),
      close,
    ];
  }

  // First run: read, report, then ask before the step that spends.
  return [
    open,
    state({ phase: "reading", failed: 0, retried: 0 }),
    ...text(id("reading"), "Reading last night's runs."),
    ...toolCall(id("list"), LIST_TOOL, { window: "overnight", reason: "Timed out" }),
    {
      type: EventType.TOOL_CALL_RESULT,
      messageId: id("list-result"),
      toolCallId: id("list"),
      content: JSON.stringify({ runs: failed }),
      role: "tool",
    } as BaseEvent,
    state({ phase: "waiting", failed: failed.length, retried: 0 }),
    ...text(
      id("found"),
      `${plural(failed.length, "run")} timed out overnight. Retrying spends credits, so I need your OK first.`,
    ),
    ...toolCall(id("retry"), RETRY_TOOL, {
      runIds: failed.map((r) => r.id),
      credits: retryCost(failed),
    } satisfies RetryArgs),
    close,
  ];
}

/** Plays `scriptFor` one event at a time, so streaming is visible in the UI. */
export class ScriptedRunsAgent extends AbstractAgent {
  run(input: RunAgentInput): Observable<BaseEvent> {
    const events = scriptFor(input);
    return new Observable<BaseEvent>((subscriber) => {
      let index = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const step = () => {
        if (index >= events.length) return subscriber.complete();
        subscriber.next(events[index++]);
        timer = setTimeout(step, STEP_MS);
      };
      step();
      return () => clearTimeout(timer);
    });
  }
}

/** Module-level, not a field: the runtime clones agents and a clone skips initializers. */
const STEP_MS = 45;
