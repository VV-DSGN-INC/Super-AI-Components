import * as React from "react";
import { expect, userEvent, waitFor } from "storybook/test";

/**
 * The loading twin: the proof that a family O shell's skeleton sits where its
 * loaded regions will land, so the page does not jump when the data arrives.
 *
 * Contract: docs/design-system/block-build-brief.md, "Status and loading". The
 * jsdom half (a busy root, one hidden skeleton per region, nothing mounted that
 * takes focus) is expectShellLoadingContract in apps/docs/lib/test-utils.ts.
 */

/** Every compared edge may differ by at most this many CSS pixels. */
export const LOADING_TWIN_TOLERANCE = 8;

/** The gate's own viewport, pinned so the proof measures one layout everywhere. */
const VIEWPORT = { width: 1200, height: 900 } as const;

const FLIP_EVENT = "loading-twin:flip";

type Edge = "x" | "y" | "width" | "height";

/**
 * What decides a region's box, and so which edges the twin compares. Only a
 * number the layout's classes dictate is compared (D21):
 *
 * - `frame`: a rail, a bar, a panel or a pane the layout places and sizes. All four.
 * - `flow-lead`: the first region in a scroll column, whose height the host's
 *   data decides. Everything but the height.
 * - `flow`: a later region in a scroll column, whose top and height the data
 *   above it and inside it decide. Its x and width.
 * - `text`: a region as wide as the words in it. Everything but the width.
 */
export type TwinKind = "frame" | "flow-lead" | "flow" | "text";

const EDGES: Record<TwinKind, readonly Edge[]> = {
  frame: ["x", "y", "width", "height"],
  "flow-lead": ["x", "y", "width"],
  flow: ["x", "width"],
  text: ["x", "y", "height"],
};

/**
 * Renders one shell and lets `expectLoadingTwin` flip it between its loading and
 * loaded states without remounting the story. It starts loading, which is what
 * the docs page shows.
 */
export function LoadingTwin({ children }: { children: (loading: boolean) => React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const onFlip = (event: Event) => setLoading((event as CustomEvent<boolean>).detail);
    document.addEventListener(FLIP_EVENT, onFlip);
    return () => document.removeEventListener(FLIP_EVENT, onFlip);
  }, []);
  return <>{children(loading)}</>;
}

type Box = Record<Edge, number>;

function measure(root: HTMLElement, regions: readonly string[]): Record<string, Box> {
  const origin = root.getBoundingClientRect();
  const boxes: Record<string, Box> = {};
  for (const region of regions) {
    const found = root.querySelectorAll<HTMLElement>(`[data-loading-region="${region}"]`);
    if (found.length !== 1)
      throw new Error(`${region}: expected one [data-loading-region], found ${found.length}`);
    const rect = found[0].getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0)
      throw new Error(
        `${region}: its box is empty at ${VIEWPORT.width}x${VIEWPORT.height}, so there is nothing to compare`,
      );
    boxes[region] = {
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      width: rect.width,
      height: rect.height,
    };
  }
  return boxes;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Measures every region of `shell` loading and loaded, in one frame, from the
 * story's own fixture, and fails when a compared edge differs by more than
 * LOADING_TWIN_TOLERANCE. It also fails when the loading shell draws a region
 * the map does not name (or misses one it does), and when a Tab from the page
 * lands inside the loading shell. It leaves the shell loading, so axe checks the
 * state the story is named for.
 */
export async function expectLoadingTwin(
  canvasElement: HTMLElement,
  shell: string,
  regions: Record<string, TwinKind>,
): Promise<void> {
  try {
    const { page } = await import("vitest/browser");
    await page.viewport(VIEWPORT.width, VIEWPORT.height);
  } catch (_outsideVitest) {
    // `vitest/browser` exists only inside the vitest runner. In Storybook's own
    // UI the proof measures at whatever viewport the reader has open.
  }

  const root = () => {
    const found = canvasElement.querySelector<HTMLElement>(`[data-slot="${shell}"]`);
    if (!found) throw new Error(`no [data-slot="${shell}"] in this story`);
    return found;
  };
  const flip = async (loading: boolean) => {
    document.dispatchEvent(new CustomEvent(FLIP_EVENT, { detail: loading }));
    await waitFor(() => expect(root().getAttribute("aria-busy") === "true").toBe(loading));
    await nextFrame();
    await nextFrame();
  };
  const names = Object.keys(regions);

  await flip(true);
  const drawn = Array.from(root().querySelectorAll("[data-loading-region]"), (el) =>
    el.getAttribute("data-loading-region"),
  ).sort();
  await expect(drawn).toEqual([...names].sort());

  (document.activeElement as HTMLElement | null)?.blur();
  await userEvent.tab();
  await expect(root().contains(document.activeElement)).toBe(false);

  const skeleton = measure(root(), names);
  await flip(false);
  const loaded = measure(root(), names);
  await flip(true);

  const misses: string[] = [];
  for (const [region, kind] of Object.entries(regions)) {
    for (const edge of EDGES[kind]) {
      const delta = Math.abs(skeleton[region][edge] - loaded[region][edge]);
      if (delta > LOADING_TWIN_TOLERANCE)
        misses.push(
          `${region} ${edge}: skeleton ${Math.round(skeleton[region][edge])}, loaded ${Math.round(loaded[region][edge])}`,
        );
    }
  }
  await expect(misses).toEqual([]);
}
