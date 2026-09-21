import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(__dirname, "../../../..");
const read = (file: string) => readFileSync(join(REPO, file), "utf8");

describe("license", () => {
  it("ships an MIT LICENSE file at the repo root", () => {
    expect(existsSync(join(REPO, "LICENSE"))).toBe(true);
    expect(read("LICENSE")).toContain("MIT License");
    expect(read("LICENSE")).toMatch(/Copyright \(c\) 2026 /);
  });

  it("declares the same license in the root package.json", () => {
    const pkg = JSON.parse(read("package.json")) as { license?: string };
    expect(pkg.license).toBe("MIT");
  });

  it("names both vendored licenses and ships the Apache text", () => {
    const notices = read("THIRD_PARTY_NOTICES.md");
    expect(notices).toContain("shadcn/ui");
    expect(notices).toContain("AI Elements");
    expect(notices).toContain("Apache-2.0");
    expect(read("licenses/Apache-2.0.txt")).toContain("Apache License");
  });

  it("points the README at the license", () => {
    expect(read("README.md")).toMatch(/^## License/m);
    expect(read("README.md")).toContain("THIRD_PARTY_NOTICES.md");
  });
});
