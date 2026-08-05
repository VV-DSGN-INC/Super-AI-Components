import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RateLimitBanner, countdownAnnouncement, formatCountdown } from "./rate-limit-banner";

const slot = (name: string) => document.querySelector(`[data-slot="rate-limit-banner-${name}"]`);

describe("RateLimitBanner", () => {
  it("renders the your-limit state as a plan boundary, without blaming the request", () => {
    render(<RateLimitBanner cause="your-limit" resource="Image generations" />);

    expect(document.querySelector('[data-slot="rate-limit-banner"]')!.getAttribute("data-cause")).toBe(
      "your-limit",
    );
    expect(slot("title")!.textContent).toBe("You've reached your plan's limit");
    expect(slot("body")!.textContent).toMatch(/not a problem with your request/);
    expect(slot("resource")!.textContent).toBe("Image generations");
  });

  it("renders the provider-capacity state with different copy that clears the user of fault", () => {
    render(<RateLimitBanner cause="provider-capacity" resource="Claude Opus 4.5" />);

    expect(slot("title")!.textContent).toBe("The model is at capacity");
    expect(slot("body")!.textContent).toMatch(/Nothing is wrong with your account or your request/);
  });

  it("says something genuinely different for each cause — they are not one message with a swapped noun", () => {
    const yours = render(<RateLimitBanner cause="your-limit" remainingSeconds={120} />);
    const yourTitle = slot("title")!.textContent;
    const yourBody = slot("body")!.textContent;
    const yourCountdown = slot("countdown")!.textContent;
    yours.unmount();

    render(<RateLimitBanner cause="provider-capacity" remainingSeconds={120} />);
    expect(slot("title")!.textContent).not.toBe(yourTitle);
    expect(slot("body")!.textContent).not.toBe(yourBody);
    // Even the countdown label differs: a quota "resets", capacity is an estimate.
    expect(slot("countdown")!.textContent).not.toBe(yourCountdown);
  });

  it("renders the live-countdown state from a host-owned remainingSeconds, holding no timer of its own", () => {
    vi.useFakeTimers();
    try {
      const view = render(<RateLimitBanner cause="your-limit" remainingSeconds={154} />);
      expect(slot("countdown")!.textContent).toContain("2:34");

      // Nothing inside the component advances the clock: only a new prop does.
      vi.advanceTimersByTime(10_000);
      expect(slot("countdown")!.textContent).toContain("2:34");

      view.rerender(<RateLimitBanner cause="your-limit" remainingSeconds={144} />);
      expect(slot("countdown")!.textContent).toContain("2:24");
    } finally {
      vi.useRealTimers();
    }
  });

  it("reads the countdown out as words rather than as a punctuated clock", () => {
    render(<RateLimitBanner cause="your-limit" remainingSeconds={3725} />);
    expect(slot("countdown")!.textContent).toContain("1:02:05");
    expect(screen.getByLabelText("1 hour 2 minutes 5 seconds")).toBeInTheDocument();
  });

  it("announces the wait coarsely, so a per-second tick never reaches the live region", () => {
    const view = render(<RateLimitBanner cause="provider-capacity" remainingSeconds={185} />);
    const status = slot("status")!;
    expect(status.getAttribute("role")).toBe("status");
    const announced = status.textContent;
    expect(announced).toContain("about 4 minutes left");

    // A second ticking away must not change the announced string at all.
    view.rerender(<RateLimitBanner cause="provider-capacity" remainingSeconds={184} />);
    expect(slot("status")!.textContent).toBe(announced);

    // Crossing the bucket is the only thing that speaks.
    view.rerender(<RateLimitBanner cause="provider-capacity" remainingSeconds={175} />);
    expect(slot("status")!.textContent).not.toBe(announced);
  });

  it("is a note, not an alert — an assertive banner would interrupt once a second for the whole wait", () => {
    render(<RateLimitBanner cause="your-limit" remainingSeconds={60} />);
    expect(screen.getByRole("note")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("states the absence of an estimate instead of falling back to 'try again later'", () => {
    render(<RateLimitBanner cause="provider-capacity" />);
    expect(slot("countdown")).toBeNull();
    expect(slot("no-eta")!.textContent).toMatch(/No estimate yet/);
    expect(screen.queryByText(/try again later/i)).not.toBeInTheDocument();
  });

  it("switches to a reached-zero message rather than showing 0:00", () => {
    render(<RateLimitBanner cause="your-limit" remainingSeconds={0} />);
    expect(slot("countdown")!.textContent).toBe("Your limit has reset — you can send again.");
    expect(slot("status")!.textContent).toContain("available now");
  });

  it("renders the notify-me state as an opt-in whose taken state is text and aria-pressed, not colour", async () => {
    const onNotifyMe = vi.fn();
    const view = render(
      <RateLimitBanner cause="provider-capacity" onNotifyMe={onNotifyMe} />,
    );

    const button = screen.getByRole("button", { name: "Notify me when capacity returns" });
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(slot("notify-status")).toBeNull();

    await userEvent.click(button);
    expect(onNotifyMe).toHaveBeenCalledTimes(1);
    // Controlled: clicking asks the host, it does not flip its own state.
    expect(
      screen.getByRole("button", { name: "Notify me when capacity returns" }).getAttribute("aria-pressed"),
    ).toBe("false");

    view.rerender(<RateLimitBanner cause="provider-capacity" onNotifyMe={onNotifyMe} notifyEnabled />);
    const pressed = screen.getByRole("button", { name: "Notify me when capacity returns" });
    expect(pressed.getAttribute("aria-pressed")).toBe("true");
    expect(slot("notify-status")!.textContent).toMatch(/let you know/);
    expect(slot("status")!.textContent).toContain("You will be notified");
  });

  it("omits the opt-in entirely when no handler is given", () => {
    render(<RateLimitBanner cause="your-limit" remainingSeconds={30} />);
    expect(slot("notify")).toBeNull();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders an escape hatch alongside the wait", () => {
    render(
      <RateLimitBanner
        cause="your-limit"
        remainingSeconds={30}
        action={<button type="button">Upgrade plan</button>}
      />,
    );
    expect(slot("action")!.textContent).toBe("Upgrade plan");
  });

  it("formats and buckets durations without a timer", () => {
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(-5)).toBe("0:00");
    expect(formatCountdown(9)).toBe("0:09");
    expect(formatCountdown(154)).toBe("2:34");
    expect(formatCountdown(3725)).toBe("1:02:05");

    expect(countdownAnnouncement(0)).toBe("available now");
    expect(countdownAnnouncement(59)).toBe("less than a minute left");
    expect(countdownAnnouncement(60)).toBe("about 1 minute left");
    expect(countdownAnnouncement(61)).toBe("about 2 minutes left");
    expect(countdownAnnouncement(7200)).toBe("about 2 hours left");
  });

  it("passes className through", () => {
    render(<RateLimitBanner cause="your-limit" className="test-class" />);
    expect(document.querySelector('[data-slot="rate-limit-banner"]')!.className).toContain("test-class");
  });
});
