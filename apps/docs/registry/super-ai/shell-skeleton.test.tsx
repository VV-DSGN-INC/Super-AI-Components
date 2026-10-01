import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  ShellLoadingLabel,
  ShellSkeletonBlock,
  ShellSkeletonLines,
  ShellSkeletonRegion,
  ShellSkeletonRows,
  ShellSkeletonSidebar,
  ShellSkeletonTiles,
} from "./shell-skeleton";

describe("ShellSkeletonRegion", () => {
  it("marks the region for the contract gate and the loading twin, hidden from assistive tech", () => {
    const { container } = render(<ShellSkeletonRegion region="topbar" className="h-12" />);
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute("data-slot", "shell-skeleton-region");
    expect(region).toHaveAttribute("data-region", "topbar");
    expect(region).toHaveAttribute("data-loading-region", "topbar");
    expect(region).toHaveAttribute("aria-hidden", "true");
    expect(region).toHaveClass("h-12");
  });

  it("does not let a caller unhide it or rename its region", () => {
    const { container } = render(
      <ShellSkeletonRegion
        region="topbar"
        aria-hidden={false}
        data-region="other"
        data-loading-region="other"
      />,
    );
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute("aria-hidden", "true");
    expect(region).toHaveAttribute("data-region", "topbar");
    expect(region).toHaveAttribute("data-loading-region", "topbar");
  });
});

describe("ShellSkeletonBlock", () => {
  // jsdom evaluates no media queries, so the reduced-motion branch is only
  // observable as the class that creates it. That is why this one assertion
  // reads a class rather than a behaviour.
  it("is hidden from assistive tech and stills its pulse under reduced motion", () => {
    const { container } = render(<ShellSkeletonBlock className="h-4 w-24" />);
    const block = container.firstElementChild!;
    expect(block).toHaveAttribute("aria-hidden", "true");
    expect(block).toHaveClass("motion-reduce:animate-none", "h-4", "w-24");
  });
});

describe("ShellSkeletonRows", () => {
  it("renders the requested number of rows", () => {
    const { container } = render(<ShellSkeletonRows count={5} />);
    expect(container.querySelectorAll('[data-slot="shell-skeleton-row"]')).toHaveLength(5);
  });

  // The reason these rows exist instead of the vendored SidebarMenuSkeleton,
  // which picks a random width in state: two renders must be byte-identical,
  // or a server-rendered shell fails hydration.
  it("renders the same markup every time", () => {
    expect(renderToStaticMarkup(<ShellSkeletonRows count={6} />)).toBe(
      renderToStaticMarkup(<ShellSkeletonRows count={6} />),
    );
  });
});

describe("ShellSkeletonLines", () => {
  it("renders the requested number of lines with a short last line", () => {
    const { container } = render(<ShellSkeletonLines count={4} />);
    const lines = container.querySelectorAll('[data-slot="skeleton"]');
    expect(lines).toHaveLength(4);
    expect(lines[3]).toHaveClass("w-2/3");
    expect(lines[0]).toHaveClass("w-full");
  });
});

describe("ShellSkeletonTiles", () => {
  it("renders the requested number of tiles and takes the caller's grid and tile classes", () => {
    const { container } = render(
      <ShellSkeletonTiles count={3} className="grid-cols-3" tileClassName="aspect-square" />,
    );
    expect(container.firstElementChild).toHaveClass("grid", "grid-cols-3");
    const tiles = container.querySelectorAll('[data-slot="skeleton"]');
    expect(tiles).toHaveLength(3);
    expect(tiles[0]).toHaveClass("aspect-square");
  });
});

describe("ShellSkeletonSidebar", () => {
  it("takes B1's expanded width and draws rows", () => {
    const { container } = render(<ShellSkeletonSidebar region="sidebar" />);
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute("data-loading-region", "sidebar");
    expect(region).toHaveClass("w-(--sidebar-width)");
    expect(region.querySelector('[data-slot="shell-skeleton-rows"]')).not.toBeNull();
  });

  it("takes B1's icon width and draws icons when collapsed", () => {
    const { container } = render(<ShellSkeletonSidebar region="icon-rail" collapsed />);
    const region = container.firstElementChild!;
    expect(region).toHaveAttribute("data-region", "icon-rail");
    expect(region).toHaveClass("w-(--sidebar-width-icon)");
    expect(region.querySelector('[data-slot="shell-skeleton-rows"]')).toBeNull();
  });
});

describe("ShellLoadingLabel", () => {
  it("is the one line a screen reader finds, and it is not visible", () => {
    const { container } = render(<ShellLoadingLabel />);
    expect(container.firstElementChild).toHaveTextContent("Loading");
    expect(container.firstElementChild).toHaveClass("sr-only");
  });
});
