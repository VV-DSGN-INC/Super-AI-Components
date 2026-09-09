import { mkdirSync, writeFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { type HarnessResult, OUT_DIR, THEMES, keyFor, readBaseline } from "./baseline";
import { HARNESS_ITEMS } from "./items";

const ROW = process.env.HARNESS_ROW ?? "default";
const baseline = new Set(readBaseline());

// WCAG 2.x A/AA only. Narrower than the Storybook gate's axe defaults on
// purpose: best-practice rules about page structure would fire on the harness
// page's own chrome, not on the item (design §3.6).
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

for (const theme of THEMES) {
  for (const item of HARNESS_ITEMS) {
    test(`${ROW} · ${theme} · ${item.name}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });

      await page.goto(`/harness/${item.name}`);
      if (theme === "dark") await page.evaluate(() => document.documentElement.classList.add("dark"));
      const root = page.locator(`[data-harness-item="${item.name}"]`);
      await expect(root).toBeVisible();
      await page.waitForLoadState("networkidle");

      const dir = `${OUT_DIR}${ROW}/${theme}/`;
      mkdirSync(dir, { recursive: true });
      await page.screenshot({ path: `${dir}${item.name}.png`, fullPage: true });

      const axe = await new AxeBuilder({ page })
        .include(`[data-harness-item="${item.name}"]`)
        .withTags(TAGS)
        .analyze();
      const ids = [...new Set(axe.violations.map((v) => v.id))].sort();
      const record: HarnessResult = { row: ROW, theme, item: item.name, violations: ids, errors };
      writeFileSync(`${dir}${item.name}.json`, JSON.stringify(record));

      const fresh = ids.filter((id) => !baseline.has(keyFor(ROW, theme, item.name, id)));
      const detail = axe.violations
        .filter((v) => fresh.includes(v.id))
        .map((v) => `${v.id} (${v.impact}): ${v.nodes[0]?.html.slice(0, 140) ?? ""}`)
        .join("\n");
      expect(errors, "console errors").toEqual([]);
      expect(fresh, `new axe violations, not in harness/baseline.json:\n${detail}`).toEqual([]);
    });
  }
}
