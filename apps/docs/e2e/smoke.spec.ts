import { expect, test } from "@playwright/test";

import { CATALOG_ITEMS } from "../lib/catalog";
import { MARKETING_ITEMS } from "../lib/marketing-catalog";

test("home lists the catalog", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Super-AI-Components" })).toBeVisible();
});

for (const item of [...CATALOG_ITEMS, ...MARKETING_ITEMS]) {
  test(`/components/${item.name} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(`/components/${item.name}`);
    await expect(page.getByRole("heading", { level: 1, name: item.title })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("a component with guidance renders its Do and Don't blocks", async ({ page }) => {
  // Skips until the first documented component ships (Task 15).
  const documented = CATALOG_ITEMS.find((i) => i.name === "workspace-switcher");
  test.skip(!documented, "no documented component shipped yet");
  await page.goto(`/components/${documented!.name}`);
  await expect(page.locator('[data-slot="docs-do"]')).toBeVisible();
  await expect(page.locator('[data-slot="docs-dont"]')).toBeVisible();
});
