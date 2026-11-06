/**
 * The demo's workspace: a small team's AI generation runs, credits and spend.
 *
 * Records only. Every count, cost and total the page shows is derived below
 * from these records against a fixed "today", so two cards can never disagree
 * about one fact. The workspace is a fixture: no company or person is named.
 */

export const TODAY = new Date(2026, 9, 20, 9, 0);

export type RunKind = "image" | "video" | "audio";
export type RunStatus = "done" | "failed" | "running";

export interface Run {
  id: string;
  /** Display time; `overnight` says which window it belongs to. */
  at: string;
  kind: RunKind;
  project: string;
  prompt: string;
  model: string;
  status: RunStatus;
  reason?: string;
  credits: number;
  /** Started between 18:00 Monday and 09:00 Tuesday. */
  overnight: boolean;
  /** 0 to 100, running runs only. */
  progress?: number;
}

export const PLAN = { credits: 2000, used: 1640, resetsOn: "Nov 1", resetsInDays: 12 } as const;

/**
 * Credits spent this week, one line per day, project and kind. Every spend
 * figure on the page (by kind, by project, by day) is summed from these.
 */
export const SPEND_LINES = [
  { day: "Mon 19 Oct", project: "Onboarding video", kind: "video", credits: 240 },
  { day: "Mon 19 Oct", project: "Onboarding video", kind: "image", credits: 20 },
  { day: "Mon 19 Oct", project: "Spring campaign", kind: "video", credits: 20 },
  { day: "Mon 19 Oct", project: "Spring campaign", kind: "image", credits: 76 },
  { day: "Mon 19 Oct", project: "Podcast intro", kind: "audio", credits: 22 },
  { day: "Tue 20 Oct", project: "Onboarding video", kind: "video", credits: 140 },
  { day: "Tue 20 Oct", project: "Spring campaign", kind: "video", credits: 20 },
  { day: "Tue 20 Oct", project: "Spring campaign", kind: "image", credits: 54 },
  { day: "Tue 20 Oct", project: "Podcast intro", kind: "audio", credits: 18 },
] as const satisfies readonly { day: string; project: string; kind: RunKind; credits: number }[];

const CREDITS: Record<RunKind, number> = { image: 4, video: 40, audio: 6 };
const MODEL: Record<RunKind, string> = { image: "Image XL", video: "Video HD", audio: "Voice Studio" };

const run = (
  id: string,
  at: string,
  kind: RunKind,
  project: string,
  prompt: string,
  rest: Partial<Run> = {},
): Run => ({
  id,
  at,
  kind,
  project,
  prompt,
  model: MODEL[kind],
  status: "done",
  credits: CREDITS[kind],
  overnight: true,
  ...rest,
});

const timedOut = { status: "failed", reason: "Timed out" } as const;

