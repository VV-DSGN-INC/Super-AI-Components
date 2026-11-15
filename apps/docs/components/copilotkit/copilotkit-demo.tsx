"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import {
  useAgent,
  useCopilotKit,
  useHumanInTheLoop,
  useRenderTool,
  useRenderToolCall,
  type ReactHumanInTheLoop,
} from "@copilotkit/react-core/v2/headless";
import { TriangleAlert } from "lucide-react";
import * as React from "react";
import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fmt, type Run } from "@/components/generated-chat/fixtures";
import { AgentPresence } from "@/registry/super-ai/agent-presence";
import { ChatShell } from "@/registry/super-ai/chat-shell";
import { EntityRow } from "@/registry/super-ai/entity-row";
import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";
import { pendingToolCall, presenceFor, toTurns, useAnswerOnce } from "@/registry/super-ai/ag-ui-chat";
import { SuggestionChip, SuggestionChips } from "@/registry/super-ai/suggestion-chips";

import { LIST_TOOL, RETRY_TOOL, type AgentState, type RetryDecision } from "./scripted-agent";

/**
 * The /copilotkit demo: CopilotKit's headless hooks driving this registry's
 * components through the `ag-ui-chat` lib item. CopilotKit supplies the agent
 * connection, the run loop and the approval pause; `ag-ui-chat` turns AG-UI
 * messages into component props; every pixel is a registry component. None of
 * CopilotKit's own chat UI or stylesheet is imported.
 */

const THREAD_ID = "what-failed-overnight";
const READY_PROMPT = "What failed overnight?";

const listSchema = z.object({ window: z.string(), reason: z.string() });
const retrySchema = z.object({ runIds: z.array(z.string()), credits: z.number() });
type RetryParams = z.infer<typeof retrySchema>;

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

function parse<T>(json: string | undefined): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** The agent's own read tool: nothing to approve, so it only draws its result. */
function FailedRuns({ status, result }: { status: string; result?: string }) {
  if (status !== "complete") return <p role="status">Reading runs</p>;
  const runs = parse<{ runs: Run[] }>(result)?.runs ?? [];
  return (
    <ul
      data-slot="copilotkit-failed-runs"
      aria-label="Runs that timed out overnight"
      className="flex flex-col gap-1"
    >
      {runs.map((run) => (
        <li key={run.id}>
          <EntityRow
            icon={<TriangleAlert aria-hidden />}
            title={run.prompt}
            description={`${run.project} · ${run.at} · ${run.id}`}
            trailing={`${fmt(run.credits)} credits`}
          />
        </li>
      ))}
    </ul>
  );
}

type RetryGateProps = React.ComponentProps<ReactHumanInTheLoop<RetryParams>["render"]>;

/**
 * The paused call. AG-UI hands over the tool name, its arguments and a
 * `respond`; N8 `permission-prompt` takes an action, its arguments and four
 * verbs. The two line up one to one. The prompt answers every way it can be
 * closed (Escape is a Deny), and `useAnswerOnce` makes sure the agent hears
 * one answer.
 */
function RetryGate(props: RetryGateProps) {
  const answer = useAnswerOnce<RetryDecision>(props.respond);

  if (props.result !== undefined) {
    const decision = parse<RetryDecision>(props.result);
    if (!decision?.approved) return <p>You denied the retry.</p>;
    return decision.runIds ? (
      <p>You approved an edited retry: {decision.runIds.join(", ")}.</p>
    ) : (
      <p>You approved the retry.</p>
    );
  }
  // Arguments still streaming: a gate over half a call would be a gate over nothing.
  if (!props.respond) return null;

  const { args } = props;

  return (
    <>
      <p role="status">Waiting for your OK to retry {plural(args.runIds.length, "run")}.</p>
      <PermissionPrompt
        open
        action={`Retry ${plural(args.runIds.length, "timed-out run")}`}
        reason={`This spends ${fmt(args.credits)} credits from this month's plan.`}
        args={[{ key: "runs", value: args.runIds.join(", ") }]}
        onAllowOnce={() => answer({ approved: true })}
        // A standing grant needs somewhere to live and be revoked (N9). This
        // demo has no such store, so it approves this one call and the page
        // says so, rather than pretending to remember.
        onAlwaysAllow={() => answer({ approved: true })}
        onDeny={() => answer({ approved: false })}
        onEditFirst={(edited) =>
          answer({
            approved: true,
            runIds: (edited.runs ?? "")
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean),
          })
        }
      />
    </>
  );
}

