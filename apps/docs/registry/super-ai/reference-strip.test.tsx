import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReferenceStrip, type ReferenceDescription, type ReferenceStripItem } from "./reference-strip";

describe("ReferenceStrip", () => {
  it("renders the empty state", async () => {
    const onAdd = vi.fn();
    render(<ReferenceStrip items={[]} onAdd={onAdd} />);

    const root = document.querySelector('[data-slot="reference-strip"]')!;
    expect(root).toHaveAttribute("data-state", "empty");
    expect(document.querySelector('[data-slot="reference-strip-empty"]')).toBeInTheDocument();
    expect(screen.getByText("No references yet")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /add reference/i }));
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("renders the filled state", async () => {
    const onRemove = vi.fn();
    const items: ReferenceStripItem[] = [
      { id: "ref-1", thumbnail: { src: "/refs/one.png", alt: "Concept sketch of a lighthouse" }, onRemove },
      { id: "ref-2", thumbnail: { src: "/refs/two.png", alt: "Photo of a coastline" } },
    ];
    render(<ReferenceStrip items={items} />);

    const root = document.querySelector('[data-slot="reference-strip"]')!;
    expect(root).toHaveAttribute("data-state", "filled");
    expect(root).toHaveAttribute("role", "region");

    const thumbnail = screen.getByAltText("Concept sketch of a lighthouse");
    expect(thumbnail.tagName).toBe("IMG");
    expect(thumbnail).toHaveAttribute("src", "/refs/one.png");

    // Plain (roleless) items show no role label text.
    expect(document.querySelector('[data-slot="reference-strip-role"]')).not.toBeInTheDocument();

    // Remove is a per-slot control with a real accessible name.
    await userEvent.click(screen.getByRole("button", { name: /remove reference/i }));
    expect(onRemove).toHaveBeenCalledOnce();

    // Keyboard-reachable scroll affordances (Carousel base).
    expect(screen.getByRole("button", { name: /previous slide/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next slide/i })).toBeInTheDocument();
  });

  it("renders the with-roles state", async () => {
    const onMove = vi.fn();
    const onAdd = vi.fn();
    const items: ReferenceStripItem[] = [
      {
        id: "first",
        role: "first-frame",
        thumbnail: { src: "/refs/first.png", alt: "First frame of the shot" },
      },
      { id: "last", role: "last-frame" }, // empty typed slot — stays visible rather than collapsing
      {
        id: "char",
        role: "character",
        thumbnail: { src: "/refs/char.png", alt: "Reference of the main character" },
      },
    ];
    render(<ReferenceStrip items={items} onMove={onMove} onAdd={onAdd} />);

    const root = document.querySelector('[data-slot="reference-strip"]')!;
    expect(root).toHaveAttribute("data-state", "with-roles");

    // Role labels are real text, not colour-only.
    expect(screen.getByText("First frame")).toBeInTheDocument();
    expect(screen.getByText("Character")).toBeInTheDocument();

    // The empty "last frame" slot is still present and actionable, not collapsed out of the strip.
    const emptySlotButton = screen.getByRole("button", { name: /last frame/i });
    await userEvent.click(emptySlotButton);
    expect(onAdd).toHaveBeenCalledWith("last-frame");

    // Reorder controls carry real accessible names.
    await userEvent.click(screen.getByRole("button", { name: /move first frame right/i }));
    expect(onMove).toHaveBeenCalledWith("first", "right");
    // The first slot can't move further left.
    expect(screen.getByRole("button", { name: /move first frame left/i })).toBeDisabled();
  });

  it("passes className through", () => {
    render(<ReferenceStrip className="test-class" />);
    expect(document.querySelector('[data-slot="reference-strip"]')!.className).toContain("test-class");
  });

  describe("describe", () => {
    const items: ReferenceStripItem[] = [
      {
        id: "first",
        role: "first-frame",
        thumbnail: { src: "/refs/first.png", alt: "First frame of the shot" },
      },
      { id: "last", role: "last-frame" },
      { id: "up", role: "reference", state: "loading", thumbnail: { src: "/refs/up.png", alt: "Uploading" } },
    ];

    it("never offers Describe without an onDescribe handler", () => {
      render(<ReferenceStrip items={items} onUseDescription={vi.fn()} />);
      expect(screen.queryByRole("button", { name: /describe/i })).not.toBeInTheDocument();
      expect(document.querySelector('[data-slot^="reference-strip-describe"]')).not.toBeInTheDocument();
    });

    it("offers Describe on filled, settled slots only", () => {
      render(
        <ReferenceStrip
          items={items}
          onDescribe={vi.fn(() => new Promise<ReferenceDescription>(() => {}))}
        />,
      );
      // One filled slot; the empty and the loading slots offer nothing.
      expect(screen.getAllByRole("button", { name: /^describe/i })).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Describe First frame" })).toBeInTheDocument();
    });

    it("shows exact values first, then caps inferred prompts at four", async () => {
      const onDescribe = vi.fn().mockResolvedValue({
        exact: {
          prompt: "A lighthouse at dusk",
          params: [
            { label: "Seed", value: "48213" },
            { label: "Sampler", value: "euler a" },
          ],
        },
        inferred: ["one", "two", "three", "four", "five", "six"],
      } satisfies ReferenceDescription);
      render(<ReferenceStrip items={items} onDescribe={onDescribe} />);

      await userEvent.click(screen.getByRole("button", { name: "Describe First frame" }));
      expect(onDescribe).toHaveBeenCalledWith(items[0]);

      const exact = await waitFor(() => {
        const el = document.querySelector('[data-slot="reference-strip-describe-exact"]');
        expect(el).toBeInTheDocument();
        return el!;
      });
      const inferred = document.querySelector('[data-slot="reference-strip-describe-inferred"]')!;
      expect(exact.compareDocumentPosition(inferred) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(exact).toHaveTextContent("A lighthouse at dusk");
      expect(exact.querySelector('[data-slot="stat-readout"]')).toHaveTextContent("48213");

      expect(inferred.querySelectorAll("li")).toHaveLength(4);
      expect(inferred).not.toHaveTextContent("five");
      expect(inferred).not.toHaveTextContent("six");
    });

    it("hands the chosen text to onUseDescription and closes", async () => {
      const onUseDescription = vi.fn();
      render(
        <ReferenceStrip
          items={items}
          onDescribe={vi.fn().mockResolvedValue({ inferred: ["Foggy harbour, 35mm film"] })}
          onUseDescription={onUseDescription}
        />,
      );
      await userEvent.click(screen.getByRole("button", { name: "Describe First frame" }));
      await userEvent.click(
        await screen.findByRole("button", { name: "Use prompt: Foggy harbour, 35mm film" }),
      );
      expect(onUseDescription).toHaveBeenCalledExactlyOnceWith("Foggy harbour, 35mm film");
      await waitFor(() =>
        expect(
          document.querySelector('[data-slot="reference-strip-describe-panel"]'),
        ).not.toBeInTheDocument(),
      );
    });

    it("announces pending politely and ignores a result after cancel", async () => {
      let resolve!: (value: ReferenceDescription) => void;
      const onDescribe = vi.fn(() => new Promise<ReferenceDescription>((r) => (resolve = r)));
      render(<ReferenceStrip items={items} onDescribe={onDescribe} />);

      await userEvent.click(screen.getByRole("button", { name: "Describe First frame" }));
      expect(screen.getByRole("status")).toHaveTextContent("Describing First frame");
      expect(await screen.findByText("Describing this reference…")).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
      resolve({ inferred: ["late result"] });
      await Promise.resolve();
      expect(screen.queryByText("late result")).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toBeEmptyDOMElement();
    });

    it("says the reference could not be described when onDescribe rejects", async () => {
      const onDescribe = vi.fn().mockRejectedValue(new Error("no metadata"));
      render(<ReferenceStrip items={items} onDescribe={onDescribe} />);
      await userEvent.click(screen.getByRole("button", { name: "Describe First frame" }));
      expect(await screen.findByText("This reference could not be described.")).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("First frame could not be described");

      onDescribe.mockResolvedValueOnce({ inferred: ["retry worked"] });
      await userEvent.click(screen.getByRole("button", { name: "Try again" }));
      expect(await screen.findByText("retry worked")).toBeInTheDocument();
    });
  });
});
