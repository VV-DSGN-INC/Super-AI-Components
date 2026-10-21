import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AgentPresence } from "./agent-presence";

describe("AgentPresence", () => {
  it("renders the idle state", () => {
    expect.fail("implement the idle state per docs/design-system/component-specs.md#n18-agent-presence");
  });

  it("renders the watching state", () => {
    expect.fail("implement the watching state per docs/design-system/component-specs.md#n18-agent-presence");
  });

  it("renders the acting state", () => {
    expect.fail("implement the acting state per docs/design-system/component-specs.md#n18-agent-presence");
  });

  it("renders the needs-you state", () => {
    expect.fail("implement the needs-you state per docs/design-system/component-specs.md#n18-agent-presence");
  });

  it("renders the paused state", () => {
    expect.fail("implement the paused state per docs/design-system/component-specs.md#n18-agent-presence");
  });

  it("renders the taken-over state", () => {
    expect.fail("implement the taken-over state per docs/design-system/component-specs.md#n18-agent-presence");
  });

  it("passes className through", () => {
    render(<AgentPresence className="test-class" />);
    expect(document.querySelector('[data-slot="agent-presence"]')!.className).toContain("test-class");
  });
});
