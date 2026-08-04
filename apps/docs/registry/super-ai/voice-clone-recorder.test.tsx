import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VoiceCloneRecorder } from "./voice-clone-recorder";

const SCRIPT = ["The quick brown fox jumps over the lazy dog.", "She sells seashells by the seashore."];

describe("VoiceCloneRecorder", () => {
  it("renders the prompt-script state — the script is real text, not an image", async () => {
    const onStartRecording = vi.fn();
    render(<VoiceCloneRecorder script={SCRIPT} currentLine={0} onStartRecording={onStartRecording} />);

    expect(screen.getByText("The quick brown fox jumps over the lazy dog.")).toBeInTheDocument();
    expect(screen.getByText("Line 1 of 2")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Start recording" }));
    expect(onStartRecording).toHaveBeenCalledOnce();
  });

  it("renders the level-metering state — announced, not just a coloured dot, with a text value for the meter", async () => {
    const onStopRecording = vi.fn();
    render(
      <VoiceCloneRecorder
        script={SCRIPT}
        state="level-metering"
        level={62}
        elapsedLabel="0:07"
        onStopRecording={onStopRecording}
      />,
    );

    // The recording state is carried by an announced status text, not by the
    // (aria-hidden) coloured dot alone.
    expect(screen.getByRole("status")).toHaveTextContent("Recording");
    expect(screen.getByText("0:07")).toBeInTheDocument();

    // The meter's value has a text equivalent alongside the progressbar —
    // never conveyed by the bar's fill alone.
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "62");
    expect(screen.getByText("62%")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Stop recording" }));
    expect(onStopRecording).toHaveBeenCalledOnce();
  });

  it("renders the retake state — retake has a clear accessible name and carries no data forward", async () => {
    const onRetake = vi.fn();
    const onAcceptTake = vi.fn();
    render(
      <VoiceCloneRecorder
        script={SCRIPT}
        state="retake"
        takeSummary="Take recorded — 7s"
        onRetake={onRetake}
        onAcceptTake={onAcceptTake}
      />,
    );

    expect(screen.getByText("Take recorded — 7s")).toBeInTheDocument();
    // "Retake" is the button's own visible text, not an icon needing a
    // separate aria-label bolted on.
    const retake = screen.getByRole("button", { name: "Retake" });
    expect(retake).toHaveAccessibleName("Retake");

    await userEvent.click(retake);
    expect(onRetake).toHaveBeenCalledOnce();
    expect(onRetake).toHaveBeenCalledWith();

    await userEvent.click(screen.getByRole("button", { name: "Use this take" }));
    expect(onAcceptTake).toHaveBeenCalledOnce();
    // Accepting a take never hands along a payload a consumer could mistake
    // for consent — see the consent-capture test below.
    expect(onAcceptTake).toHaveBeenCalledWith();
  });

  it("renders the consent-capture state as a gate that cannot be skipped or pre-checked", async () => {
    const onConsent = vi.fn();
    const onConsentCancel = vi.fn();
    render(
      <VoiceCloneRecorder
        script={SCRIPT}
        state="consent-capture"
        speakerName="Jamie"
        onConsent={onConsent}
        onConsentCancel={onConsentCancel}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Confirm & clone voice" });
    const checkbox = screen.getByRole("checkbox", {
      name: "I have Jamie's explicit, informed permission to record this sample and create an AI clone of their voice.",
    });

    // Load-bearing: the checkbox starts unchecked and the confirm action is
    // inert until it is checked — there is no prop that pre-checks it.
    expect(checkbox).not.toBeChecked();
    expect(confirm).toBeDisabled();
    await userEvent.click(confirm);
    expect(onConsent).not.toHaveBeenCalled();

    await userEvent.click(checkbox);
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onConsent).toHaveBeenCalledOnce();
    expect(onConsent).toHaveBeenCalledWith({ consentedAt: expect.any(String) });
  });

  it("never treats backing out of consent-capture as consent", async () => {
    const onConsent = vi.fn();
    const onConsentCancel = vi.fn();
    render(
      <VoiceCloneRecorder
        script={SCRIPT}
        state="consent-capture"
        speakerName="Jamie"
        onConsent={onConsent}
        onConsentCancel={onConsentCancel}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onConsentCancel).toHaveBeenCalledOnce();
    expect(onConsent).not.toHaveBeenCalled();
  });

  it("passes className through", () => {
    render(<VoiceCloneRecorder script="Read this line aloud." className="test-class" />);
    expect(document.querySelector('[data-slot="voice-clone-recorder"]')!.className).toContain("test-class");
  });
});
