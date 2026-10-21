"use client";

import { useChat } from "@ai-sdk/react";
import { Pin, RotateCw, TriangleAlert, Undo2, X } from "lucide-react";
import * as React from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatShell } from "@/registry/super-ai/chat-shell";
import { DataViews, type ColumnDef, type ViewGroup } from "@/registry/super-ai/data-views";
import {
  canSend,
  createScriptedTransport,
  currentVersion,
  initialQuestionState,
  initialViewState,
  isQuestionLocked,
  questionReducer,
  questionStatusFor,
  ReplyParts,
  viewReducer,
  type GeneratedChatMessage,
  type QuestionData,
  type TurnPart,
} from "@/registry/super-ai/generated-chat";
import { SuggestionChip, SuggestionChips } from "@/registry/super-ai/suggestion-chips";
import {
  ViewFrame,
  ViewFrameAction,
  ViewFrameActions,
  ViewFrameContent,
  ViewFrameDescription,
  ViewFrameFooter,
  ViewFrameHeader,
  ViewFrameTitle,
} from "@/registry/super-ai/view-frame";

import { failedThisWeek, type Run } from "./fixtures";
import { DemoActionsContext, RENDERERS, type DemoActions } from "./renderers";
import { FALLBACK, READY_PROMPTS, TURNS, VIEW, type DemoContext } from "./turns";

const COLUMNS: ColumnDef<Run>[] = [
  { id: "at", header: "When", cell: (r) => r.at, width: "w-24" },
  { id: "project", header: "Project", cell: (r) => r.project },
  { id: "prompt", header: "Prompt", cell: (r) => r.prompt },
  { id: "model", header: "Model", cell: (r) => r.model },
  { id: "reason", header: "Reason", cell: (r) => r.reason },
  { id: "credits", header: "Credits", cell: (r) => r.credits, align: "right", width: "w-20" },
];

const THREAD_ID = "what-failed-overnight";

const REASONS = ["Timed out", "Content filter", "Provider error"];
const GROUPS: ViewGroup<Run>[] = REASONS.map((reason) => ({
  id: reason,
  label: reason,
  tone: reason === "Timed out" ? "warning" : "neutral",
  match: (r) => r.reason === reason,
}));

const renderRunCard = (r: Run) => (
  <div className="flex flex-col gap-0.5 text-sm">
    <span>{r.prompt}</span>
    <span className="text-foreground text-xs">
      {r.project} · {r.at}
    </span>
  </div>
);

/** Turn parts become message parts once a question is approved. */
const toMessageParts = (parts: TurnPart[]): GeneratedChatMessage["parts"] =>
  parts.map((p) => (p.type === "text" ? { type: "text", text: p.text, state: "done" } : p));

interface GeneratedChatDemoProps {
  className?: string;
  /** Pause between a scripted reply's parts. */
  stepMs?: number;
}

/**
 * The generated chat demo: O2 `chat-shell` as the frame, each assistant reply
 * drawn by `ReplyParts` from registry components, scripted turns played through
 * `useChat` by the scripted transport. A view a reply builds opens in R3
 * `view-frame` beside the chat on a click, never by itself.
 */
