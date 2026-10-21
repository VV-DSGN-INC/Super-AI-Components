import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VoiceProfile } from "./voice-profile";

describe("VoiceProfile", () => {
  it("renders the none state", () => {
    expect.fail("implement the none state per docs/design-system/component-specs.md#e11-voice-profile");
  });

  it("renders the preset state", () => {
    expect.fail("implement the preset state per docs/design-system/component-specs.md#e11-voice-profile");
  });

  it("renders the custom state", () => {
    expect.fail("implement the custom state per docs/design-system/component-specs.md#e11-voice-profile");
  });

  it("renders the editing state", () => {
    expect.fail("implement the editing state per docs/design-system/component-specs.md#e11-voice-profile");
  });

  it("renders the scoped state", () => {
    expect.fail("implement the scoped state per docs/design-system/component-specs.md#e11-voice-profile");
  });

  it("renders the conflict state", () => {
    expect.fail("implement the conflict state per docs/design-system/component-specs.md#e11-voice-profile");
  });

  it("renders the reset state", () => {
    expect.fail("implement the reset state per docs/design-system/component-specs.md#e11-voice-profile");
  });

  it("passes className through", () => {
    render(<VoiceProfile className="test-class" />);
    expect(document.querySelector('[data-slot="voice-profile"]')!.className).toContain("test-class");
  });
});
