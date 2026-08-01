import * as React from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroVideoDialog } from "./hero-video-dialog";

const props = {
  videoSrc: "https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ",
  thumbnailSrc: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
  thumbnailAlt: "Product tour",
};

describe("HeroVideoDialog", () => {
  it("opens the dialog with the video iframe on trigger click", () => {
    render(<HeroVideoDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const iframe = document.querySelector('[data-slot="hero-video-dialog-iframe"]')!;
    expect(iframe).toHaveAttribute("src", props.videoSrc);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<HeroVideoDialog {...props} />);
    const trigger = screen.getByRole("button", { name: "Play video" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it("closes via the close button", async () => {
    render(<HeroVideoDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Play video" }));
    fireEvent.click(screen.getByRole("button", { name: "Close video" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("forwards ref to the component root", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<HeroVideoDialog {...props} ref={ref} />);
    expect(ref.current?.getAttribute("data-slot")).toBe("hero-video-dialog");
  });
});
