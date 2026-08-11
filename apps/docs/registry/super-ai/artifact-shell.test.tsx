import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtifactShell } from "./artifact-shell";

describe("ArtifactShell", () => {

  it("passes className through", () => {
    render(<ArtifactShell className="test-class" />);
    expect(document.querySelector('[data-slot="artifact-shell"]')!.className).toContain("test-class");
  });
});
