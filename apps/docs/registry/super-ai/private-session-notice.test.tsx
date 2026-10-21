import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PrivateSessionNotice } from "./private-session-notice";

describe("PrivateSessionNotice", () => {
  it("renders the entering state", () => {
    expect.fail("implement the entering state per docs/design-system/component-specs.md#n15-private-session-notice");
  });

  it("renders the active state", () => {
    expect.fail("implement the active state per docs/design-system/component-specs.md#n15-private-session-notice");
  });

  it("renders the connectors-reduced state", () => {
    expect.fail("implement the connectors-reduced state per docs/design-system/component-specs.md#n15-private-session-notice");
  });

  it("renders the exiting state", () => {
    expect.fail("implement the exiting state per docs/design-system/component-specs.md#n15-private-session-notice");
  });

  it("renders the unavailable state", () => {
    expect.fail("implement the unavailable state per docs/design-system/component-specs.md#n15-private-session-notice");
  });

  it("passes className through", () => {
    render(<PrivateSessionNotice className="test-class" />);
    expect(document.querySelector('[data-slot="private-session-notice"]')!.className).toContain("test-class");
  });
});
