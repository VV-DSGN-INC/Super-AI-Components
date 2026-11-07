import { describe, expect, it } from "vitest";

import { systemChanges } from "./system-diff.mjs";

const dirs = { ui: "components/ui", kit: "components/super-ai" };
const fileDiff = (file: string, body: string, created = false) =>
  [
    `diff --git a/${file} b/${file}`,
    ...(created ? ["new file mode 100644", "index 0000000..1111111"] : ["index 1111111..2222222 100644"]),
    `--- ${created ? "/dev/null" : `a/${file}`}`,
    `+++ b/${file}`,
    "@@ -1,0 +1,1 @@",
    body,
  ].join("\n");

describe("systemChanges", () => {
  it("names a new primitive from a diff and from untracked files", () => {
    expect(systemChanges({ diff: fileDiff("components/ui/slider.tsx", "+x", true), untracked: [], dirs })).toEqual([
      { file: "components/ui/slider.tsx", reason: "new-primitive" },
    ]);
    expect(systemChanges({ diff: "", untracked: ["components/super-ai/my-chip.tsx"], dirs })).toEqual([
      { file: "components/super-ai/my-chip.tsx", reason: "new-primitive" },
    ]);
  });

  it("names an edit to an installed file", () => {
    const diff = [fileDiff("components/super-ai/cost-chip.tsx", "+x"), fileDiff("components/ui/button.tsx", "-y")].join("\n");
    expect(systemChanges({ diff, untracked: [], dirs })).toEqual([
      { file: "components/super-ai/cost-chip.tsx", reason: "installed-edit" },
      { file: "components/ui/button.tsx", reason: "installed-edit" },
    ]);
  });

  it("names an added or removed custom property in CSS", () => {
    expect(systemChanges({ diff: fileDiff("app/globals.css", "+  --brand: oklch(0.6 0.1 250);"), untracked: [], dirs })).toEqual([
      { file: "app/globals.css", reason: "token-change" },
    ]);
    expect(systemChanges({ diff: fileDiff("app/globals.css", "-  --radius: 0.5rem;"), untracked: [], dirs })).toEqual([
      { file: "app/globals.css", reason: "token-change" },
    ]);
  });

  it("leaves feature work alone", () => {
    const diff = [
      fileDiff("app/page.tsx", "+export default function Page() {}", true),
      fileDiff("components/settings-form.tsx", "+x"),
      fileDiff("app/globals.css", "+  color: var(--brand);"),
    ].join("\n");
    expect(systemChanges({ diff, untracked: ["app/new-page.tsx"], dirs })).toEqual([]);
  });

  it("reports each file and reason once, sorted by file", () => {
    const diff = [
      fileDiff("app/globals.css", "+  --a: 1px;\n+  --b: 2px;"),
      fileDiff("components/super-ai/a.tsx", "+x"),
    ].join("\n");
    const out = systemChanges({ diff, untracked: [], dirs });
    expect(out).toEqual([
      { file: "app/globals.css", reason: "token-change" },
      { file: "components/super-ai/a.tsx", reason: "installed-edit" },
    ]);
  });
});
