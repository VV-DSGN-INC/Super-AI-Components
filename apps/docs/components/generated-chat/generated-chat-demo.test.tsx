import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GeneratedChatDemo } from "./generated-chat-demo";

const stream = () => document.querySelector<HTMLElement>('[data-region="message-stream"]')!;
const lastButton = (name: string) => within(stream()).getAllByRole("button", { name }).at(-1)!;

describe("GeneratedChatDemo", () => {
  it("plays the hero path: failures, the question, the receipt, then a view built and shown on click", async () => {
    const user = userEvent.setup();
    render(<GeneratedChatDemo stepMs={0} />);

    await user.click(screen.getByRole("button", { name: "What failed overnight?" }));
    expect(await within(stream()).findByText("Scene 3: dashboard tour, slow pan")).toBeInTheDocument();
    expect(within(stream()).getByText("Poster variant B, crowd at night")).toBeInTheDocument();

    await user.click(await within(stream()).findByRole("button", { name: "Retry 2 timed-out runs" }));
    expect(await within(stream()).findByText("Retry 2 video runs?")).toBeInTheDocument();
    expect(within(stream()).getByRole("button", { name: "Retry 2 timed-out runs" })).toBeDisabled();

    await user.click(within(stream()).getByRole("button", { name: "Confirm" }));
    expect(await within(stream()).findByText(/^Queued\. Both runs/)).toBeInTheDocument();

    await user.click(await waitFor(() => lastButton("Track failed runs")));
    const show = await within(stream()).findByRole("button", { name: "Show Failed runs this week" });
    expect(screen.queryByRole("region", { name: "Failed runs this week" })).toBeNull();

    await user.click(show);
    const view = await screen.findByRole("region", { name: "Failed runs this week" });
    expect(within(view).getByText("Hero banner, rooftop garden at golden hour")).toBeInTheDocument();
  });

  it("locks every chip while a reply is still arriving", async () => {
    const user = userEvent.setup();
    render(<GeneratedChatDemo stepMs={60} />);

    await user.click(screen.getByRole("button", { name: "What failed overnight?" }));
    const day = await within(stream()).findByRole("button", { name: "What's my day?" }, { timeout: 2000 });
    await waitFor(() => expect(day).toBeEnabled());

    await user.click(day);
    expect(lastButton("Track failed runs")).toBeDisabled();
    await waitFor(() => expect(lastButton("Track failed runs")).toBeEnabled(), { timeout: 2000 });
  });

  it("reopens the question when the approval is undone, and says so once", async () => {
    const user = userEvent.setup();
    render(<GeneratedChatDemo stepMs={0} />);
    await user.click(screen.getByRole("button", { name: "What failed overnight?" }));
    await user.click(await within(stream()).findByRole("button", { name: "Retry 2 timed-out runs" }));
    await user.click(await within(stream()).findByRole("button", { name: "Confirm" }));
    await user.click(await within(stream()).findByRole("button", { name: "Undo" }));

    expect(await within(stream()).findByRole("button", { name: "Confirm" })).toBeInTheDocument();
    expect(within(stream()).queryByText("Skipped")).toBeNull();
    expect(within(stream()).getAllByText(/^Undone\./)).toHaveLength(1);
    expect(within(stream()).getByRole("button", { name: "Retry 2 timed-out runs" })).toBeDisabled();
  });

  it(
    "keeps a working view card when the reply is stopped after the card arrives",
    { timeout: 15000 },
    async () => {
      const user = userEvent.setup();
      // A long step leaves a wide window between the card and the chips, so
      // Stop lands mid-reply even on a loaded machine.
      render(<GeneratedChatDemo stepMs={600} />);
      await user.click(screen.getByRole("button", { name: "What failed overnight?" }));
      const track = await within(stream()).findByRole(
        "button",
        { name: "Track failed runs" },
        { timeout: 5000 },
      );
      await waitFor(() => expect(track).toBeEnabled(), { timeout: 5000 });

      await user.click(track);
      const show = await within(stream()).findByRole(
        "button",
        { name: "Show Failed runs this week" },
        { timeout: 5000 },
      );
      await user.click(await screen.findByRole("button", { name: "Stop generating" }));
      await waitFor(() => expect(show).toBeEnabled(), { timeout: 5000 });

      await user.click(show);
      expect(await screen.findByRole("region", { name: "Failed runs this week" })).toBeInTheDocument();
    },
  );

  it("builds a generated view, keeps the last good version when one fails, and recovers on Retry", async () => {
    const user = userEvent.setup();
    render(<GeneratedChatDemo stepMs={0} />);
    await user.type(screen.getByRole("textbox"), "Show spend by project{Enter}");
    await user.click(
      await within(stream()).findByRole("button", { name: "Show Spend by project this week" }),
    );
    const view = await screen.findByRole("region", { name: "Spend by project this week" });
    expect(await within(view).findByText("Onboarding video")).toBeInTheDocument();

    await user.click(await waitFor(() => lastButton("Add a daily trend")));
    expect(await within(view).findByText("This version did not render.")).toBeInTheDocument();
    expect(within(view).getByText(/Chart is not a component this view can use/)).toBeInTheDocument();
    expect(within(view).getByText("Onboarding video")).toBeInTheDocument();

    await user.click(within(view).getByRole("button", { name: "Retry" }));
    expect(await within(view).findByText("Mon 19 Oct")).toBeInTheDocument();
    expect(within(view).queryByText("This version did not render.")).toBeNull();
  });

  it("after Undo, falls back to the last version before the current one that rendered", async () => {
    const user = userEvent.setup();
    render(<GeneratedChatDemo stepMs={0} />);
    await user.type(screen.getByRole("textbox"), "Show spend by project{Enter}");
    await user.click(
      await within(stream()).findByRole("button", { name: "Show Spend by project this week" }),
    );
    const view = await screen.findByRole("region", { name: "Spend by project this week" });
    expect(await within(view).findByText("Onboarding video")).toBeInTheDocument();
    await user.click(await waitFor(() => lastButton("Add a daily trend")));
    expect(await within(view).findByText("This version did not render.")).toBeInTheDocument();
    await user.click(within(view).getByRole("button", { name: "Retry" }));
    expect(await within(view).findByText("Mon 19 Oct")).toBeInTheDocument();

    // Back to the version that failed. What rendered before it was v1, not the
    // v3 that came after it, so the trend must not appear as the fallback.
    await user.click(within(view).getByRole("button", { name: "Undo" }));
    expect(await within(view).findByText("This version did not render.")).toBeInTheDocument();
    const fallback = view.querySelector<HTMLElement>('[data-slot="generated-body-fallback"]')!;
    expect(within(fallback).getByText("Onboarding video")).toBeInTheDocument();
    expect(within(view).queryByText("Mon 19 Oct")).toBeNull();
  });

  describe("with the model on", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("sends free text to the chat route and keeps chips scripted", async () => {
      const body = [
        { type: "start" },
        { type: "text-start", id: "t" },
        { type: "text-delta", id: "t", delta: "Video took most of it." },
        { type: "text-end", id: "t" },
        { type: "data-suggestions", data: { items: ["Show spend by project"] } },
        { type: "finish" },
      ]
        .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
        .join("");
      const fetch = vi.fn(
        async () => new Response(body, { headers: { "content-type": "text/event-stream" } }),
      );
      vi.stubGlobal("fetch", fetch);
      const user = userEvent.setup();
      render(<GeneratedChatDemo stepMs={0} model />);
      expect(screen.getByText(/Free-text questions go to a model/)).toBeInTheDocument();

      await user.type(screen.getByRole("textbox"), "where did the credits go{Enter}");
      expect(await within(stream()).findByText("Video took most of it.")).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(1);

      await user.click(await waitFor(() => lastButton("Show spend by project")));
      expect(await within(stream()).findByText(/I built a view of this week's spend/)).toBeInTheDocument();
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  it("says no model is called when the model is off", () => {
    render(<GeneratedChatDemo stepMs={0} />);
    expect(screen.getByText(/No model is called/)).toBeInTheDocument();
  });

  it("answers anything unscripted with the ready prompts", async () => {
    const user = userEvent.setup();
    render(<GeneratedChatDemo stepMs={0} />);
    await user.type(screen.getByRole("textbox"), "Write me a poem{Enter}");
    expect(await within(stream()).findByText(/These are ready to try/)).toBeInTheDocument();
    expect(lastButton("How much have we spent this week?")).toBeInTheDocument();
  });
});
