import { describe, expect, it } from "vitest";

import {
  creditsLeft,
  dailySpend,
  projectSpend,
  failedOvernight,
  failedThisWeek,
  overnightRuns,
  PLAN,
  retryCost,
  RUNS,
  runningNow,
  timedOutOvernight,
  TODAY,
  weekSpend,
} from "./fixtures";

describe("generated chat fixtures", () => {
  it("fixes today at Tuesday 20 October 2026, 09:00", () => {
    expect(TODAY.toISOString()).toBe(new Date(2026, 9, 20, 9, 0).toISOString());
  });

  it("derives last night's runs from the records", () => {
    expect(overnightRuns()).toHaveLength(26);
    expect(failedOvernight()).toHaveLength(3);
    expect(timedOutOvernight().map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(overnightRuns().filter((r) => r.status === "done")).toHaveLength(23);
  });

  it("derives the queue, the failures this week and the retry cost", () => {
    expect(runningNow()).toHaveLength(3);
    expect(failedThisWeek()).toHaveLength(5);
    expect(retryCost(timedOutOvernight())).toBe(80);
  });

  it("derives credits from the plan and the spend records", () => {
    expect(PLAN.credits).toBe(2000);
    expect(creditsLeft()).toBe(360);
    expect(weekSpend()).toEqual({ video: 420, image: 150, audio: 40, total: 610 });
  });

  it("gives every run a unique id", () => {
    expect(new Set(RUNS.map((r) => r.id)).size).toBe(RUNS.length);
  });

  it("derives spend by project and by day from the same lines the kind totals come from", () => {
    expect(projectSpend()).toEqual([
      { project: "Onboarding video", credits: 400 },
      { project: "Spring campaign", credits: 170 },
      { project: "Podcast intro", credits: 40 },
    ]);
    expect(dailySpend()).toEqual([
      { day: "Mon 19 Oct", credits: 378 },
      { day: "Tue 20 Oct", credits: 232 },
    ]);
    const total = weekSpend().total;
    expect(projectSpend().reduce((sum, p) => sum + p.credits, 0)).toBe(total);
    expect(dailySpend().reduce((sum, d) => sum + d.credits, 0)).toBe(total);
  });
});
