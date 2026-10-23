"use client";

import { Keyboard } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { DemoNotifications } from "@/components/demos/demo-notifications";
import { AccountMenu } from "@/registry/super-ai/account-menu";
import {
  ChatShell,
  type ChatShellContextChip,
  type ChatShellMessage,
  type ChatShellThreadGroup,
} from "@/registry/super-ai/chat-shell";
import type { FeedbackProps, FeedbackState, FeedbackValue } from "@/registry/super-ai/feedback";
import { PromoCard } from "@/registry/super-ai/promo-card";
import { ShortcutsSheet } from "@/registry/super-ai/shortcuts-sheet";
import { WorkspaceSwitcher } from "@/registry/super-ai/workspace-switcher";

/**
 * The docs demo for O2, wired. The shell's own docs say that rendering it with
 * `messages` that never change and a `feedback` state that never moves
 * "produces a screenshot, not a workspace", and for a while this demo was
 * exactly that: Send cleared the box and nothing else happened. Everything the
 * shell declares controlled is controlled here — thread selection, rename, pin
 * and delete; the composer value; a run with a Stop that leaves a partial turn;
 * N1 feedback on every finished reply; the mode tabs; the context chip's remove.
 *
 * The reply is canned and arrives word by word on a timer. That mocks the
 * transport, not the UI: the states the shell passes through — D1 `generating`
 * with its Stop control and `role="status"`, a turn still arriving, one that
 * was stopped, one that finished and can be rated — are the real ones, driven
 * the way a host would drive them.
 */

type TurnState = "streaming" | "stopped" | "done";

interface DemoTurn {
  id: string;
  role: "user" | "assistant";
  text: string;
  state: TurnState;
}

interface DemoFeedback {
  state: FeedbackState;
  value?: FeedbackValue;
}

interface DemoRun {
  threadId: string;
  turnId: string;
  timer: number;
}

const SEED_THREADS: ChatShellThreadGroup[] = [
  {
    id: "today",
    label: "Today",
    threads: [
      { id: "brand-audit", title: "Brand audit for Northwind" },
      { id: "deck-export", title: "Export the Q3 deck", running: true, runningLabel: "Rendering slides" },
    ],
  },
  {
    id: "earlier",
    label: "Last 7 days",
    threads: [
      { id: "onboarding", title: "Onboarding email rewrite", pinned: true },
      { id: "pricing", title: "Pricing page copy", unread: true },
    ],
  },
];

const SEED_TURNS: Record<string, DemoTurn[]> = {
  "brand-audit": [
    {
      id: "m1",
      role: "user",
      text: "Audit Northwind's brand voice against the three competitors in the deck.",
      state: "done",
    },
    {
      id: "m2",
      role: "assistant",
      text: "I read all four voice guides and pulled the overlap. Northwind is the only one that leads with reassurance rather than speed — that is the position worth defending. I have written the summary up as an artifact below.",
      state: "done",
    },
  ],
  "deck-export": [
    {
      id: "d1",
      role: "user",
      text: "Export the Q3 deck as 16:9 slides and keep the speaker notes.",
      state: "done",
    },
    {
      id: "d2",
      role: "assistant",
      text: "Rendering 24 slides now. The file lands in this thread when it is done, so you can keep working elsewhere.",
      state: "done",
    },
  ],
  onboarding: [
    {
      id: "o1",
      role: "user",
      text: "Rewrite the onboarding email so it reads in Northwind's voice.",
      state: "done",
    },
    {
      id: "o2",
      role: "assistant",
      text: "Rewritten below. The original opened on urgency; this one opens on what the reader already has in hand, which is the register the audit found.",
      state: "done",
    },
  ],
  // Unread and never opened: switching to it shows the stream's own empty state.
  pricing: [],
};

const ARTIFACTS = [
  {
    id: "brand-audit",
    label: "Brand audit for Northwind",
    items: [
      {
        id: "a1",
        excerpt:
          "Northwind is the only voice in the set that opens on reassurance. Competitors open on speed, which leaves the calm position uncontested.",
        type: "markdown",
        editedAgo: "Edited 4 minutes ago",
        visibility: "private" as const,
      },
      {
        id: "a2",
        excerpt: "const TONE = ['reassuring', 'plain', 'unhurried'] // extracted from 41 sampled pages",
        type: "code",
        editedAgo: "Edited 9 minutes ago",
        viewCount: 3,
        visibility: "shared" as const,
      },
    ],
  },
];

const SEED_CHIPS: Omit<ChatShellContextChip, "onRemove">[] = [
  { id: "c1", kind: "file", label: "brand-guide.pdf" },
];

const WORKSPACES = [
  { id: "northwind", name: "Northwind" },
  { id: "acme", name: "Acme Labs" },
];