export function GeneratedChatDemo({ className, stepMs = 350 }: GeneratedChatDemoProps) {
  const [views, dispatchView] = React.useReducer(viewReducer, initialViewState);
  const [questions, dispatchQuestion] = React.useReducer(questionReducer, initialQuestionState);
  const [draft, setDraft] = React.useState("");

  const transport = React.useMemo(
    () =>
      createScriptedTransport<DemoContext>({
        turns: TURNS,
        fallback: FALLBACK,
        stepMs,
        // A view exists once any reply has posted its card: a pure function
        // of the conversation, so the transport never reads page state.
        context: (messages) => ({
          viewBuilt: messages.some((m) =>
            m.parts.some((p) => p.type === "data-view" && p.data.viewId === VIEW.id),
          ),
        }),
      }),
    [stepMs],
  );

  const { messages, sendMessage, setMessages, status, stop } = useChat<GeneratedChatMessage>({
    transport,
    onData: (part) => {
      if (part.type === "data-effect") dispatchView({ type: "effect", effect: part.data, at: Date.now() });
    },
  });

  const busy = !canSend(status);
  const localId = React.useRef(0);
  const post = React.useCallback(
    (parts: GeneratedChatMessage["parts"]) => {
      const id = `local-${++localId.current}`;
      setMessages((prev) => [...prev, { id, role: "assistant", parts }]);
      return id;
    },
    [setMessages],
  );

  const actions: DemoActions = {
    busy,
    submit: (text) => {
      if (busy || text.trim() === "") return;
      setDraft("");
      void sendMessage({ text });
    },
    // Each handler posts only on a real transition, read from the store,
    // so a repeated click can never post a second card or a second receipt.
    ask: (question: QuestionData) => {
      if (busy || isQuestionLocked(questions.status[question.id])) return;
      const id = post([{ type: "data-question", data: question }]);
      dispatchQuestion({ type: "ask", id: question.id, cardKey: `${id}:0` });
    },
    answer: (question, approved) => {
      if (questions.status[question.id] !== "requested") return;
      dispatchQuestion({ type: "answer", id: question.id, approved });
      if (approved && question.after) post(toMessageParts(question.after));
    },
    // F7's own contract: Undo takes the decision back, so the same card asks
    // again rather than claiming the question was skipped.
    undo: (question) => {
      const cardKey = questions.cards[question.id];
      if (questions.status[question.id] !== "approved" || !cardKey) return;
      dispatchQuestion({ type: "undo", id: question.id });
      dispatchQuestion({ type: "ask", id: question.id, cardKey });
      post([
        { type: "text", text: "Undone. Both runs stay failed, and no credits were spent.", state: "done" },
      ]);
    },
    statusFor: (question, cardKey) => questionStatusFor(questions, question.id, cardKey),
    statusOf: (id) => questions.status[id],
    showView: (viewId) => {
      dispatchView({ type: "show", id: viewId, at: Date.now() });
    },
    activeViewId: views.activeId,
    viewLabel: (viewId) => {
      const view = views.views[viewId];
      return view ? `${view.scope} · ${currentVersion(view).label}` : "";
    },
  };

  const active = views.activeId ? views.views[views.activeId] : undefined;
  const version = active ? currentVersion(active) : undefined;

  const view =
    active && version ? (
      <ViewFrame title={active.title}>
        <ViewFrameHeader>
          <ViewFrameTitle>{active.title}</ViewFrameTitle>
          <ViewFrameDescription>{active.scope} · updated just now</ViewFrameDescription>
          <ViewFrameActions>
            <Tabs
              value={version.mode}
              onValueChange={(mode) => {
                if (mode === version.mode) return;
                dispatchView({
                  type: "edit",
                  id: active.id,
                  version: {
                    label: `v${active.versions.length + 1} · ${mode === "board" ? "board" : "table"}`,
                    mode: String(mode),
                  },
                  at: Date.now(),
                });
              }}
            >
              <TabsList variant="line" aria-label="View mode">
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="board">Board</TabsTrigger>
              </TabsList>
            </Tabs>
            <ViewFrameAction
              label="Undo"
              disabled={active.current === 0}
              onClick={() => dispatchView({ type: "undo", id: active.id })}
            >
              <Undo2 />
            </ViewFrameAction>
            <ViewFrameAction
              label="Rerun"
              onClick={() => dispatchView({ type: "rerun", id: active.id, at: Date.now() })}
            >
              <RotateCw />
            </ViewFrameAction>
            <ViewFrameAction label="Pin" onClick={() => dispatchView({ type: "pin", id: active.id })}>
              <Pin />
            </ViewFrameAction>
            <ViewFrameAction label="Close view" onClick={() => dispatchView({ type: "close" })}>
              <X />
            </ViewFrameAction>
          </ViewFrameActions>
        </ViewFrameHeader>
        <ViewFrameContent>
          <DataViews<Run>
            items={failedThisWeek()}
            viewMode={version.mode === "board" ? "kanban" : "table"}
            groups={GROUPS}
            columns={COLUMNS}
            renderCard={renderRunCard}
            renderRow={renderRunCard}
            // The frame's content part is the one scroll region; the
            // table's own overflow would nest an unfocusable second one.
            className={version.mode === "board" ? undefined : "h-auto overflow-visible"}
          />
        </ViewFrameContent>
        <ViewFrameFooter origin={`Made in chat: ${active.origin}`} version={version.label} />
      </ViewFrame>
    ) : null;

  return (
    <DemoActionsContext.Provider value={actions}>
      <ChatShell
        data-slot="generated-chat-demo"
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
        view={view}
        messages={messages.map((m, index) =>
          m.role === "user"
            ? {
                id: m.id,
                role: "user" as const,
                content: m.parts.flatMap((p) => (p.type === "text" ? [p.text] : [])).join(" "),
              }
            : {
                id: m.id,
                role: "assistant" as const,
                content: (
                  <ReplyParts
                    message={m}
                    renderers={RENDERERS}
                    streaming={busy && index === messages.length - 1}
                  />
                ),
              },
        )}
        empty={
          <div className="flex flex-col items-start gap-3">
            <p className="font-medium">What should we look at?</p>
            <SuggestionChips>
              {READY_PROMPTS.map((prompt) => (
                <SuggestionChip key={prompt} suggestion={prompt} disabled={busy} onSelect={actions.submit} />
              ))}
            </SuggestionChips>
          </div>
        }
        composer={{
          label: "Ask about this workspace",
          placeholder: "Ask about runs, credits or the queue",
          value: draft,
          onValueChange: setDraft,
          generating: busy,
          onStop: stop,
          onSubmit: (value) => actions.submit(value),
        }}
        disclaimer="Scripted replies over a fixture workspace. No model is called."
      />
    </DemoActionsContext.Provider>
  );
}