export const RUNS: Run[] = [
  run("r1", "Tue 02:14", "video", "Onboarding video", "Scene 3: dashboard tour, slow pan", timedOut),
  run("r2", "Tue 02:31", "video", "Onboarding video", "Scene 4: settings walkthrough", timedOut),
  run("r3", "Mon 23:05", "image", "Spring campaign", "Poster variant B, crowd at night", {
    status: "failed",
    reason: "Content filter",
  }),
  run("r4", "Mon 14:40", "image", "Spring campaign", "Hero banner, rooftop garden at golden hour", {
    ...timedOut,
    overnight: false,
  }),
  run("r5", "Mon 10:12", "audio", "Podcast intro", "Voice take 2, warm and slow", {
    status: "failed",
    reason: "Provider error",
    overnight: false,
  }),
  run("d01", "Mon 18:02", "image", "Spring campaign", "Poster variant A, rooftop garden"),
  run("d02", "Mon 18:05", "image", "Spring campaign", "Poster variant A, neon alley"),
  run("d03", "Mon 18:09", "image", "Spring campaign", "Poster variant A, glass sculpture"),
  run("d04", "Mon 18:30", "image", "Spring campaign", "Square crop, rooftop garden"),
  run("d05", "Mon 18:34", "image", "Spring campaign", "Square crop, neon alley"),
  run("d06", "Mon 19:10", "audio", "Podcast intro", "Voice take 1, warm and slow"),
  run("d07", "Mon 19:15", "audio", "Podcast intro", "Voice take 1, bright and quick"),
  run("d08", "Mon 19:40", "audio", "Podcast intro", "Sting, three notes"),
  run("d09", "Mon 20:02", "video", "Onboarding video", "Scene 1: sign-in, slow pan"),
  run("d10", "Mon 20:48", "video", "Onboarding video", "Scene 2: first project, slow pan"),
  run("d11", "Mon 21:15", "image", "Onboarding video", "Title card, studio light"),
  run("d12", "Mon 21:20", "image", "Onboarding video", "End card, studio light"),
  run("d13", "Mon 22:00", "image", "Spring campaign", "Poster variant B, rooftop garden"),
  run("d14", "Mon 22:04", "image", "Spring campaign", "Poster variant B, neon alley"),
  run("d15", "Mon 22:31", "image", "Spring campaign", "Banner, glass sculpture on marble"),
  run("d16", "Mon 23:40", "audio", "Podcast intro", "Music bed, first pass"),
  run("d17", "Tue 00:12", "image", "Spring campaign", "Story frame 1, rooftop garden"),
  run("d18", "Tue 00:15", "image", "Spring campaign", "Story frame 2, rooftop garden"),
  run("d19", "Tue 00:18", "image", "Spring campaign", "Story frame 3, rooftop garden"),
  run("d20", "Tue 01:05", "audio", "Podcast intro", "Outro, warm and slow"),
  run("d21", "Tue 03:20", "image", "Onboarding video", "Thumbnail, studio portrait"),
  run("d22", "Tue 04:02", "image", "Onboarding video", "Thumbnail, soft light"),
  run("d23", "Tue 06:45", "image", "Spring campaign", "Square crop, glass sculpture"),
  run("q1", "Tue 08:41", "audio", "Podcast intro", "Music bed, second pass", {
    status: "running",
    progress: 64,
    overnight: false,
  }),
  run("q2", "Tue 08:52", "image", "Spring campaign", "Poster variant C, rooftop garden", {
    status: "running",
    progress: 30,
    overnight: false,
  }),
  run("q3", "Tue 08:58", "video", "Onboarding video", "Scene 5: sharing a project", {
    status: "running",
    progress: 12,
    overnight: false,
  }),
];

export const overnightRuns = (runs: Run[] = RUNS) => runs.filter((r) => r.overnight);
export const failedOvernight = (runs: Run[] = RUNS) =>
  overnightRuns(runs).filter((r) => r.status === "failed");
export const timedOutOvernight = (runs: Run[] = RUNS) =>
  failedOvernight(runs).filter((r) => r.reason === "Timed out");
export const failedThisWeek = (runs: Run[] = RUNS) => runs.filter((r) => r.status === "failed");
export const runningNow = (runs: Run[] = RUNS) => runs.filter((r) => r.status === "running");
export const retryCost = (runs: Run[]) => runs.reduce((sum, r) => sum + r.credits, 0);
export const creditsLeft = () => PLAN.credits - PLAN.used;

export function weekSpend() {
  const sum = (kind: RunKind) =>
    SPEND_LINES.filter((l) => l.kind === kind).reduce((t, l) => t + l.credits, 0);
  const spend = { video: sum("video"), image: sum("image"), audio: sum("audio") };
  return { ...spend, total: spend.video + spend.image + spend.audio };
}

/** Sums the lines by a key, keeping first-seen order. */
function sumBy<K extends "project" | "day">(key: K) {
  const totals = new Map<string, number>();
  for (const line of SPEND_LINES) totals.set(line[key], (totals.get(line[key]) ?? 0) + line.credits);
  return [...totals];
}

export const projectSpend = () => sumBy("project").map(([project, credits]) => ({ project, credits }));
export const dailySpend = () => sumBy("day").map(([day, credits]) => ({ day, credits }));

/** "2,000": the en-US grouping every figure on the page uses. */
export const fmt = (n: number) => n.toLocaleString("en-US");