// Only shortcuts this shell really binds: D1 sends on Enter and breaks a line
// on Shift+Enter, and the vendored sidebar toggles on Cmd/Ctrl+B.
const SHORTCUTS = [
  {
    title: "Conversation",
    shortcuts: [
      { label: "Send the message", keys: ["Enter"] },
      { label: "Start a new line", keys: ["⇧", "Enter"] },
    ],
  },
  { title: "Workspace", shortcuts: [{ label: "Show or hide the sidebar", keys: ["⌘", "B"] }] },
];

// One reply for every prompt. The demo has no model behind it, and a canned
// answer in the fixture's own register is more honest than pretending to one.
const REPLY =
  "Working from the audit above. Northwind opens on reassurance where every competitor opens on speed, so the calm position is uncontested and cheap to hold. The cost is pace: a reassuring voice cannot also promise fast, and that trade is the one to put in front of marketing before the deck goes out.";

// Ticks before the first word, so the empty turn and D1's busy state are
// visible for a moment the way a real first token is awaited.
const LEAD_TICKS = 6;
const TICK_MS = 60;

function DemoTurnBody({ turn }: { turn: DemoTurn }) {
  return (
    <>
      {turn.text}
      {turn.state === "streaming" ? (
        // The caret is decoration. The fact that a reply is still arriving is
        // carried by D1's `aria-busy` and its `role="status"`, not by this bar —
        // the same split `ChatShell.stories.tsx`'s Streaming story makes.
        <span
          aria-hidden
          className="bg-foreground/70 ms-1 inline-block h-4 w-1.5 animate-pulse align-middle motion-reduce:animate-none"
        />
      ) : null}
      {turn.state === "stopped" ? (
        <span data-slot="chat-shell-demo-stopped" className="text-foreground mt-2 block text-xs">
          Stopped before the reply finished.
        </span>
      ) : null}
    </>
  );
}

