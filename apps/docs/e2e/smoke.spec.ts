import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { expect, test } from "@playwright/test";

import { CATALOG_ITEMS } from "../lib/catalog";
import { MARKETING_ITEMS } from "../lib/marketing-catalog";

test("the front door is the patterns index, one section per stage", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('[data-slot="docs-shell-title"]')).toHaveText("Patterns");
  for (const stage of ["start", "ask", "tune", "watch", "review", "keep", "trust"]) {
    await expect(page.locator(`[data-section-id="${stage}"]`)).toBeVisible();
  }
});

// The generated map imports every composition, which this runner cannot
// evaluate; the directory is the same list. playwright.config.ts lives in
// apps/docs, so cwd is apps/docs.
const patternsDir = join(process.cwd(), "content/patterns");
const patternSlugs = readdirSync(patternsDir)
  .filter((f) => f.endsWith(".pattern.tsx"))
  .map((f) => f.replace(/\.pattern\.tsx$/, ""));
for (const slug of patternSlugs) {
  test(`/patterns/${slug} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    const title = /title:\s*"([^"]+)"/.exec(
      readFileSync(join(patternsDir, `${slug}.pattern.tsx`), "utf8"),
    )![1];
    await page.goto(`/patterns/${slug}`);
    // The shell's own title slot: a composition never renders a docs-shell, so
    // the locator is unique, and it does not depend on the accessibility tree
    // (the two ways the component loop's locator has been wrong before).
    await expect(page.locator('[data-slot="docs-shell-title"]')).toHaveText(title);
    expect(errors).toEqual([]);
  });
}

test("the component index lists the families", async ({ page }) => {
  await page.goto("/components");
  await expect(page.locator('[data-slot="docs-shell-title"]')).toHaveText("Components");
  await expect(page.locator('[data-section-id="B"]')).toBeVisible();
  await expect(page.locator('[data-section-id="marketing"]')).toBeVisible();
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
