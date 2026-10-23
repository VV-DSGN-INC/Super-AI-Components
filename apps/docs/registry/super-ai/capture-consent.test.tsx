import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CaptureConsent, type CaptureConsentState } from "./capture-consent";

const PEOPLE = ["Priya", "Marcus"];

describe("CaptureConsent", () => {
  it("renders the pre-notice state: names who is told, Start disabled, both switches off", () => {
    render(<CaptureConsent state="pre-notice" participants={PEOPLE} />);
    expect(screen.getByText(/tells Priya and Marcus/)).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Not recording");
    expect(screen.getByRole("switch", { name: "Record this session" })).not.toBeChecked();
    expect(screen.getByRole("switch", { name: "Share notes with participants" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Start capture" })).toBeDisabled();
  });

  it("renders the recording state as a status that is never a dialog or alert", () => {
    render(<CaptureConsent state="recording" elapsedLabel="12:04" />);
    expect(screen.getByRole("status")).toHaveTextContent("Recording started");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByText("12:04")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stop capture" })).toBeInTheDocument();
  });

  it("renders the others-notified state confirming who was told", () => {
    render(<CaptureConsent state="others-notified" participants={PEOPLE} />);
    expect(screen.getByRole("status")).toHaveTextContent("Recording, others notified");
    expect(screen.getByText(/Priya and Marcus were told/)).toBeInTheDocument();
  });

  it("renders the declined state with the consequence for the initiator", () => {
    render(
      <CaptureConsent state="declined" declinedBy={["Marcus"]} consequence="Notes for this call are off." />,
    );
    expect(screen.getByText("Marcus declined.")).toBeInTheDocument();
    expect(screen.getByText("Notes for this call are off.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the ended state with what is kept and what is deleted", () => {
    render(<CaptureConsent state="ended" kept="Summary and action items" deleted="Audio and transcript" />);
    expect(screen.getByRole("status")).toHaveTextContent("Recording stopped");
    expect(screen.getByText("Kept:")).toBeInTheDocument();
    expect(screen.getByText("Summary and action items")).toBeInTheDocument();
    expect(screen.getByText("Deleted:")).toBeInTheDocument();
    expect(screen.getByText("Audio and transcript")).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<CaptureConsent className="test-class" />);
    expect(document.querySelector('[data-slot="capture-consent"]')!.className).toContain("test-class");
  });

  describe("the gate", () => {
    it("fires onStartCapture only after the record switch is on, with the sharing choice", async () => {
      const user = userEvent.setup();
      const onStartCapture = vi.fn();
      render(<CaptureConsent state="pre-notice" onStartCapture={onStartCapture} />);
      const start = screen.getByRole("button", { name: "Start capture" });
      await user.click(start);
      expect(onStartCapture).not.toHaveBeenCalled();

      await user.click(screen.getByRole("switch", { name: "Record this session" }));
      expect(start).toBeEnabled();
      await user.click(start);
      expect(onStartCapture).toHaveBeenCalledTimes(1);
      expect(onStartCapture).toHaveBeenCalledWith({ sharing: false, startedAt: expect.any(String) });
    });

    it("keeps recording and sharing independent", async () => {
      const user = userEvent.setup();
      const onStartCapture = vi.fn();
      render(<CaptureConsent state="pre-notice" onStartCapture={onStartCapture} />);
      await user.click(screen.getByRole("switch", { name: "Share notes with participants" }));
      expect(screen.getByRole("button", { name: "Start capture" })).toBeDisabled();
      await user.click(screen.getByRole("switch", { name: "Record this session" }));
      await user.click(screen.getByRole("button", { name: "Start capture" }));
      expect(onStartCapture).toHaveBeenCalledWith(expect.objectContaining({ sharing: true }));
    });

    it("starts with both switches off on every re-entry to pre-notice", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<CaptureConsent state="pre-notice" />);
      await user.click(screen.getByRole("switch", { name: "Record this session" }));
      rerender(<CaptureConsent state="ended" />);
      rerender(<CaptureConsent state="pre-notice" />);
      expect(screen.getByRole("switch", { name: "Record this session" })).not.toBeChecked();
    });

    it.each<CaptureConsentState>(["recording", "others-notified", "declined", "ended"])(
      "cannot fire onStartCapture from %s",
      async (state) => {
        const user = userEvent.setup();
        const onStartCapture = vi.fn();
        render(<CaptureConsent state={state} onStartCapture={onStartCapture} />);
        for (const control of [...screen.queryAllByRole("button"), ...screen.queryAllByRole("switch")]) {
          await user.click(control);
        }
        expect(onStartCapture).not.toHaveBeenCalled();
      },
    );

    it("renders the compact pre-notice as a passive badge with no control", () => {
      const onStartCapture = vi.fn();
      render(<CaptureConsent form="compact" state="pre-notice" onStartCapture={onStartCapture} />);
      expect(screen.getByRole("status")).toHaveTextContent("Not recording");
      expect(screen.queryByRole("button")).toBeNull();
      expect(screen.queryByRole("switch")).toBeNull();
    });
  });

  describe("recording is a persistent status", () => {
    it("keeps one status element across state changes so changes are announced", () => {
      const { rerender } = render(<CaptureConsent state="pre-notice" />);
      const status = screen.getByRole("status");
      rerender(<CaptureConsent state="recording" />);
      expect(screen.getByRole("status")).toBe(status);
      expect(status).toHaveTextContent("Recording started");
      rerender(<CaptureConsent state="ended" />);
      expect(screen.getByRole("status")).toBe(status);
      expect(status).toHaveTextContent("Recording stopped");
    });

    it("renders the compact chip as the status in recording", () => {
      render(<CaptureConsent form="compact" state="recording" />);
      expect(screen.getByRole("status")).toHaveTextContent("Recording started");
      expect(document.querySelector('[data-form="compact"]')).not.toBeNull();
    });

    it("has no dismiss control and sets no timer", () => {
      vi.useFakeTimers();
      render(<CaptureConsent state="recording" />);
      vi.advanceTimersByTime(60 * 60 * 1000);
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /dismiss|close/i })).toBeNull();
      vi.useRealTimers();
    });

    it("controls sharing from the caller while capturing", async () => {
      const user = userEvent.setup();
      const onSharingChange = vi.fn();
      render(<CaptureConsent state="recording" sharing={false} onSharingChange={onSharingChange} />);
      const share = screen.getByRole("switch", { name: "Share notes with participants" });
      await user.click(share);
      expect(onSharingChange).toHaveBeenCalledWith(true);
      expect(share).not.toBeChecked();
    });

    it("stops capture from the bar form", async () => {
      const user = userEvent.setup();
      const onStopCapture = vi.fn();
      render(<CaptureConsent state="recording" onStopCapture={onStopCapture} />);
      await user.click(screen.getByRole("button", { name: "Stop capture" }));
      expect(onStopCapture).toHaveBeenCalledTimes(1);
    });
  });

  it("points at data controls by name and offers no training switch", () => {
    render(<CaptureConsent state="pre-notice" dataControlsName="Privacy settings" />);
    expect(screen.getByText(/set in Privacy settings, not here/)).toBeInTheDocument();
    expect(screen.getAllByRole("switch")).toHaveLength(2);
  });
});
