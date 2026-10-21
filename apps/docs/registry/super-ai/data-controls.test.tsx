import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataControls } from "./data-controls";

describe("DataControls", () => {
  it("renders the training-on state", () => {
    expect.fail("implement the training-on state per docs/design-system/component-specs.md#n14-data-controls");
  });

  it("renders the training-off state", () => {
    expect.fail("implement the training-off state per docs/design-system/component-specs.md#n14-data-controls");
  });

  it("renders the retention state", () => {
    expect.fail("implement the retention state per docs/design-system/component-specs.md#n14-data-controls");
  });

  it("renders the plan-locked state", () => {
    expect.fail("implement the plan-locked state per docs/design-system/component-specs.md#n14-data-controls");
  });

  it("renders the none-collected state", () => {
    expect.fail("implement the none-collected state per docs/design-system/component-specs.md#n14-data-controls");
  });

  it("renders the admin-managed state", () => {
    expect.fail("implement the admin-managed state per docs/design-system/component-specs.md#n14-data-controls");
  });

  it("passes className through", () => {
    render(<DataControls className="test-class" />);
    expect(document.querySelector('[data-slot="data-controls"]')!.className).toContain("test-class");
  });
});
