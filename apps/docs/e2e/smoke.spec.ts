import { expect, test } from "@playwright/test";

import { CATALOG_ITEMS } from "../lib/catalog";
import { COMPAT_NOTE } from "../lib/install";
import { MARKETING_ITEMS } from "../lib/marketing-catalog";
import { architecturePage } from "../content/system/architecture.page";
import { harnessPage } from "../content/system/harness.page";

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

test("the Installation block states the Base UI requirement", async ({ page }) => {
  await page.goto("/components/kbd");
  await expect(page.locator('[data-slot="install-compat"]')).toHaveText(COMPAT_NOTE);
});

test("a component with guidance renders its Do and Don't blocks", async ({ page }) => {
  // Skips until the first documented component ships (Task 15).
  const documented = CATALOG_ITEMS.find((i) => i.name === "workspace-switcher");
  test.skip(!documented, "no documented component shipped yet");
  await page.goto(`/components/${documented!.name}`);
  await expect(page.locator('[data-slot="docs-do"]')).toBeVisible();
  await expect(page.locator('[data-slot="docs-dont"]')).toBeVisible();
});

for (const route of [
  { path: "/harness", title: harnessPage.title },
  { path: "/architecture", title: architecturePage.title },
]) {
  test(`${route.path} renders at 375px without console errors or sideways scroll`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(route.path);
    // Targets the page's own title by data-slot, for the reasons the component
    // test above records: role and tag locators have both been wrong here.
    await expect(page.locator('[data-slot="system-page-title"]')).toHaveText(route.title);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test("home groups the catalog by family and filters it", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: /^A · Primitives/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /^Marketing · Buttons/ })).toBeVisible();
  // exact: true — family J's title ("Library, filtering & discovery") contains
  // "filter" as a substring, and getByLabel matches any labelled element, not
  // just form controls, so the loose match also resolves to that section.
  await page.getByLabel("Filter", { exact: true }).fill("thread-list");
  await expect(page.getByRole("link", { name: /Thread List/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /^A · Primitives/ })).toHaveCount(0);
  await page.getByLabel("Filter", { exact: true }).fill("zzzz-no-such-item");
  await expect(page.locator('[data-slot="catalog-empty"]')).toBeVisible();
});

test("the theme toggle switches the document to dark", async ({ page }) => {
  await page.goto("/components/kbd");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Switch to dark theme" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test.describe("below md", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the sidebar is reachable from the menu button and closes on navigation", async ({ page }) => {
    await page.goto("/components/kbd");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("dialog").getByRole("link", { name: "Thread List" }).click();
    await expect(page).toHaveURL(/\/components\/thread-list$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the home fits 375px without sideways scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Super-AI-Components" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
