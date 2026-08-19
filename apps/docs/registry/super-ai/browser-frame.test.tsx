import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrowserFrame } from "./browser-frame";

const slot = (name: string) => document.querySelector(`[data-slot="browser-frame-${name}"]`);
/**
 * The one node that carries the address for assistive tech. Queried by class
 * rather than by text: for a host-plus-one-segment URL the visible half is the
 * whole string too, so `getByText` legitimately matches twice.
 */
const announcedAddress = () => slot("address")!.querySelector(".sr-only")!.textContent;

describe("BrowserFrame", () => {
  it("renders the page state — chrome, address and the child content", () => {
    render(
      <BrowserFrame address="https://vercel.com/geist/browser">
        <img alt="The Geist Browser documentation page" src="/capture.png" />
      </BrowserFrame>,
    );
    expect(slot("chrome")).toBeInTheDocument();
    expect(slot("dots")).toBeInTheDocument();
    expect(slot("controls")).toBeInTheDocument();
    expect(slot("address")).toBeInTheDocument();
    // The meaning is the child's, and it survives the frame intact.
    expect(screen.getByRole("img", { name: "The Geist Browser documentation page" })).toBeInTheDocument();
  });

  it("renders the minimal state — dots only, no address, no controls", () => {
    render(<BrowserFrame dots controls={false} />);
    expect(slot("dots")).toBeInTheDocument();
    expect(slot("controls")).not.toBeInTheDocument();
    expect(slot("address")).not.toBeInTheDocument();
    expect(slot("chrome")).toBeInTheDocument();
  });

  it("renders the inverted state on the chrome bar", () => {
    // Tone is purely a surface, so the painted class is the only observable
    // there is. Asserting it beats asserting nothing, and it pins the one
    // thing that matters: the two tones do not resolve to the same surface.
    render(<BrowserFrame address="https://vercel.com" tone="inverted" />);
    const inverted = slot("chrome")!.className;
    expect(inverted).toContain("bg-foreground");

    render(<BrowserFrame address="https://vercel.com" tone="surface" />);
    const both = document.querySelectorAll('[data-slot="browser-frame-chrome"]');
    expect(both[1].className).not.toBe(inverted);
  });

  it("renders the long-address state announced once, from one node", () => {
    const address = "https://vercel.com/docs/deployments/configure-a-build/build-image/build-image-v2";
    render(<BrowserFrame address={address} />);

    // Exactly one node carries the string. accname fuses adjacent name-from-content
    // chunks with no separator, so leaving the two visual halves visible would
    // announce a mangled URL — the failure the build brief records.
    expect(announcedAddress()).toBe(address);
    const visible = slot("address")!.querySelectorAll('[aria-hidden="true"]');
    expect(visible.length).toBe(2);
    expect([...visible].map((n) => n.textContent).join("")).toBe(address);
  });

  it("renders the loading state at the same ratio, with no child content", () => {
    render(
      <BrowserFrame address="https://vercel.com" loading>
        <span>should not render</span>
      </BrowserFrame>,
    );
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByText("should not render")).not.toBeInTheDocument();
    // The well is locked in both states, so nothing moves when it resolves.
    expect(document.querySelector('[data-slot="aspect-ratio"]')).toBeInTheDocument();
  });

  it("keeps the address in the accessibility tree while hiding the decoration", () => {
    // The divergence from Geist, pinned. Geist hides the whole chrome because
    // its URL is illustrative; here the URL is the record of where the agent
    // went, and hiding it would leave a screen-reader user knowing a page was
    // visited but not which one.
    render(<BrowserFrame address="https://vercel.com/geist" />);
    expect(announcedAddress()).toBe("https://vercel.com/geist");
    expect(slot("dots")).toHaveAttribute("aria-hidden", "true");
    expect(slot("controls")).toHaveAttribute("aria-hidden", "true");
  });

  it("adds no tab stop — the chrome depicts a browser, it does not drive one", () => {
    const { container } = render(<BrowserFrame address="https://vercel.com/geist" />);
    expect(container.querySelectorAll("a, button, input, select, textarea, [tabindex]")).toHaveLength(0);
  });

  it("drops the chrome bar entirely when there is nothing to put in it", () => {
    // An empty bar is a stripe of noise; a plain locked well is the honest
    // rendering of "no chrome requested".
    render(<BrowserFrame dots={false} controls={false} />);
    expect(slot("chrome")).not.toBeInTheDocument();
    expect(slot("content")).toBeInTheDocument();
  });

  it("does not split a host-only address, and does not pin an over-long tail", () => {
    render(<BrowserFrame address="https://vercel.com" />);
    expect(slot("address")!.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);

    const longTail = "https://vercel.com/docs/a-path-segment-longer-than-the-pin-allows-for";
    render(<BrowserFrame address={longTail} />);
    const second = document.querySelectorAll('[data-slot="browser-frame-address"]')[1];
    expect(second.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it("passes className through", () => {
    render(<BrowserFrame className="test-class" />);
    expect(document.querySelector('[data-slot="browser-frame"]')!.className).toContain("test-class");
  });
});
