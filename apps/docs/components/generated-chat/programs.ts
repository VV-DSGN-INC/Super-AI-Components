/**
 * Recorded OpenUI Lang programs for the generated view, one line per node.
 * They are what a model constrained to the /openui catalog would write, built
 * from the same spend lines every other card reads, so no figure is typed
 * twice. No model is called.
 */

import { dailySpend, fmt, projectSpend, weekSpend } from "./fixtures";

const q = (text: string) => JSON.stringify(text);
const row = (cells: string[]) => `[${cells.map(q).join(", ")}]`;

function base(extra: string[]): string[] {
  const spend = weekSpend();
  const projects = projectSpend();
  return [
    `root = Page([intro, kpis, byProject${extra.length ? ", trend" : ""}])`,
    `intro = Markdown(${q(`${fmt(spend.total)} credits this week across ${projects.length} projects.`)})`,
    `kpis = Stats([k0, k1, k2, k3], "2")`,
    `k0 = Stat("Video", ${q(`${fmt(spend.video)} credits`)})`,
    `k1 = Stat("Image", ${q(`${fmt(spend.image)} credits`)})`,
    `k2 = Stat("Audio", ${q(`${fmt(spend.audio)} credits`)})`,
    `k3 = Stat("Total", ${q(`${fmt(spend.total)} credits`)})`,
    `byProject = Table(["Project", "Credits"], [${projects.map((p) => row([p.project, fmt(p.credits)])).join(", ")}], "Spend by project")`,
    ...extra,
  ];
}

export const PROGRAMS = {
  /** The first version: totals by kind and a table by project. */
  "spend-v1": base([]).join("\n"),
  /** Asks for a chart, which the catalog does not expose, so it does not render. */
  "spend-v2-chart": base([`trend = Chart("line", ${q("credits by day")})`]).join("\n"),
  /** The same trend as a table, which the catalog does expose. */
  "spend-v3-table": base([
    `trend = Table(["Day", "Credits"], [${dailySpend()
      .map((d) => row([d.day, fmt(d.credits)]))
      .join(", ")}], "Daily trend")`,
  ]).join("\n"),
} as const;

export type ProgramId = keyof typeof PROGRAMS;

export const isProgramId = (id: string | undefined): id is ProgramId => id !== undefined && id in PROGRAMS;

/** What Retry asks when a version does not render: the same change, made with what the catalog has. */
export const RETRY_PROMPTS: Partial<Record<ProgramId, string>> = {
  "spend-v2-chart": "Show the daily trend as a table",
};
