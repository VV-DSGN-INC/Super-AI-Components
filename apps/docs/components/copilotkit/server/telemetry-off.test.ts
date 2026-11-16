import { describe, expect, it } from "vitest";

describe("telemetry-off", () => {
  it("switches CopilotKit's runtime telemetry off before the runtime loads", async () => {
    delete process.env.COPILOTKIT_TELEMETRY_DISABLED;
    delete process.env.DO_NOT_TRACK;

    await import("./telemetry-off");

    // isTelemetryDisabled() in @copilotkit/runtime's telemetry client (not a
    // public export) returns true for either of these values; pin its inputs.
    expect(process.env.COPILOTKIT_TELEMETRY_DISABLED).toBe("true");
    expect(process.env.DO_NOT_TRACK).toBe("1");
  });
});
