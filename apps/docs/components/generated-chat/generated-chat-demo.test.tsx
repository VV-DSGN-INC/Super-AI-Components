import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

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

  it("answers anything unscripted with the ready prompts", async () => {
    const user = userEvent.setup();
    render(<GeneratedChatDemo stepMs={0} />);
    await user.type(screen.getByRole("textbox"), "Write me a poem{Enter}");
    expect(await within(stream()).findByText(/These are ready to try/)).toBeInTheDocument();
    expect(lastButton("How much have we spent this week?")).toBeInTheDocument();
  });
});
