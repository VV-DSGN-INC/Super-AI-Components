import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { COMPAT_NOTE } from "../../lib/install";

const REPO = resolve(__dirname, "../../../..");

describe("README install section", () => {
  const readme = readFileSync(join(REPO, "README.md"), "utf8");

  it("carries the compatibility note verbatim, so the README and the site cannot disagree", () => {
    expect(readme).toContain(COMPAT_NOTE);
  });

  it("no longer promises any shadcn app", () => {
    expect(readme).not.toContain("any shadcn app");
  });
});
