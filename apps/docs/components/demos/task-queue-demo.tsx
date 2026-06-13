import { TaskQueue, type QueuedTask } from "@/registry/super-ai/task-queue";

const tasks: QueuedTask[] = [
  { id: "t1", title: "Hotfix prod incident report", priority: "P0", status: "running" },
  { id: "t2", title: "Draft release notes", priority: "P1", status: "queued", rankDelta: 1, preempted: true },
  { id: "t3", title: "Summarize standup notes", priority: "P2", status: "queued", rankDelta: -1 },
  { id: "t4", title: "Refresh competitor digest", priority: "P3", status: "blocked" },
];

export default function TaskQueueDemo() {
  return <TaskQueue tasks={tasks} aria-label="Agent queue" className="w-full max-w-md" />;
}
