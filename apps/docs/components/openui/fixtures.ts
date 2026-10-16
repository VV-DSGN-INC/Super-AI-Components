import { CLAIMS } from "@/components/demos/answer-block-demo";
import { GROUPS, TASKS } from "@/components/demos/data-views-demo";
import { SOURCES } from "@/components/demos/source-cards-demo";
import { SPANS } from "@/components/demos/trace-timeline-demo";

/** Canned OpenUI Lang answers for the demo. Every name, number and sentence
 *  of content is read from the registry's own demo data (data-views,
 *  trace-timeline, source-cards, answer-block), or computed from it; none is
 *  typed here. The framing sentences are the demo's own microcopy. */

export type BoardTask = { title: string; owner: string; status: string };
export type Brief = { id: string; prompt: string; response: (tasks: BoardTask[]) => string };

const q = (s: string) => JSON.stringify(s);
const list = (items: string[]) => `[${items.map(q).join(", ")}]`;
const ids = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}${i}`).join(", ");

/** The data-views demo's board, with each task's bucket read through its
 *  group label: the seed every conversation starts from. */
export const BOARD: BoardTask[] = TASKS.map((t) => ({
  title: t.title,
  owner: t.owner,
  status: GROUPS.find((g) => g.match(t))?.label ?? t.bucket,
}));

export const STATUSES = GROUPS.map((g) => g.label);
export const OWNERS = [...new Set(TASKS.map((t) => t.owner))];

export const PROMPTS = {
  status: "Where do the tasks stand?",
  add: "Add a task",
  run: "Show the last agent run",
  sources: "Which sources back the imaging answer?",
} as const;

export const ADD_FORM = "add-task";

function statusResponse(tasks: BoardTask[]): string {
  const count = (status: string) => tasks.filter((t) => t.status === status).length;
  const doing = STATUSES[1] ?? STATUSES[0];
  return [
    `root = Page([intro, counts, board, actions, next])`,
    `intro = Markdown(${q(`${tasks.length} tasks on the board, ${count(doing)} ${doing.toLowerCase()}.`)})`,
    `counts = Stats([${ids("s", STATUSES.length)}], "2")`,
    ...STATUSES.map((s, i) => `s${i} = Stat(${q(s)}, ${q(String(count(s)))})`),
    `board = Table(["Task", "Owner", "Status"], [${tasks.map((t) => list([t.title, t.owner, t.status])).join(", ")}])`,
    `actions = Actions([add, run])`,
    `add = Button(${q(PROMPTS.add)}, ${q(PROMPTS.add)}, "default")`,
    `run = Button(${q(PROMPTS.run)}, ${q(PROMPTS.run)}, "outline")`,
    `next = FollowUps(${list([PROMPTS.sources])})`,
  ].join("\n");
}

function addResponse(): string {
  return [
    `root = Page([intro, form])`,
    `intro = Markdown(${q("Name the task, then pick who owns it and where it starts.")})`,
    `form = Form(${q(ADD_FORM)}, ${q(PROMPTS.add)}, [title, owner, status], "Add task")`,
    `title = TextField("title", "Task")`,
    `owner = ChoiceField("owner", "Owner", ${list(OWNERS)})`,
    `status = ChoiceField("status", "Status", ${list(STATUSES)})`,
  ].join("\n");
}

function runResponse(): string {
  const wallMs = Math.max(...SPANS.map((s) => s.startMs + s.durationMs));
  const failed = SPANS.filter((s) => s.status === "error").length;
  const retried = SPANS.filter((s) => s.retryOf).length;
  const running = SPANS.filter((s) => s.status === "running").length;
  const opt = (v: string | undefined) => (v ? q(v) : "null");
  return [
    `root = Page([intro, stats, heading, trace, next])`,
    `intro = Markdown(${q(`${SPANS.length} spans over ${(wallMs / 1000).toFixed(1)} s. ${failed} failed, ${retried} retried, ${running} still running.`)})`,
    `stats = Stats([t0, t1, t2, t3], "2")`,
    `t0 = Stat("Spans", ${q(String(SPANS.length))})`,
    `t1 = Stat("Wall time", ${q(`${(wallMs / 1000).toFixed(1)} s`)})`,
    `t2 = Stat("Failed", ${q(String(failed))})`,
    `t3 = Stat("Running", ${q(String(running))})`,
    `heading = Heading("Spans", ${SPANS.length}, "sm")`,
    `trace = Trace([${ids("p", SPANS.length)}])`,
    ...SPANS.map(
      (s, i) =>
        `p${i} = Span(${q(s.id)}, ${q(s.name)}, ${q(s.status)}, ${s.startMs}, ${s.durationMs}, ${opt(s.kind)}, ${opt(s.error)}, ${opt(s.retryOf)})`,
    ),
    `next = FollowUps(${list([PROMPTS.status, PROMPTS.sources])})`,
  ].join("\n");
}

function sourcesResponse(): string {
  const claim = (c: (typeof CLAIMS)[number]) => {
    const refs = (c.citations ?? []).map((x) => `[${String(x.label)}]`).join("");
    return `- ${String(c.text)}${refs ? ` ${refs}` : ""}`;
  };
  return [
    `root = Page([answer, heading, sources, next])`,
    `answer = Markdown(${q(CLAIMS.map(claim).join("\n"))})`,
    `heading = Heading("Sources", ${SOURCES.length}, "sm")`,
    `sources = Sources([${ids("r", SOURCES.length)}])`,
    ...SOURCES.map(
      (s, i) =>
        `r${i} = Source(${q(String(s.title))}, ${q(String(s.snippet ?? ""))}, ${q(s.relevance ?? "low")}, ${s.used === true})`,
    ),
    `next = FollowUps(${list([PROMPTS.status, PROMPTS.run])})`,
  ].join("\n");
}

export const briefs: Brief[] = [
  { id: "status", prompt: PROMPTS.status, response: statusResponse },
  { id: "add", prompt: PROMPTS.add, response: addResponse },
  { id: "run", prompt: PROMPTS.run, response: runResponse },
  { id: "sources", prompt: PROMPTS.sources, response: sourcesResponse },
];

export function matchBrief(text: string): Brief | undefined {
  const needle = text.trim().toLowerCase();
  return briefs.find((b) => b.prompt.toLowerCase() === needle);
}

/** The answer to a submitted add-task form. The task is what the user typed
 *  and picked; the owner's other tasks come from the board. Nothing here is
 *  invented. */
export function addedResponse(task: BoardTask, board: BoardTask[]): string {
  const others = board.filter((t) => t.owner === task.owner);
  return [
    `root = Page([card, ${others.length ? "heading, others, " : ""}note, next])`,
    `card = Card(${q(task.title)}, "New task", [facts])`,
    `facts = Stats([f0, f1], "2")`,
    `f0 = Stat("Owner", ${q(task.owner)})`,
    `f1 = Stat("Status", ${q(task.status)})`,
    ...(others.length
      ? [
          `heading = Heading(${q(`Also with ${task.owner}`)}, ${others.length}, "sm")`,
          `others = List([${ids("o", others.length)}])`,
          ...others.map((t, i) => `o${i} = Row(${q(t.title)}, ${q(t.status)})`),
        ]
      : []),
    `note = Markdown(${q("Added to this page's board only. The demo has no backend, so a reload starts over.")})`,
    `next = FollowUps(${list([PROMPTS.status])})`,
  ].join("\n");
}

export function fallbackResponse(): string {
  return [
    `root = Page([empty, next])`,
    `empty = Empty("No recorded answer for that", ${q("This demo replays recorded answers and calls no model. Pick one of these.")}, "panel")`,
    `next = FollowUps(${list([PROMPTS.status, PROMPTS.run, PROMPTS.sources])})`,
  ].join("\n");
}
