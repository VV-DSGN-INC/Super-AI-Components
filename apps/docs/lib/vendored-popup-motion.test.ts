import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Every vendored primitive that animates a popup with `data-open:animate-in`
 * restates the reduced-motion pair beside it. A bare `motion-reduce:animate-none`
 * is inert here (story-conventions.md, fact 3: Tailwind v4 sorts the plain
 * `motion-reduce:` block before the `data-*` variants and both compile to one
 * class of specificity), so the pair has to be the data-variant form.
 *
 * Checked in both copies: apps/docs/components/ui is what the docs site
 * renders, and apps/storybook/src/components/ui is what the axe gate renders.
 * Storybook-only primitives that no registry component composes (menubar,
 * navigation-menu and the like) are out of scope. Reading apps/storybook from
 * here is the cross-workspace shape scripts/turbo-inputs.test.ts records; CI
 * runs cold.
 *
 * This does not reach consumers: a registry item depends on a bare `dialog` /
 * `popover` / ..., which `shadcn add` resolves to the upstream primitive, so
 * the registry's own call sites keep their copies of the pair.
 */

const UI = path.resolve(__dirname, "../components/ui");
const STORYBOOK_UI = path.resolve(__dirname, "../../storybook/src/components/ui");
const PAIR = ["motion-reduce:data-open:animate-none", "motion-reduce:data-closed:animate-none"];

const files = readdirSync(UI)
  .filter((f) => f.endsWith(".tsx"))
  .flatMap((f) => [path.join(UI, f), path.join(STORYBOOK_UI, f)])
  .filter((p) => existsSync(p));

function animatedClassStrings(source: string): string[] {
  return [...source.matchAll(/"[^"\n]*data-open:animate-in[^"\n]*"/g)].map((m) => m[0]);
}

describe("vendored popups honour prefers-reduced-motion", () => {
  it("finds the popups it is meant to check", () => {
    const animated = files.filter((p) => animatedClassStrings(readFileSync(p, "utf8")).length > 0);
    const names = new Set(animated.map((p) => path.basename(p, ".tsx")));
    for (const name of ["dialog", "alert-dialog", "popover", "select", "dropdown-menu"]) {
      expect(names, name).toContain(name);
    }
  });

  it.each(files.map((p) => [path.relative(path.resolve(__dirname, "../.."), p), p]))(
    "%s restates the motion-reduce pair on every data-open:animate-in",
    (_label, file) => {
      for (const classes of animatedClassStrings(readFileSync(file, "utf8"))) {
        for (const token of PAIR) {
          expect(
            classes.split(/\s+/).map((c) => c.replace(/"/g, "")),
            classes.slice(0, 60),
          ).toContain(token);
        }
      }
    },
  );
});
