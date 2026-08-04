"use client";

import * as React from "react";
import { Check, Mic, Pause, RotateCcw, ShieldCheck } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DisclaimerNote } from "@/registry/super-ai/disclaimer-note";

/**
 * Voice Clone Recorder — Guided sample recording
 *
 * Catalog: docs/design-system/catalog.md, row E10 — restored under D12 (see
 * docs/design-system/decisions.md §D12 and gaps.md R7). component-specs.md
 * has no prose section for E10 (only E1–E8 do); this file is built from the
 * catalog row, gaps.md R7 and D12's restoration note. See this build's report
 * for what that means for `evidence` below.
 *
 * States: prompt-script · level-metering · retake · consent-capture
 *
 * `consent-capture` is the reason this component exists (gaps.md R7:
 * "Consent capture belongs in the flow, not in settings"), so it is built as
 * a hard gate rather than a fourth peer state:
 * - It renders as an AlertDialog, not inline content, so it interrupts the
 *   flow instead of sitting beside it.
 * - The checkbox is never pre-checkable — there is no `consented` /
 *   `defaultConsented` prop. It is local, unexported state that starts at
 *   `false` every time this state is entered, because the component
 *   unmounts the dialog whenever `state` moves away from
 *   "consent-capture" (see the conditional in `VoiceCloneRecorder` below).
 * - `onConsent` — the only callback that signals "go ahead and clone this
 *   voice" — fires exclusively from the confirm button, which stays
 *   `disabled` until the checkbox is checked. `onAcceptTake` (fired from
 *   "Use this take" in `retake`) carries no payload and cannot substitute
 *   for it. A consumer who wires only the "happy path" callbacks —
 *   start → stop → accept take — still cannot reach `onConsent` without a
 *   user checking the box in this dialog first; there is no shortcut prop.
 *
 * The level meter (Progress) is deliberately not the only evidence that
 * recording is happening: a `role="status"` text announcement fires once on
 * entering "level-metering", the elapsed time is always visible as text, and
 * the meter's value is echoed as a numeric label next to the bar — never
 * conveyed by bar colour or fill alone. The recording indicator dot is
 * `aria-hidden`; the text next to it is what actually carries the state.
 *
 * The script is always real text (`script: string | string[]`), never an
 * image — a screen reader and a copy/paste both need it to be text.
 */

type VoiceCloneRecorderState = "prompt-script" | "level-metering" | "retake" | "consent-capture";

interface VoiceCloneRecorderConsentInfo {
  /** ISO timestamp captured the moment the confirm button is pressed. */
  consentedAt: string;
}

interface VoiceCloneRecorderProps extends React.ComponentProps<"div"> {
  /** Declared state, following the feedback/promo-card convention: this component only renders the state it's given. */
  state?: VoiceCloneRecorderState;
  /** The line(s) read aloud. Always plain text — never an image, so it stays readable and copyable. */
  script: string | string[];
  /** Which line of a multi-line script is active. Ignored for a single string. */
  currentLine?: number;
  /** Whose voice this is, used in the consent statement ("Jamie's explicit, informed permission…"). */
  speakerName?: string;
  /** Live meter amplitude, 0–100, supplied by the consumer's own audio analysis while recording. */
  level?: number;
  /** Elapsed recording time, pre-formatted (e.g. "0:07"). Shown as text beside the recording indicator. */
  elapsedLabel?: string;
  /** Playable URL for the take under review in "retake". Omit to show only `takeSummary`. */
  takeUrl?: string;
  /** Human summary of the take (e.g. duration), shown next to the player. */
  takeSummary?: string;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  /** Discards the take and returns to recording — carries no data forward. */
  onRetake?: () => void;
  /** Moves from "retake" into the consent gate. Never a substitute for `onConsent`. */
  onAcceptTake?: () => void;
  /** Fired when the consent dialog is backed out of (Cancel, Escape, outside click) without consenting. */
  onConsentCancel?: () => void;
  /** The only signal that it's safe to proceed to actually cloning the voice. */
  onConsent?: (info: VoiceCloneRecorderConsentInfo) => void;
  startLabel?: string;
  stopLabel?: string;
  retakeLabel?: string;
  acceptLabel?: string;
  consentTitle?: string;
  consentConfirmLabel?: string;
  consentCancelLabel?: string;
  /** Overrides the built-in trust footnote. Pass `null` to omit it (not recommended). */
  disclaimer?: React.ReactNode;
}

