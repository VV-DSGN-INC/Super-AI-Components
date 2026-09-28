import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { expectAccessibleName, expectShellLoadedContract, expectShellLoadingContract } from "./test-utils";

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

describe("expectShellLoadingContract", () => {
  const REGIONS = ["topbar", "canvas"];

  it("passes a busy root whose regions are hidden skeletons and which mounts nothing interactive", () => {
    const { container } = render(
      <div data-slot="demo-shell" aria-busy="true">
        <p data-slot="shell-loading-label" className="sr-only">
          Loading
        </p>
        <div data-region="topbar" data-loading-region="topbar" aria-hidden="true" />
        <div data-region="canvas" data-loading-region="canvas" aria-hidden="true" />
        <div data-slot="demo-shell-status">
          <button type="button">Retry</button>
        </div>
      </div>,
    );
    expect(() =>
      expectShellLoadingContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).not.toThrow();
  });

  it("fails a root with no ShellLoadingLabel, and one with two", () => {
    const { container: missing } = render(
      <div data-slot="demo-shell" aria-busy="true">
        <div data-region="topbar" data-loading-region="topbar" aria-hidden="true" />
        <div data-region="canvas" data-loading-region="canvas" aria-hidden="true" />
      </div>,
    );
    expect(() =>
      expectShellLoadingContract(missing.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).toThrow(/0 ShellLoadingLabel\(s\), expected one/);

    const { container: doubled } = render(
      <div data-slot="demo-shell" aria-busy="true">
        <p data-slot="shell-loading-label" className="sr-only">
          Loading
        </p>
        <p data-slot="shell-loading-label" className="sr-only">
          Loading
        </p>
        <div data-region="topbar" data-loading-region="topbar" aria-hidden="true" />
        <div data-region="canvas" data-loading-region="canvas" aria-hidden="true" />
      </div>,
    );
    expect(() =>
      expectShellLoadingContract(doubled.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).toThrow(/2 ShellLoadingLabel\(s\), expected one/);
  });

  it("fails a root that is not busy, a skeleton that is announced, and a mounted control", () => {
    const { container } = render(
      <div data-slot="demo-shell">
        <div data-region="topbar" data-loading-region="topbar" />
        <div data-region="canvas" data-loading-region="canvas" aria-hidden="true">
          <a href="#next">Next</a>
        </div>
      </div>,
    );
    expect(() =>
      expectShellLoadingContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).toThrow(/aria-busy[\s\S]*"topbar" skeleton is not hidden[\s\S]*1 interactive element/);
  });

  it("fails a region with no skeleton", () => {
    const { container } = render(
      <div data-slot="demo-shell" aria-busy="true">
        <div data-region="topbar" data-loading-region="topbar" aria-hidden="true" />
      </div>,
    );
    expect(() =>
      expectShellLoadingContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).toThrow(/region "canvas" is marked 0 times/);
  });
});

describe("expectShellLoadedContract", () => {
  const REGIONS = ["topbar", "canvas"];

  it("passes a loaded root with one measured box per region", () => {
    const { container } = render(
      <div data-slot="demo-shell">
        <header data-region="topbar" data-loading-region="topbar" />
        <div data-region="canvas" data-loading-region="canvas" />
      </div>,
    );
    expect(() =>
      expectShellLoadedContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).not.toThrow();
  });

  it("fails a loaded root that is still busy or has lost a region's marker", () => {
    const { container } = render(
      <div data-slot="demo-shell" aria-busy="true">
        <header data-region="topbar" data-loading-region="topbar" />
        <div data-region="canvas" />
      </div>,
    );
    expect(() =>
      expectShellLoadedContract(container.firstElementChild!, { name: "demo-shell", regions: REGIONS }),
    ).toThrow(/aria-busy while loaded[\s\S]*"canvas" has 0/);
  });
});
