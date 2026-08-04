import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RenderQueue, type RenderJob } from "./render-queue";

const SPEC = { format: "MP4", codec: "H.264", resolution: "3840×2160", fps: 24 };

const JOBS: RenderJob[] = [
  {
    id: "1",
    name: "Opening titles",
    spec: SPEC,
    stage: "preview",
    state: "done",
    cost: { amount: 4 },
  },
  {
    id: "2",
    name: "Main cut",
    spec: SPEC,
    stage: "export",
    state: "streaming",
    progress: 62,
    cost: { amount: 900, per: "min" },
  },
  { id: "3", name: "Alt ending", spec: SPEC, stage: "export", state: "queued" },
  {
    id: "4",
    name: "Credits roll",
    spec: SPEC,
    stage: "export",
    state: "failed",
    cost: { amount: 55 },
    error: "Encoder ran out of memory",
  },
];

const rowFor = (name: string) => screen.getByRole("row", { name: new RegExp(name) });

describe("RenderQueue", () => {
  it("renders the per-row-spec state", () => {
    render(<RenderQueue jobs={JOBS} />);
    // Every row carries codec, resolution and fps — a queue of filenames
    // cannot be audited before it bills you.
    const specs = screen.getAllByText("MP4 · H.264 · 3840×2160 · 24 fps");
    expect(specs).toHaveLength(4);
  });

  it("renders the progress state", () => {
    render(<RenderQueue jobs={JOBS} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "62");
    // Only the streaming row has one.
    expect(screen.getAllByRole("progressbar")).toHaveLength(1);
  });

  it("renders the retry state", () => {
    render(<RenderQueue jobs={JOBS} onRetry={() => {}} />);
    expect(screen.getByRole("button", { name: "Retry Credits roll" })).toBeInTheDocument();
    // Retry belongs only to the failed row.
    expect(screen.getAllByRole("button", { name: /^Retry/ })).toHaveLength(1);
  });

  it("renders the cancel state", () => {
    render(<RenderQueue jobs={JOBS} onCancel={() => {}} />);
    // Cancel reaches work still in flight — queued and streaming — and nothing else.
    expect(screen.getByRole("button", { name: "Cancel Main cut" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel Alt ending" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Cancel/ })).toHaveLength(2);
  });

  it("renders the download state", () => {
    render(<RenderQueue jobs={JOBS} onDownload={() => {}} />);
    expect(screen.getByRole("button", { name: "Download Opening titles" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^Download/ })).toHaveLength(1);
  });

  it("passes className through", () => {
    render(<RenderQueue jobs={[]} className="test-class" />);
    expect(document.querySelector('[data-slot="render-queue"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing assertions (wave-4 spec §8)
  // ---------------------------------------------------------------------------

  it("keeps a failed row's full spec and offers retry in place", () => {
    render(<RenderQueue jobs={JOBS} onRetry={() => {}} />);
    const failed = rowFor("Credits roll");
    // The settings survive the failure, so retrying does not mean rebuilding.
    expect(within(failed).getByText("MP4 · H.264 · 3840×2160 · 24 fps")).toBeInTheDocument();
    expect(within(failed).getByText("Encoder ran out of memory")).toBeInTheDocument();
    // In place — inside the row, not in a toast elsewhere.
    expect(within(failed).getByRole("button", { name: "Retry Credits roll" })).toBeInTheDocument();
  });

  it("distinguishes preview rows from export rows", () => {
    render(<RenderQueue jobs={JOBS} />);
    // Separate stages, separate economics — and the difference is a visible
    // label, not something inferred from the price.
    expect(within(rowFor("Opening titles")).getByText("Preview")).toBeInTheDocument();
    expect(within(rowFor("Main cut")).getByText("Export")).toBeInTheDocument();
  });

  it("never conveys a job's state by colour alone", () => {
    render(<RenderQueue jobs={JOBS} />);
    for (const [name, text] of [
      ["Opening titles", "Done"],
      ["Main cut", "Rendering"],
      ["Alt ending", "Queued"],
      ["Credits roll", "Failed"],
    ] as const) {
      expect(within(rowFor(name)).getByText(text)).toBeInTheDocument();
    }
  });

  it("formats cost through the shared formatter, and shows an em-dash when there is none", () => {
    render(<RenderQueue jobs={JOBS} />);
    expect(within(rowFor("Opening titles")).getByText("4 credits")).toBeInTheDocument();
    // The rate form survives.
    expect(within(rowFor("Main cut")).getByText("900 credits/min")).toBeInTheDocument();
    // Absent cost reads as deliberate, never as zero.
    expect(within(rowFor("Alt ending")).getByText("—")).toBeInTheDocument();
  });

  it("does not offer cancel on work that has already resolved", () => {
    render(<RenderQueue jobs={JOBS} onCancel={() => {}} />);
    expect(
      within(rowFor("Opening titles")).queryByRole("button", { name: /^Cancel/ }),
    ).not.toBeInTheDocument();
    expect(
      within(rowFor("Credits roll")).queryByRole("button", { name: /^Cancel/ }),
    ).not.toBeInTheDocument();
  });

  it("routes each action to its own job id", async () => {
    const onRetry = vi.fn();
    const onCancel = vi.fn();
    const onDownload = vi.fn();
    render(
      <RenderQueue jobs={JOBS} onRetry={onRetry} onCancel={onCancel} onDownload={onDownload} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Retry Credits roll" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel Main cut" }));
    await userEvent.click(screen.getByRole("button", { name: "Download Opening titles" }));
    expect(onRetry).toHaveBeenCalledWith("4");
    expect(onCancel).toHaveBeenCalledWith("2");
    expect(onDownload).toHaveBeenCalledWith("1");
  });

  it("renders no action at all when its handler is absent", () => {
    render(<RenderQueue jobs={JOBS} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("falls back to an indeterminate bar when a rendering job has no progress", () => {
    render(<RenderQueue jobs={[{ ...JOBS[1], progress: undefined }]} />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute("aria-valuenow");
  });

  it("omits spec parts the caller did not supply, without leaving separators behind", () => {
    render(<RenderQueue jobs={[{ ...JOBS[0], spec: { format: "WAV", resolution: undefined } }]} />);
    expect(screen.getByText("WAV")).toBeInTheDocument();
  });
});