export default function ChatShellDemo() {
  const [currentWorkspaceId, setCurrentWorkspaceId] = React.useState("northwind");
  const [promoDismissed, setPromoDismissed] = React.useState(false);

  const [threadGroups, setThreadGroups] = React.useState(SEED_THREADS);
  const [activeThreadId, setActiveThreadId] = React.useState<string | undefined>("brand-audit");
  const [turns, setTurns] = React.useState(SEED_TURNS);
  const [feedback, setFeedback] = React.useState<Record<string, DemoFeedback>>({});
  const [chips, setChips] = React.useState(SEED_CHIPS);
  const [mode, setMode] = React.useState("ask");
  const [draft, setDraft] = React.useState("");
  const [generating, setGenerating] = React.useState(false);
  // `role="log"` announces additions, not replacements, so a thread switch
  // says nothing on its own. The shell's docs leave that to the host; this is
  // the host doing it.
  const [announcement, setAnnouncement] = React.useState("");

  const run = React.useRef<DemoRun | null>(null);

  const endRun = React.useCallback((state: TurnState) => {
    const current = run.current;
    if (!current) return;
    window.clearInterval(current.timer);
    run.current = null;
    setTurns((prev) => ({
      ...prev,
      [current.threadId]: (prev[current.threadId] ?? []).map((turn) =>
        turn.id === current.turnId ? { ...turn, state } : turn,
      ),
    }));
    setGenerating(false);
  }, []);

  React.useEffect(
    () => () => {
      if (run.current) window.clearInterval(run.current.timer);
    },
    [],
  );

  const allThreads = threadGroups.flatMap((group) => group.threads);
  const titleOf = (id: string | undefined) => allThreads.find((thread) => thread.id === id)?.title;

  const submit = (value: string) => {
    if (!activeThreadId || run.current) return;
    const threadId = activeThreadId;
    const stamp = Date.now();
    const replyId = `a-${stamp}`;
    const userTurn: DemoTurn = { id: `u-${stamp}`, role: "user", text: value, state: "done" };
    const replyTurn: DemoTurn = { id: replyId, role: "assistant", text: "", state: "streaming" };

    setTurns((prev) => ({ ...prev, [threadId]: [...(prev[threadId] ?? []), userTurn, replyTurn] }));
    setDraft("");
    setGenerating(true);
    setAnnouncement("");

    const words = REPLY.split(" ");
    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;
      const shown = Math.max(0, tick - LEAD_TICKS);
      const text = words.slice(0, shown).join(" ");
      setTurns((prev) => ({
        ...prev,
        [threadId]: (prev[threadId] ?? []).map((turn) => (turn.id === replyId ? { ...turn, text } : turn)),
      }));
      if (shown >= words.length) {
        endRun("done");
        setAnnouncement("Reply finished.");
      }
    }, TICK_MS);
    run.current = { threadId, turnId: replyId, timer };
  };

  const stop = () => {
    endRun("stopped");
    setAnnouncement("Reply stopped.");
  };

  const selectThread = (id: string) => {
    setActiveThreadId(id);
    setThreadGroups((prev) =>
      prev.map((group) => ({
        ...group,
        threads: group.threads.map((thread) => (thread.id === id ? { ...thread, unread: false } : thread)),
      })),
    );
    const title = titleOf(id);
    setAnnouncement(title ? `Opened ${title}` : "Opened conversation");
  };

  const renameThread = (id: string, title: string) => {
    setThreadGroups((prev) =>
      prev.map((group) => ({
        ...group,
        threads: group.threads.map((thread) => (thread.id === id ? { ...thread, title } : thread)),
      })),
    );
  };

  const deleteThread = (id: string) => {
    const remaining = allThreads.filter((thread) => thread.id !== id);
    setThreadGroups((prev) =>
      prev
        .map((group) => ({ ...group, threads: group.threads.filter((thread) => thread.id !== id) }))
        .filter((group) => group.threads.length > 0),
    );
    setTurns((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (run.current?.threadId === id) endRun("stopped");
    if (activeThreadId === id) {
      const next = remaining[0];
      setActiveThreadId(next?.id);
      setAnnouncement(next ? `Deleted. Opened ${next.title}` : "Deleted. No conversations left.");
    }
  };

  const togglePinThread = (id: string) => {
    setThreadGroups((prev) =>
      prev.map((group) => ({
        ...group,
        threads: group.threads.map((thread) =>
          thread.id === id ? { ...thread, pinned: !thread.pinned } : thread,
        ),
      })),
    );
  };

  // N1 is controlled: a thumb press moves nothing until the host says so. Up
  // submits in one click; down opens the reason popover first.
  const feedbackFor = (turnId: string): FeedbackProps => {
    const current = feedback[turnId] ?? { state: "idle" };
    const set = (next: DemoFeedback) => setFeedback((prev) => ({ ...prev, [turnId]: next }));
    return {
      state: current.state,
      value: current.value,
      onRate: (value) => {
        if (value === "down") set({ state: "rating", value });
      },
      onSubmit: ({ value }) => set({ state: "submitted", value }),
      onRatingCancel: () => set({ state: "idle" }),
      onUndo: () => set({ state: "idle" }),
    };
  };

  const messages: ChatShellMessage[] = (activeThreadId ? (turns[activeThreadId] ?? []) : []).map((turn) => ({
    id: turn.id,
    role: turn.role,
    content: <DemoTurnBody turn={turn} />,
    feedback: turn.role === "assistant" && turn.state !== "streaming" ? feedbackFor(turn.id) : undefined,
  }));

  return (
    <>
      <ChatShell
        className="h-[42rem]"
        title={titleOf(activeThreadId)}
        topbar={{
          privacy: { label: "Private" },
          savedLabel: "Saved just now",
          actions: (
            <ShortcutsSheet
              sections={SHORTCUTS}
              trigger={
                <Button type="button" variant="ghost" size="sm">
                  <Keyboard aria-hidden />
                  Shortcuts
                </Button>
              }
            />
          ),
        }}
        switcher={
          <WorkspaceSwitcher
            workspaces={WORKSPACES}
            currentId={currentWorkspaceId}
            onSelect={setCurrentWorkspaceId}
          />
        }
        threadGroups={threadGroups}
        activeThreadId={activeThreadId}
        onSelectThread={selectThread}
        onRenameThread={renameThread}
        onDeleteThread={deleteThread}
        onTogglePinThread={togglePinThread}
        messages={messages}
        artifacts={activeThreadId === "brand-audit" ? ARTIFACTS : []}
        composer={{
          value: draft,
          onValueChange: setDraft,
          onSubmit: submit,
          generating,
          onStop: stop,
        }}
        contextChips={chips.map((chip) => ({
          ...chip,
          onRemove: () => setChips((prev) => prev.filter((other) => other.id !== chip.id)),
        }))}
        modes={[
          { value: "ask", label: "Ask" },
          { value: "build", label: "Build" },
        ]}
        mode={mode}
        onModeChange={setMode}
        sidebarPromo={
          <PromoCard
            flavour="invite"
            title="Bring a teammate into this thread"
            description="Share Northwind's brand audit with the rest of the team."
            ctaLabel="Invite a teammate"
            onCtaClick={() => {}}
            dismissed={promoDismissed}
            onDismiss={() => setPromoDismissed(true)}
          />
        }
        sidebarFooter={
          <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
            <AccountMenu
              user={{ name: "Ada Lovelace", email: "ada@northwind.example" }}
              theme="system"
              onThemeChange={() => {}}
              background="default"
              onBackgroundChange={() => {}}
              onSignOut={() => {}}
            />
            <DemoNotifications />
          </div>
        }
      />
      <p data-slot="chat-shell-demo-announcer" role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </>
  );
}
