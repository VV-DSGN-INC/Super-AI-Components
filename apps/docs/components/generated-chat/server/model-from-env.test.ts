import { describe, expect, it } from "vitest";

import { modelFromEnv } from "./model-from-env";

describe("modelFromEnv", () => {
  it("is off when the variable is unset, blank or off", () => {
    for (const value of [undefined, "", "  ", "off", "OFF"]) expect(modelFromEnv(value)).toBeNull();
  });

  it("returns the gateway model ID it was given, trimmed", () => {
    expect(modelFromEnv(" anthropic/claude-haiku-5.5 ")).toBe("anthropic/claude-haiku-5.5");
  });

  it("refuses a value that is not a provider/model ID", () => {
    expect(modelFromEnv("claude")).toBeNull();
  });
});
