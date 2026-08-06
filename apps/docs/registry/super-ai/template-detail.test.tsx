import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TemplateDetail, type TemplateDetailTemplate } from "./template-detail";

const PITCH: TemplateDetailTemplate = {
  id: "pitch",
  title: "Minimal pitch deck",
  description: "Twelve slides, one idea per slide.",
  previews: [
    { id: "cover", label: "Cover" },
    { id: "agenda", label: "Agenda" },
    { id: "metrics", label: "Metrics" },
  ],
  options: [
    {
      id: "size",
      label: "Size",
      choices: [
        { value: "16-9", label: "16:9" },
        { value: "4-3", label: "4:3" },
      ],
    },
    {
      id: "palette",
      label: "Palette",
      defaultValue: "warm",
      choices: [
        { value: "cool", label: "Cool" },
        { value: "warm", label: "Warm" },
      ],
    },
  ],
  author: { id: "marta", name: "Marta Lin", meta: "148 templates" },
};

const REPORT: TemplateDetailTemplate = {
  id: "report",
  title: "Quarterly report",
  previews: [{ id: "cover", label: "Cover" }],
  options: [
    {
      id: "size",
      label: "Size",
      choices: [
        { value: "a4", label: "A4" },
        { value: "letter", label: "Letter" },
      ],
    },
  ],
  author: { id: "dev", name: "Dev Okafor" },
};

const POSTER: TemplateDetailTemplate = { id: "poster", title: "Event poster" };

const POOL = [PITCH, REPORT, POSTER];

const open = (extra: Partial<React.ComponentProps<typeof TemplateDetail>> = {}) =>
  render(<TemplateDetail open templates={POOL} {...extra} />);

