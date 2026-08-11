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
    // Readiness only — the assertion this test is named for is the console-error
    // check below. This locator has now been wrong twice, in two different ways,
    // and both failures looked like broken components rather than a broken gate:
    //
    //   1. `getByRole("heading")` queried the accessibility tree, and a demo that
    //      opens a Base UI modal on mount makes the library set `aria-hidden` on
    //      the page shell — removing the h1 from that tree while leaving it in the
    //      DOM. That turned this into a test of "does not open a modal on mount".
    //   2. A bare `h1` tag locator then matched *two* elements once family O
    //      landed: a block is a page shell and renders its own heading inside the
    //      preview, below the docs chrome's own h1.
    //
    // So it targets the docs page's own title explicitly. Anything the preview
    // renders is now out of scope by construction, which is the property this
    // readiness check needed all along.
    await expect(page.locator('[data-slot="component-page-title"]')).toHaveText(item.title);
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
