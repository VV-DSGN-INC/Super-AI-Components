"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { TaskTray, type TrayTask } from "@/registry/super-ai/task-tray";

/**
 * Live examples for task-tray.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so task-tray.docs.tsx has to stay
 * plain server-evaluable data and cannot carry "use client" itself. Every
 * example here needs handlers and its own task state, and the tray is a modal
 * Sheet — so each export is a zero-prop trigger button that opens the real
 * panel over the page, rather than an inline render of a surface that only
 * exists on top of everything else.
 */

const BASE_TASKS: TrayTask[] = [
  {
    id: "render",
    title: "Render 30-second cut",
    description: "Storyboard · started 4 minutes ago",
    status: "running",
  },
  {
    id: "approve",
    title: "Publish the campaign brief",
    description: "Brief editor · waiting for your approval",
    status: "needs-input",
  },
  {
    id: "transcribe",
    title: "Transcribe interview-03.wav",
    description: "Transcripts",
    status: "done",
  },
];

export function RowsNavigateBack() {
  const [opened, setOpened] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <TaskTray
        trigger={<Button variant="outline">Open tasks — every row navigates</Button>}
        tasks={BASE_TASKS}
        onOpenTask={setOpened}
      />
      <p className="text-foreground text-sm">
        Last opened: <span className="font-medium">{opened ?? "(nothing — pick a row)"}</span>
      </p>
    </div>
  );
}

export function CancelOnLiveWork() {
  const [tasks, setTasks] = React.useState(BASE_TASKS);

  return (
    <div className="flex flex-col gap-2">
      <TaskTray
        trigger={<Button variant="outline">Open tasks — live work is cancellable</Button>}
        tasks={tasks}
        onOpenTask={() => {}}
        onCancelTask={(id) => setTasks((current) => current.filter((task) => task.id !== id))}
      />
      <p className="text-muted-foreground text-sm">
        Cancel is offered on the running and needs-input rows only. The finished row has nothing left
        to stop, so it carries no controls at all.
      </p>
    </div>
  );
}

export function NotifyIsPerTask() {
  const [tasks, setTasks] = React.useState(BASE_TASKS);

  return (
    <div className="flex flex-col gap-2">
      <TaskTray
        trigger={<Button variant="outline">Open tasks — notify one run, not all five</Button>}
        tasks={tasks}
        onOpenTask={() => {}}
        onNotifyChange={(id, notify) =>
          setTasks((current) => current.map((task) => (task.id === id ? { ...task, notify } : task)))
        }
      />
      <p className="text-muted-foreground text-sm">
        Every task starts with notification off, so opting one in is a decision about that run rather
        than a preference that makes all of them shout.
      </p>
    </div>
  );
}

export function PreSortedOrderIsLost() {
  // The wrong way: the array hand-sorted newest-first before it is passed in.
  // The tray sorts by status regardless, so "Publish the campaign brief" moves
  // from last to first — any layout or test that assumed the given order is
  // already wrong by the time the panel paints.
  const preSorted: TrayTask[] = [
    {
      id: "transcribe",
      title: "Transcribe interview-03.wav",
      description: "Transcripts",
      status: "done",
    },
    {
      id: "render",
      title: "Render 30-second cut",
      description: "Storyboard · started 4 minutes ago",
      status: "running",
    },
    {
      id: "approve",
      title: "Publish the campaign brief",
      description: "Brief editor · waiting for your approval",
      status: "needs-input",
    },
  ];

  return (
    <TaskTray
      trigger={<Button variant="outline">Open tasks — passed done-first</Button>}
      tasks={preSorted}
      onOpenTask={() => {}}
    />
  );
}

export function NotificationFeed() {
  // The wrong way: nothing live, no handlers, nothing to act on. Every row is
  // finished work with no controls and no way back to the surface that owns it,
  // which is a log of things that already happened — not a task tray.
  const finished: TrayTask[] = [
    { id: "a", title: "Transcribe interview-03.wav", description: "Transcripts", status: "done" },
    { id: "b", title: "Export deck as PDF", description: "Slides", status: "done" },
    { id: "c", title: "Upscale hero-01.png", description: "Images", status: "failed" },
  ];

  return (
    <TaskTray
      trigger={<Button variant="outline">Open tasks — nothing to act on</Button>}
      tasks={finished}
    />
  );
}