describe("TemplateDetail", () => {
  it("renders the preview-strip state", () => {
    open();
    const strip = screen.getByRole("region", { name: "Minimal pitch deck previews" });
    const thumbs = within(strip).getAllByRole("button", { name: /cover|agenda|metrics/i });
    expect(thumbs).toHaveLength(3);
    // The first preview is current, and currentness is programmatic — never
    // the ring alone.
    expect(thumbs[0]).toHaveAttribute("aria-current", "true");
    expect(thumbs[1]).not.toHaveAttribute("aria-current");
  });

  it("renders the option-selects state", () => {
    open();
    expect(screen.getByLabelText("Size")).toBeInTheDocument();
    // An option with no defaultValue still resolves — to its first choice.
    expect(screen.getByLabelText("Size")).toHaveTextContent("16:9");
    expect(screen.getByLabelText("Palette")).toHaveTextContent("Warm");
  });

  it("renders the author-follow state", () => {
    open();
    const follow = screen.getByRole("button", { name: "Follow Marta Lin" });
    expect(follow).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("Marta Lin")).toBeInTheDocument();
  });

  it("renders the more-like-this state", () => {
    open();
    expect(screen.getByText("More like this")).toBeInTheDocument();
    // Every other pool member, minus the one on screen.
    expect(screen.getByRole("button", { name: "Quarterly report" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Event poster" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Minimal pitch deck" })).not.toBeInTheDocument();
  });

  it("passes className through", () => {
    open({ className: "test-class" });
    expect(document.querySelector('[data-slot="template-detail"]')!.className).toContain("test-class");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: options are configured before commit
  // ---------------------------------------------------------------------------

  it("commits the configured template, option values included", async () => {
    const user = userEvent.setup();
    const onUseTemplate = vi.fn();
    open({ onUseTemplate });

    await user.click(screen.getByLabelText("Size"));
    await user.click(await screen.findByRole("option", { name: "4:3" }));
    await user.click(screen.getByRole("button", { name: "Use this template" }));

    // The whole point of J6: the host receives a customised template, not an
    // id it then has to go and configure.
    expect(onUseTemplate).toHaveBeenCalledWith({
      templateId: "pitch",
      options: { size: "4-3", palette: "warm" },
    });
  });

  it("commits resolved defaults even when nothing was touched", async () => {
    const user = userEvent.setup();
    const onUseTemplate = vi.fn();
    open({ onUseTemplate });
    await user.click(screen.getByRole("button", { name: "Use this template" }));
    expect(onUseTemplate).toHaveBeenCalledWith({
      templateId: "pitch",
      options: { size: "16-9", palette: "warm" },
    });
  });

  it("honours controlled option values over the template's defaults", () => {
    open({ optionValues: { size: "4-3" } });
    expect(screen.getByLabelText("Size")).toHaveTextContent("4:3");
    // Unlisted options still fall back to their default rather than emptying.
    expect(screen.getByLabelText("Palette")).toHaveTextContent("Warm");
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: "more like this" never dead-ends
  // ---------------------------------------------------------------------------

  it("swaps the modal's content in place instead of closing it", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onTemplateChange = vi.fn();
    open({ onOpenChange, onTemplateChange });

    await user.click(screen.getByRole("button", { name: "Quarterly report" }));

    expect(onTemplateChange).toHaveBeenCalledWith("report");
    // The dialog is still mounted and was never asked to close: `open` is not
    // touched by the swap, which is the guarantee expressed as API.
    expect(onOpenChange).not.toHaveBeenCalled();
    const dialog = document.querySelector('[data-slot="template-detail"]')!;
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("data-template-id", "report");
    expect(screen.getByRole("heading", { name: "Quarterly report" })).toBeInTheDocument();
  });

  it("carries title, author and options over to the swapped-in template", async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole("button", { name: "Quarterly report" }));

    expect(screen.getByRole("button", { name: "Follow Dev Okafor" })).toBeInTheDocument();
    expect(screen.getByLabelText("Size")).toHaveTextContent("A4");
    // And the template just left is now itself a way back — no dead end.
    expect(screen.getByRole("button", { name: "Minimal pitch deck" })).toBeInTheDocument();
  });

  it("keeps each template's own option values when stepping back and forth", async () => {
    const user = userEvent.setup();
    const onUseTemplate = vi.fn();
    open({ onUseTemplate });

    await user.click(screen.getByLabelText("Size"));
    await user.click(await screen.findByRole("option", { name: "4:3" }));
    await user.click(screen.getByRole("button", { name: "Quarterly report" }));
    await user.click(screen.getByRole("button", { name: "Minimal pitch deck" }));
    await user.click(screen.getByRole("button", { name: "Use this template" }));

    expect(onUseTemplate).toHaveBeenCalledWith({
      templateId: "pitch",
      options: { size: "4-3", palette: "warm" },
    });
  });

  it("narrows more-like-this to relatedIds when they are given", () => {
    render(
      <TemplateDetail open templates={[{ ...PITCH, relatedIds: ["poster", "pitch"] }, REPORT, POSTER]} />,
    );
    expect(screen.getByRole("button", { name: "Event poster" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quarterly report" })).not.toBeInTheDocument();
    // Self-reference is dropped rather than rendered as a tile back to here.
    expect(screen.queryByRole("button", { name: "Minimal pitch deck" })).not.toBeInTheDocument();
  });

  it("omits the more-like-this section rather than showing an empty one", () => {
    render(<TemplateDetail open templates={[PITCH]} />);
    expect(screen.queryByText("More like this")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Load-bearing: a template is a social object
  // ---------------------------------------------------------------------------

  it("toggles follow and names the author in the control", async () => {
    const user = userEvent.setup();
    const onFollowChange = vi.fn();
    open({ onFollowChange });

    await user.click(screen.getByRole("button", { name: "Follow Marta Lin" }));
    expect(onFollowChange).toHaveBeenCalledWith("marta", true);
    const follow = screen.getByRole("button", { name: "Following Marta Lin" });
    expect(follow).toHaveAttribute("aria-pressed", "true");
    // The visible word changes too — following is never colour alone.
    expect(follow).toHaveTextContent("Following");
  });

  it("lets the host control follow state per author", async () => {
    const user = userEvent.setup();
    const onFollowChange = vi.fn();
    render(
      <TemplateDetail
        open
        templates={[{ ...PITCH, author: { ...PITCH.author!, following: true } }, REPORT, POSTER]}
        onFollowChange={onFollowChange}
      />,
    );
    const follow = screen.getByRole("button", { name: "Following Marta Lin" });
    await user.click(follow);
    expect(onFollowChange).toHaveBeenCalledWith("marta", false);
    // Controlled: the component does not move on its own.
    expect(screen.getByRole("button", { name: "Following Marta Lin" })).toHaveAttribute("aria-pressed", "true");
  });

  // ---------------------------------------------------------------------------
  // Preview strip
  // ---------------------------------------------------------------------------

  it("moves the current preview without reordering the strip", async () => {
    const user = userEvent.setup();
    const onPreviewChange = vi.fn();
    open({ onPreviewChange });

    const strip = screen.getByRole("region", { name: "Minimal pitch deck previews" });
    await user.click(within(strip).getByRole("button", { name: "Metrics" }));

    expect(onPreviewChange).toHaveBeenCalledWith("metrics");
    expect(within(strip).getByRole("button", { name: "Metrics" })).toHaveAttribute("aria-current", "true");
    expect(within(strip).getByRole("button", { name: "Cover" })).not.toHaveAttribute("aria-current");
  });

  it("hides the strip when there is only one preview", async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole("button", { name: "Quarterly report" }));
    expect(screen.queryByRole("region", { name: /previews$/ })).not.toBeInTheDocument();
    expect(document.querySelector('[data-slot="template-detail-preview"]')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Dialog contract
  // ---------------------------------------------------------------------------

  it("names the dialog with the visible template title", () => {
    open();
    const dialog = document.querySelector('[data-slot="template-detail"]')!;
    const labelledBy = dialog.getAttribute("aria-labelledby");
    // aria-dialog-name: a Base UI popup is role="dialog" and a nameless one
    // fails axe outright.
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent("Minimal pitch deck");
  });

  it("keeps the commit present but inert when no handler is given", () => {
    open();
    expect(screen.getByRole("button", { name: "Use this template" })).toBeDisabled();
  });

  it("stays closed when open is false", () => {
    render(<TemplateDetail open={false} templates={POOL} />);
    expect(document.querySelector('[data-slot="template-detail"]')).toBeNull();
  });
});
