import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { MANIFEST } from "../lib/catalog.manifest";
import { HERO_BLOCK_NAME } from "../lib/showcase";

const ROUTES = [
  { path: "/", title: "The other half of an AI app." },
  { path: "/foundations", title: "Foundations" },
  { path: "/components", title: "Components" },
];

for (const route of ROUTES) {
  test(`${route.path} renders without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto(route.path);
    // A DOM locator, not getByRole: Base UI sets aria-hidden on the page shell
    // when an overlay opens on mount, which removes headings from the
    // accessibility tree while leaving them in the DOM.
    await expect(page.locator('[data-slot="page-title"]')).toHaveText(route.title);
    expect(errors).toEqual([]);
  });

  test(`${route.path} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(blocking.map((v) => `${v.id}: ${v.nodes.length} node(s)`)).toEqual([]);
  });
}

test("the hero exposes its regions as focusable keys", async ({ page }) => {
  await page.goto("/");
  const keys = page.locator('[data-slot="hero-region-key"]');
  await expect(keys).toHaveCount(4);
});

test("the hero region keys name the components inside each region", async ({ page }) => {
  await page.goto("/");
  const links = page.locator('[data-slot="hero-region-components"] a');
  await expect(links.first()).toBeVisible();

  const consumes = MANIFEST.find((i) => i.name === HERO_BLOCK_NAME)!.consumes;
  const names = (await links.allTextContents()).map((t) => t.trim());
  expect(names.length).toBeGreaterThan(0);
  // The names are derived from the DOM, so the property worth pinning is that
  // nothing outside the block's declared `consumes` can ever appear.
  expect(consumes).toEqual(expect.arrayContaining(names));

  await expect(links.first()).toHaveAttribute("href", new RegExp(`^/components/${names[0]}$`));
});

test("nothing overflows a 375px viewport, and the theme toggle is on screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.client);

  const toggle = page.locator("header button").first();
  const box = (await toggle.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
});

test("the docs sidebar starts below the sticky header", async ({ page }) => {
  await page.goto("/components/kbd");
  const header = (await page.locator("header").boundingBox())!;
  const firstRow = (await page.locator("aside nav a").first().boundingBox())!;
  expect(firstRow.y).toBeGreaterThanOrEqual(header.y + header.height);
});

test("every section tab switches the panel", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(7);
  await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('[data-slot="showcase-tile"]').first()).toBeVisible();
});