function clampLevel(level: number) {
  return Math.max(0, Math.min(100, Math.round(level)));
}

function ScriptText({ script, currentLine = 0 }: { script: string | string[]; currentLine?: number }) {
  if (Array.isArray(script)) {
    const line = script[currentLine] ?? script[0] ?? "";
    return (
      <div data-slot="voice-clone-recorder-script" className="flex flex-col gap-1.5">
        <p className="text-muted-foreground text-xs font-medium">
          Line {Math.min(currentLine, script.length - 1) + 1} of {script.length}
        </p>
        <p className="text-foreground text-base leading-relaxed">{line}</p>
      </div>
    );
  }
  return (
    <p data-slot="voice-clone-recorder-script" className="text-foreground text-base leading-relaxed">
      {script}
    </p>
  );
}

function VoiceCloneRecorderConsentDialog({
  speakerName,
  consentTitle = "Consent to clone this voice",
  consentConfirmLabel = "Confirm & clone voice",
  consentCancelLabel = "Back",
  disclaimer,
  onConsentCancel,
  onConsent,
}: Pick<
  VoiceCloneRecorderProps,
  "speakerName" | "consentTitle" | "consentConfirmLabel" | "consentCancelLabel" | "disclaimer" | "onConsentCancel" | "onConsent"
>) {
  // Local and unexported on purpose: there is no `consented`/`defaultConsented`
  // prop that would let a consumer pre-check this from outside. It also
  // starts fresh every time, since the parent unmounts this dialog whenever
  // `state` isn't "consent-capture" — there is no way to arrive here already
  // checked.
  const [checked, setChecked] = React.useState(false);
  const checkboxId = React.useId();
  const who = speakerName ?? "this person";

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        // Escape and outside-click both count as backing out, same as Cancel —
        // none of the three can silently count as consent.
        if (!open) onConsentCancel?.();
      }}
    >
      <AlertDialogContent data-slot="voice-clone-recorder-consent">
        <AlertDialogHeader>
          <AlertDialogTitle>{consentTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            This creates an AI model that can generate new speech in {who}&apos;s voice from this recording. It
            must not proceed without {who}&apos;s own, specific permission — not a general terms-of-service
            acceptance.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <label
          htmlFor={checkboxId}
          data-slot="voice-clone-recorder-consent-checkbox-label"
          className="flex items-start gap-2.5 rounded-lg border p-3 text-sm"
        >
          <Checkbox
            id={checkboxId}
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
            data-slot="voice-clone-recorder-consent-checkbox"
            className="mt-0.5"
          />
          <span>
            I have {who}&apos;s explicit, informed permission to record this sample and create an AI clone of
            their voice.
          </span>
        </label>

        {disclaimer === null ? null : (
          disclaimer ?? (
            <DisclaimerNote variant="in-card" data-slot="voice-clone-recorder-disclaimer">
              Voice clones can convincingly imitate someone without their knowledge. Consent has to come from{" "}
              {who} — never from whoever happens to be holding the microphone.
            </DisclaimerNote>
          )
        )}

        <AlertDialogFooter>
          <AlertDialogCancel data-slot="voice-clone-recorder-consent-cancel">{consentCancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            data-slot="voice-clone-recorder-consent-confirm"
            disabled={!checked}
            onClick={() => onConsent?.({ consentedAt: new Date().toISOString() })}
          >
            <ShieldCheck aria-hidden /> {consentConfirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function VoiceCloneRecorder({
  state = "prompt-script",
  script,
  currentLine = 0,
  speakerName,
  level = 0,
  elapsedLabel,
  takeUrl,
  takeSummary,
  onStartRecording,
  onStopRecording,
  onRetake,
  onAcceptTake,
  onConsentCancel,
  onConsent,
  startLabel = "Start recording",
  stopLabel = "Stop recording",
  retakeLabel = "Retake",
  acceptLabel = "Use this take",
  consentTitle,
  consentConfirmLabel,
  consentCancelLabel,
  disclaimer,
  className,
  ...props
}: VoiceCloneRecorderProps) {
  const clampedLevel = clampLevel(level);

  return (
    <div
      data-slot="voice-clone-recorder"
      data-state={state}
      className={cn("flex w-full max-w-md flex-col gap-4", className)}
      {...props}
    >
      {state === "prompt-script" ? (
        <>
          <ScriptText script={script} currentLine={currentLine} />
          <Button
            type="button"
            data-slot="voice-clone-recorder-start"
            className="self-start"
            onClick={() => onStartRecording?.()}
          >
            <Mic aria-hidden /> {startLabel}
          </Button>
        </>
      ) : null}

      {state === "level-metering" ? (
        <>
          <ScriptText script={script} currentLine={currentLine} />

          {/* The dot is aria-hidden — it's a sighted-only accent. "Recording" is
              the actual signal, announced once via role="status" the moment
              this state mounts, with elapsed time always visible as text
              beside it rather than folded into the live region (which would
              re-announce every tick). */}
          <div className="text-destructive flex items-center gap-2 text-sm font-medium">
            <span aria-hidden="true" className="bg-destructive size-2 shrink-0 animate-pulse rounded-full" />
            <span role="status" aria-live="polite" data-slot="voice-clone-recorder-status">
              Recording
            </span>
            {elapsedLabel ? (
              <span data-slot="voice-clone-recorder-elapsed" className="text-muted-foreground tabular-nums">
                {elapsedLabel}
              </span>
            ) : null}
          </div>

          <div data-slot="voice-clone-recorder-meter" className="flex flex-col gap-1">
            <Progress value={clampedLevel}>
              <div className="flex items-center justify-between gap-2">
                <ProgressLabel className="text-muted-foreground text-xs">Input level</ProgressLabel>
                {/* The bar's fill is never the only readout of the value — this
                    text mirrors the same number for sighted users, on top of
                    the progressbar's own programmatic aria-valuenow/valuetext. */}
                <span
                  data-slot="voice-clone-recorder-meter-value"
                  className="text-muted-foreground text-xs tabular-nums"
                >
                  {clampedLevel}%
                </span>
              </div>
            </Progress>
          </div>

          <Button
            type="button"
            variant="outline"
            data-slot="voice-clone-recorder-stop"
            className="self-start"
            onClick={() => onStopRecording?.()}
          >
            <Pause aria-hidden /> {stopLabel}
          </Button>
        </>
      ) : null}

      {state === "retake" ? (
        <>
          <span role="status" aria-live="polite" className="sr-only">
            Recording stopped. Review your take before continuing.
          </span>

          <div data-slot="voice-clone-recorder-playback" className="flex flex-col gap-2">
            {takeUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption -- a spoken voice sample has no track to caption
              <audio data-slot="voice-clone-recorder-audio" controls src={takeUrl} className="w-full" />
            ) : null}
            {takeSummary ? <p className="text-muted-foreground text-xs">{takeSummary}</p> : null}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              data-slot="voice-clone-recorder-retake"
              onClick={() => onRetake?.()}
            >
              <RotateCcw aria-hidden /> {retakeLabel}
            </Button>
            {/* Deliberately not the callback that can trigger cloning — see the
                file-level comment. This only advances to the consent gate. */}
            <Button type="button" data-slot="voice-clone-recorder-accept" onClick={() => onAcceptTake?.()}>
              <Check aria-hidden /> {acceptLabel}
            </Button>
          </div>
        </>
      ) : null}

      {state === "consent-capture" ? (
        <VoiceCloneRecorderConsentDialog
          speakerName={speakerName}
          consentTitle={consentTitle}
          consentConfirmLabel={consentConfirmLabel}
          consentCancelLabel={consentCancelLabel}
          disclaimer={disclaimer}
          onConsentCancel={onConsentCancel}
          onConsent={onConsent}
        />
      ) : null}
    </div>
  );
}

export { VoiceCloneRecorder };
export type { VoiceCloneRecorderConsentInfo, VoiceCloneRecorderProps, VoiceCloneRecorderState };
