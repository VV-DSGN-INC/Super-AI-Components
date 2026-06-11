import { expect, test } from "@playwright/test";

import { CATALOG } from "../lib/catalog";

test("home lists the catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Super-AI-Components" })).toBeVisible();
});

for (const name of CATALOG) {
  test(`/components/${name} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(`/components/${name}`);
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