function Conversation({ className, error }: { className?: string; error: string | null }) {
  const { agent, isReady } = useAgent();
  const { copilotkit } = useCopilotKit();
  const renderToolCall = useRenderToolCall();
  const [draft, setDraft] = React.useState("");

  useRenderTool({ name: LIST_TOOL, parameters: listSchema, render: FailedRuns }, []);
  useHumanInTheLoop<RetryParams>(
    {
      name: RETRY_TOOL,
      description: "Retry failed runs. Spends credits, so a person approves it first.",
      parameters: retrySchema,
      render: RetryGate,
    },
    [],
  );

  const busy = agent.isRunning;
  const waiting = pendingToolCall(agent.messages, [RETRY_TOOL]);
  const phase = (agent.state as Partial<AgentState> | undefined)?.phase;

  const submit = (value: string) => {
    const content = value.trim();
    if (!content || busy || waiting || !isReady) return;
    agent.addMessage({ id: crypto.randomUUID(), role: "user", content });
    setDraft("");
    void copilotkit.runAgent({ agent });
  };

  return (
    <ChatShell
      data-slot="copilotkit-demo"
      className={className}
      title="What failed overnight"
      threadGroups={[
        {
          id: "today",
          label: "Today",
          threads: [{ id: THREAD_ID, title: "What failed overnight", icon: <TriangleAlert /> }],
        },
      ]}
      activeThreadId={THREAD_ID}
      artifactsWhenEmpty="hide"
      topbar={{
        actions: (
          <AgentPresence
            state={presenceFor({
              running: busy,
              awaitingApproval: Boolean(waiting),
              acting: phase === "retrying",
            })}
            agentName="Runs agent"
            scope="Can read runs. Retries only with your OK."
            need={waiting ? "Approve or deny the retry" : undefined}
          />
        ),
      }}
      status={
        error ? (
          <Alert variant="destructive">
            <AlertTitle>The agent connection failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : undefined
      }
      messages={toTurns(agent.messages).map((turn) => ({
        id: turn.id,
        role: turn.role,
        content:
          turn.role === "user" ? (
            turn.pieces.flatMap((p) => (p.kind === "text" ? [p.text] : [])).join(" ")
          ) : (
            <div className="flex flex-col gap-3">
              {turn.pieces.map((piece) =>
                piece.kind === "text" ? (
                  <p key={piece.id}>{piece.text}</p>
                ) : (
                  <React.Fragment key={piece.id}>
                    {renderToolCall({ toolCall: piece.call, toolMessage: piece.result })}
                  </React.Fragment>
                ),
              )}
            </div>
          ),
      }))}
      empty={
        <div className="flex flex-col items-start gap-3">
          <p className="font-medium">What should we look at?</p>
          <SuggestionChips>
            <SuggestionChip suggestion={READY_PROMPT} disabled={busy || !isReady} onSelect={submit} />
          </SuggestionChips>
        </div>
      }
      composer={{
        label: "Ask about this workspace",
        placeholder: "Ask what failed overnight",
        value: draft,
        onValueChange: setDraft,
        generating: busy,
        onStop: () => copilotkit.stopAgent({ agent }),
        onSubmit: submit,
      }}
      disclaimer="A scripted agent over a fixture workspace, served through CopilotKit's runtime. No model is called."
    />
  );
}

export function CopilotKitDemo({ className }: { className?: string }) {
  const [error, setError] = React.useState<string | null>(null);
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit"
      showDevConsole={false}
      enableInspector={false}
      showIntelligenceIndicator={false}
      onError={({ error: cause }) => setError(cause.message)}
    >
      <Conversation className={className} error={error} />
    </CopilotKitProvider>
  );
}
