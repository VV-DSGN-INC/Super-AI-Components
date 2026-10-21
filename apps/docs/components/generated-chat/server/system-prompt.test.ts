import { describe, expect, it } from "vitest";

import { creditsLeft, failedOvernight, fmt, PLAN, projectSpend, weekSpend } from "../fixtures";
import { CHIPS } from "../views";
import { systemPrompt } from "./system-prompt";

describe("systemPrompt", () => {
  const prompt = systemPrompt();

  it("states the workspace's figures as the fixtures derive them", () => {
    expect(prompt).toContain(`${fmt(creditsLeft())} of ${fmt(PLAN.credits)} credits left`);
    expect(prompt).toContain(`${fmt(weekSpend().total)} credits spent this week`);
    for (const { project, credits } of projectSpend())
      expect(prompt).toContain(`${project}: ${fmt(credits)}`);
    for (const run of failedOvernight()) {
      expect(prompt).toContain(run.prompt);
      expect(prompt).toContain(run.reason!);
    }
  });

  it("names the three tools and the chips the model may offer", () => {
    for (const name of ["show_card", "build_view", "suggest_followups"]) expect(prompt).toContain(name);
    for (const chip of CHIPS) expect(prompt).toContain(chip);
  });

  it("forbids claiming an action, since the tools only show things", () => {
    expect(prompt).toMatch(/never say you retried, queued, deleted or changed anything/i);
  });
});
