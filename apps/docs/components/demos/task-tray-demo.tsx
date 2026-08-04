"use client";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { TaskTray, type TrayTask } from "@/registry/super-ai/task-tray";

const INITIAL: TrayTask[] = [
  { id: "a", title: "Reindex policy library", description: "Knowledge base", status: "done" },
  { id: "b", title: "Draft quarterly summary", description: "Reports", status: "running" },
  {
    id: "c",
    title: "Send renewal notice",
    description: "Waiting for approval to send",
    status: "needs-input",
  },
  { id: "d", title: "Export audit log", description: "Compliance", status: "failed" },
];

export default function TaskTrayDemo() {
  const [open, setOpen] = React.useState(false);
  const [tasks, setTasks] = React.useState(INITIAL);

  return (
    <TaskTray
      open={open}
      onOpenChange={setOpen}
      trigger={<Button variant="outline">Open tasks</Button>}
      tasks={tasks}
      onCancelTask={(id) => setTasks((t) => t.filter((x) => x.id !== id))}
      onNotifyChange={(id, notify) => setTasks((t) => t.map((x) => (x.id === id ? { ...x, notify } : x)))}
      onOpenTask={() => {}}
    />
  );
}
