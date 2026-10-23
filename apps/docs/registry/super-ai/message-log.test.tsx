import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageLog, type MessageLogEvent } from "./message-log";

const rows = () => [...document.querySelectorAll('[data-slot="message-log-row"]')].map((r) => r.textContent!);

describe("MessageLog", () => {
  it("shows the empty text when there are no events", () => {
    render(<MessageLog events={[]} />);
    expect(document.querySelector('[data-slot="message-log-empty"]')!.textContent).toBe("Nothing sent yet");
    expect(rows()).toHaveLength(0);
  });

  it("takes its own empty text", () => {
    render(<MessageLog events={[]} emptyText="No trace for this message" />);
    expect(screen.getByText("No trace for this message")).toBeInTheDocument();
  });

  it("does not show the empty text once there is an event", () => {
    render(<MessageLog events={[{ id: "1", at: 0, type: "message.created" }]} />);
    expect(document.querySelector('[data-slot="message-log-empty"]')).toBeNull();
  });

  it("writes a skipped row as one sentence naming the channel and the reason", () => {
    render(
      <MessageLog
        events={[
          { id: "1", at: 2, type: "message.skipped", channel: "push", reason: "quiet hours until 08:00" },
        ]}
      />,
    );
    expect(rows()[0]).toContain("Skipped push: quiet hours until 08:00");
  });

  it("writes each event type as a sentence", () => {
    const events: MessageLogEvent[] = [
      { id: "1", at: 0, type: "message.created" },
      { id: "2", at: 0, type: "message.sent", channel: "app", path: "code" },
      { id: "3", at: 5, type: "message.sent", channel: "chat", path: "live" },
      { id: "4", at: 6, type: "message.sent", channel: "chat", path: "fallback", reason: "no-guilt failed" },
      { id: "5", at: 6, type: "message.sent", channel: "app", path: "code", to: "second" },
      { id: "6", at: 7, type: "message.delivered", channel: "chat" },
      { id: "7", at: 9, type: "message.answered", channel: "chat", value: "Read it" },
      { id: "8", at: 10, type: "message.withdrawn", channel: "push" },
      { id: "9", at: 60, type: "message.expired" },
    ];
    render(<MessageLog events={events} />);
    expect(rows().map((r) => r.replace(/^\+\d+ min/, ""))).toEqual([
      "Message created",
      "Sent on app, written by code",
      "Sent on chat, written live",
      "Sent on chat, fallback template: no-guilt failed",
      "Sent on app to the second recipient, written by code",
      "Delivered on chat",
      "Answered on chat: Read it",
      "Withdrawn on push",
      "Expired",
    ]);
  });

  it("shows the time as plus minutes from the start", () => {
    render(<MessageLog events={[{ id: "1", at: 4, type: "message.created" }]} />);
    expect(rows()[0]).toMatch(/^\+4 min/);
  });

  it("names sms as a channel", () => {
    render(
      <MessageLog
        events={[
          { id: "1", at: 0, type: "message.sent", channel: "sms", path: "code" },
          { id: "2", at: 4, type: "message.answered", channel: "sms", value: "Reply 1" },
        ]}
      />,
    );
    expect(rows().map((r) => r.replace(/^\+\d+ min/, ""))).toEqual([
      "Sent on sms, written by code",
      "Answered on sms: Reply 1",
    ]);
  });

  it("keeps the order it was given", () => {
    render(
      <MessageLog
        events={[
          { id: "b", at: 5, type: "message.delivered", channel: "chat" },
          { id: "a", at: 1, type: "message.created" },
        ]}
      />,
    );
    expect(rows()[0]).toContain("Delivered on chat");
    expect(rows()[1]).toContain("Message created");
  });

  it("keeps a very large offset in its own column", () => {
    render(<MessageLog events={[{ id: "1", at: 1760000000000, type: "message.created" }]} />);
    const time = document.querySelector('[data-slot="message-log-row"]')!.firstElementChild!;
    expect(time.className).toContain("min-w-16");
    expect(time.className).toContain("whitespace-nowrap");
  });

  it("says something for a type outside the union rather than leaving the row blank", () => {
    render(<MessageLog events={[{ id: "1", at: 0, type: "message.bounced" as MessageLogEvent["type"] }]} />);
    expect(rows()[0]).toContain("message.bounced");
  });

  it("is a list, one item per event", () => {
    render(<MessageLog events={[{ id: "1", at: 0, type: "message.created" }]} />);
    const list = screen.getByRole("list");
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
  });

  it("passes className through", () => {
    render(<MessageLog className="test-class" events={[]} />);
    expect(document.querySelector('[data-slot="message-log"]')!.className).toContain("test-class");
  });
});
