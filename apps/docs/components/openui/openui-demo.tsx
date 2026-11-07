"use client";

import "./no-devtools";

import { Renderer, type ActionEvent } from "@openuidev/react-lang";
import { useCallback, useEffect, useRef, useState } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChatShell, type ChatShellMessage } from "@/registry/super-ai/chat-shell";

import {
  ADD_FORM,
  addedResponse,
  BOARD,
  fallbackResponse,
  matchBrief,
  PROMPTS,
  type BoardTask,
} from "./fixtures";
import { exposedSurfaces, openuiLibrary, systemPrompt } from "./library";

/** The OpenUI demo: the chat-shell block as the fixed frame, every assistant
 *  turn a `<Renderer>` over a recorded OpenUI Lang program revealed one line
 *  per tick. No model is called and no key is needed, so what renders is
 *  exactly what a model constrained to this library could emit. */

type Turn =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; lines: string[]; count: number };

const isStreaming = (t: Turn) => t.role === "assistant" && t.count < t.lines.length;
const finished = (t: Turn): Turn => (t.role === "assistant" ? { ...t, count: t.lines.length } : t);

const THREAD_ID = "openui";

/** The reveal is state, not a ref'd interval: each in-flight turn schedules
 *  its next line from an effect, so StrictMode's dev remount (which runs the
 *  cleanup and keeps the state) resumes the stream instead of freezing it. */
function useRecordedChat(streamMs: number) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [board, setBoard] = useState<BoardTask[]>(BOARD);
  const nextId = useRef(1);
  const live = turns.find(isStreaming);

  useEffect(() => {
    if (!live) return;
    const timer = setTimeout(() => {
      setTurns((all) =>
        all.map((t) => (t.id === live.id && t.role === "assistant" ? { ...t, count: t.count + 1 } : t)),
      );
    }, streamMs);
    return () => clearTimeout(timer);
  }, [live, streamMs]);

  /** Completes every in-flight turn: a new question mid-stream never leaves
   *  the previous answer half drawn. */
  const flush = useCallback(() => {
    setTurns((all) => all.map((t) => (isStreaming(t) ? finished(t) : t)));
  }, []);

  const stream = useCallback((program: string) => {
    const id = nextId.current++;
    setTurns((all) => [
      ...all.map((t) => (isStreaming(t) ? finished(t) : t)),
      { id, role: "assistant", lines: program.split("\n"), count: 0 },
    ]);
  }, []);

  const say = useCallback((text: string) => {
    const id = nextId.current++;
    setTurns((all) => [...all.map((t) => (isStreaming(t) ? finished(t) : t)), { id, role: "user", text }]);
  }, []);

  const ask = useCallback(
    (text: string, tasks: BoardTask[]) => {
      const clean = text.trim();
      if (!clean) return;
      say(clean);
      stream(matchBrief(clean)?.response(tasks) ?? fallbackResponse());
    },
    [say, stream],
  );

  return { turns, board, setBoard, ask, say, stream, flush, streaming: live !== undefined };
}

/** A field value out of OpenUI's form state: `{ [form]: { [field]: { value } } }`. */
function fieldValue(state: Record<string, unknown> | undefined, form: string, field: string): string {
  const entry = (state?.[form] as Record<string, { value?: unknown }> | undefined)?.[field];
  return typeof entry?.value === "string" ? entry.value.trim() : "";
}

export function OpenUIConversation({ streamMs = 120, className }: { streamMs?: number; className?: string }) {
  const { turns, board, setBoard, ask, say, stream, flush, streaming } = useRecordedChat(streamMs);
  const [draft, setDraft] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    ask(PROMPTS.status, BOARD);
  }, [ask]);

  const onAction = (event: ActionEvent) => {
    if (event.formName !== ADD_FORM) {
      ask(event.humanFriendlyMessage, board);
      return;
    }
    say(event.humanFriendlyMessage);
    const task = {
      title: fieldValue(event.formState, ADD_FORM, "title"),
      owner: fieldValue(event.formState, ADD_FORM, "owner"),
      status: fieldValue(event.formState, ADD_FORM, "status"),
    };
    if (!task.title || !task.owner || !task.status) {
      // Re-ask rather than fill a gap with a value the user never chose.
      stream(matchBrief(PROMPTS.add)!.response(board));
      return;
    }
    setBoard((b) => [...b, task]);
    stream(addedResponse(task, board));
  };

  const messages: ChatShellMessage[] = turns.map((t) =>
    t.role === "user"
      ? { id: String(t.id), role: "user", content: t.text }
      : {
          id: String(t.id),
          role: "assistant",
          content: (
            <Renderer
              response={t.lines.slice(0, t.count).join("\n")}
              library={openuiLibrary}
              isStreaming={isStreaming(t)}
              onAction={onAction}
            />
          ),
        },
  );

  return (
    <ChatShell
      className={className}
      title="OpenUI demo"
      threadGroups={[{ id: "today", label: "Today", threads: [{ id: THREAD_ID, title: "OpenUI demo" }] }]}
      activeThreadId={THREAD_ID}
      messages={messages}
      composer={{
        value: draft,
        onValueChange: setDraft,
        placeholder: "Ask about the board, the last agent run or the sources",
        generating: streaming,
        onStop: flush,
        onSubmit: (value) => {
          setDraft("");
          ask(value, board);
        },
      }}
      disclaimer="Recorded answers, replayed offline. No model is called."
    />
  );
}

export function SystemPromptView() {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">
        {systemPrompt.length.toLocaleString("en-US")} characters, about{" "}
        {Math.round(systemPrompt.length / 4).toLocaleString("en-US")} tokens, generated by{" "}
        <code>openuiLibrary.prompt()</code>. Never edited by hand.
      </p>
      <pre
        tabIndex={0}
        role="region"
        aria-label="Generated system prompt"
        className="bg-muted max-h-96 overflow-auto rounded-lg p-4 text-xs whitespace-pre-wrap wrap-anywhere"
      >
        <code>{systemPrompt}</code>
      </pre>
    </div>
  );
}

export function ExposedSurfacesTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Surface</TableHead>
          <TableHead>Registry item</TableHead>
          <TableHead>Enums</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exposedSurfaces.map((s) => (
          <TableRow key={s.name}>
            <TableCell className="font-medium">{s.name}</TableCell>
            <TableCell className="whitespace-normal">
              {s.slug ? (
                <a href={`/components/${s.slug}`} className="underline underline-offset-4">
                  {s.slug}
                </a>
              ) : (
                "vendored ui"
              )}
            </TableCell>
            <TableCell className="whitespace-normal wrap-anywhere">
              {Object.entries(s.enums)
                .map(
                  ([prop, values]) =>
                    `${prop}${s.metaAxes.includes(prop) ? " (meta)" : ""}: ${values.join(", ")}`,
                )
                .join("; ") || "none"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
