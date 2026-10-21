import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CaptureConsent } from "./capture-consent";

describe("CaptureConsent", () => {
  it("renders the pre-notice state", () => {
    expect.fail("implement the pre-notice state per docs/design-system/component-specs.md#n13-capture-consent");
  });

  it("renders the recording state", () => {
    expect.fail("implement the recording state per docs/design-system/component-specs.md#n13-capture-consent");
  });

  it("renders the others-notified state", () => {
    expect.fail("implement the others-notified state per docs/design-system/component-specs.md#n13-capture-consent");
  });

  it("renders the declined state", () => {
    expect.fail("implement the declined state per docs/design-system/component-specs.md#n13-capture-consent");
  });

  it("renders the ended state", () => {
    expect.fail("implement the ended state per docs/design-system/component-specs.md#n13-capture-consent");
  });

  it("passes className through", () => {
    render(<CaptureConsent className="test-class" />);
    expect(document.querySelector('[data-slot="capture-consent"]')!.className).toContain("test-class");
  });
});
