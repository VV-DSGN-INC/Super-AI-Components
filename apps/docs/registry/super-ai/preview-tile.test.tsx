import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PreviewTile } from "./preview-tile";

const frameClassName = () => document.querySelector('[data-slot="preview-tile-frame"]')!.className;

describe("PreviewTile", () => {
  it("keeps identical frame classes across every state", () => {
    const states = ["default", "loading", "locked", "failed"] as const;
    const frames = states.map((state) => {
      const { unmount } = render(
        <PreviewTile state={state}>
          <img alt="" src="data:," />
        </PreviewTile>,
      );
      const className = frameClassName();
      unmount();
      return className;
    });
    expect(new Set(frames).size).toBe(1);
  });
});
