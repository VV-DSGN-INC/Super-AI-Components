import { describe, expect, it } from "vitest";
import { MANIFEST } from "../../lib/catalog.manifest";
import { deriveExtras } from "./registry-extras";

const REGISTRY_URL = "https://super-ai-components.vercel.app";
const self = (name: string) => `${REGISTRY_URL}/r/${name}.json`;

// Verbatim copy of the hand-written record this replaces.
const LEGACY = {
  "cost-chip": { dependencies: ["lucide-react"] },
  "filter-bar": { dependencies: ["lucide-react"] },
  "field-row": { registryDependencies: [self("reset-affordance")] },
  "shortcuts-sheet": { registryDependencies: ["dialog", self("kbd")] },
  "thread-list": {
    registryDependencies: ["button", "input", "dropdown-menu", "alert-dialog", self("date-section")],
    dependencies: ["lucide-react"],
  },
};

describe("deriveExtras", () => {
  const extras = deriveExtras(MANIFEST, self);

  it("reproduces the legacy record exactly", () => {
    expect(extras).toEqual(LEGACY);
  });

  it("omits items with no dependencies at all", () => {
    expect(extras.kbd).toBeUndefined();
  });

  it("orders shadcn bases before registry-internal deps", () => {
    expect(extras["shortcuts-sheet"].registryDependencies![0]).toBe("dialog");
  });
});
