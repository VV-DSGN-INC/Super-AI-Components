import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnvStatus } from "./env-status";

describe("EnvStatus", () => {
  it("renders the ok state", () => {
    expect.fail("implement the ok state per docs/design-system/component-specs.md#n7-env-status");
  });

  it("renders the degraded state", () => {
    expect.fail("implement the degraded state per docs/design-system/component-specs.md#n7-env-status");
  });

  it("renders the key-invalid state", () => {
    expect.fail("implement the key-invalid state per docs/design-system/component-specs.md#n7-env-status");
  });

  it("renders the not-running state", () => {
    expect.fail("implement the not-running state per docs/design-system/component-specs.md#n7-env-status");
  });

  it("passes className through", () => {
    render(<EnvStatus className="test-class" />);
    expect(document.querySelector('[data-slot="env-status"]')!.className).toContain("test-class");
  });
});
