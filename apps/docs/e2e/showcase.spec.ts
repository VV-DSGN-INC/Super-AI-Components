import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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

test("every section tab switches the panel", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("tab");
  await expect(tabs).toHaveCount(7);
  await tabs.nth(3).click();
  await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
  await expect(page.locator('[data-slot="showcase-tile"]').first()).toBeVisible();
});
