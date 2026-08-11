import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectAccessibleName } from "./test-utils";

describe("expectAccessibleName", () => {
  it("passes when the computed name matches", () => {
    render(<button>Save</button>);
    expect(() => expectAccessibleName(screen.getByRole("button"), "Save")).not.toThrow();
  });

  it("catches sr-only text fusing with the visible text", () => {
    // The real frame-strip / transcript-editor bug: this computes as
    // "Inpoint at 3s", not "In point at 3s".
    render(
      <button>
        <span>In</span>
        <span className="sr-only"> point at 3s</span>
      </button>,
    );
    expect(() => expectAccessibleName(screen.getByRole("button"), "In point at 3s")).toThrow(/Inpoint at 3s/);
  });
});
