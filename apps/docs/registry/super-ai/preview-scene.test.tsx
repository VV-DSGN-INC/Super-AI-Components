import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PreviewScene, SCENE_GRADES, SCENE_SUBJECTS, SCENE_TREATMENTS } from "./preview-scene";

const scene = () => document.querySelector('[data-slot="preview-scene"]')!;

/**
 * Two renders of the identical scene still differ by their `useId`, so any
 * markup comparison has to drop the instance id first — otherwise a test that
 * means "these draw the same picture" only ever proves "these are two renders".
 */
const drawing = () => scene().innerHTML.replace(/\br[a-z0-9]+-(treatment|grade|tint|sky)\b/g, "$1");

const paintedAttributes = () =>
  [...scene().querySelectorAll("rect, circle, ellipse, path")].flatMap((node) => [
    node.getAttribute("fill") ?? "",
    node.getAttribute("stroke") ?? "",
  ]);

describe("PreviewScene", () => {
  it("draws shapes for every subject", () => {
    for (const subject of SCENE_SUBJECTS) {
      const { unmount } = render(<PreviewScene subject={subject} />);
      expect(scene().getAttribute("data-subject")).toBe(subject);
      expect(scene().querySelectorAll("rect, circle, ellipse, path").length).toBeGreaterThan(3);
      unmount();
    }
  });

  it("renders every treatment and every grade without throwing", () => {
    for (const treatment of SCENE_TREATMENTS) {
      for (const grade of SCENE_GRADES) {
        const { unmount } = render(<PreviewScene treatment={treatment} grade={grade} />);
        expect(scene().getAttribute("data-treatment")).toBe(treatment);
        expect(scene().getAttribute("data-grade")).toBe(grade);
        unmount();
      }
    }
  });

  // The whole reason this component exists over a bg-muted div: a style row
  // has to actually differ cell to cell. If two treatments paint identically
  // the picker is decorative.
  it("paints each treatment differently from the others", () => {
    const painted = SCENE_TREATMENTS.map((treatment) => {
      const { unmount } = render(<PreviewScene subject="landscape" treatment={treatment} />);
      const markup = drawing();
      unmount();
      return markup;
    });
    expect(new Set(painted).size).toBe(SCENE_TREATMENTS.length);
  });

  it("gives each grade its own filter primitives, and none to `none`", () => {
    const graded = SCENE_GRADES.filter((g) => g !== "none").map((grade) => {
      const { unmount } = render(<PreviewScene grade={grade} />);
      const filter = document.querySelector(`filter[id$="-grade"]`)!.innerHTML;
      unmount();
      return filter;
    });
    expect(new Set(graded).size).toBe(SCENE_GRADES.length - 1);

    render(<PreviewScene grade="none" />);
    expect(document.querySelector(`filter[id$="-grade"]`)).toBeNull();
  });

  it("is decorative unless labelled", () => {
    const { unmount } = render(<PreviewScene />);
    expect(scene().getAttribute("aria-hidden")).toBe("true");
    expect(document.querySelector("title")).toBeNull();
    unmount();

    render(<PreviewScene label="Sunlit ridge at dusk" />);
    expect(screen.getByRole("img", { name: "Sunlit ridge at dusk" })).toBeInTheDocument();
    expect(scene().getAttribute("aria-hidden")).toBeNull();
  });

  // Geometry is index-driven rather than random specifically so server and
  // client agree. A regression here surfaces as a hydration mismatch, which is
  // far harder to read than a failing assertion.
  it("draws the same picture for the same variant and a different one otherwise", () => {
    const draw = (variant: number) => {
      const { unmount } = render(<PreviewScene subject="city" variant={variant} />);
      const markup = drawing();
      unmount();
      return markup;
    };
    expect(draw(3)).toBe(draw(3));
    expect(draw(3)).not.toBe(draw(4));
  });

  it("varies hue through tint without a second palette", () => {
    const { unmount } = render(<PreviewScene tint={0} />);
    expect(document.querySelector(`filter[id$="-tint"]`)).toBeNull();
    unmount();

    render(<PreviewScene tint={140} />);
    expect(document.querySelector(`filter[id$="-tint"] feColorMatrix`)!.getAttribute("values")).toBe("140");
  });

  // The token gate only scans for literals; it cannot tell that a var() name
  // resolves to something this registry actually ships. This asserts the other
  // half: every paint routes through a --scene-* custom property, so nothing
  // can quietly hardcode a colour that the manifest never installs.
  it("paints only through --scene-* custom properties", () => {
    for (const treatment of SCENE_TREATMENTS) {
      const { unmount } = render(<PreviewScene treatment={treatment} />);
      for (const value of paintedAttributes()) {
        if (value === "" || value === "none") continue;
        expect(value).toMatch(/^(var\(--scene-[a-z]+\)|url\(#[a-zA-Z0-9-]+\))$/);
      }
      unmount();
    }
  });

  it("keeps filter ids free of the colons React puts in useId", () => {
    render(<PreviewScene treatment="wash" grade="vivid" tint={30} />);
    for (const node of document.querySelectorAll("filter, linearGradient")) {
      expect(node.id).not.toContain(":");
      expect(node.id).toMatch(/^[a-zA-Z0-9-]+$/);
    }
  });

  it("fills its container at whatever aspect the host tile sets", () => {
    render(<PreviewScene />);
    expect(scene().getAttribute("preserveAspectRatio")).toBe("xMidYMid slice");
    // getAttribute rather than .className: on an SVG element that property is
    // an SVGAnimatedString at runtime but typed as a plain string.
    expect(scene().getAttribute("class")).toContain("h-full");
    expect(scene().getAttribute("class")).toContain("w-full");
  });
});
