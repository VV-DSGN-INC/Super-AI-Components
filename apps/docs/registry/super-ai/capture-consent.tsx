"use client";

import * as React from "react";
import { Mic, MicOff, Square, UserX, Users } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/**
 * Capture Consent — Consent gate before AI capture starts, and the indicator while it runs.
 *
 * Spec: docs/design-system/component-specs.md#n13-capture-consent
 * States: pre-notice · recording · others-notified · declined · ended
 *
 * Consent is a gate, the rule E10 `voice-clone-recorder` lives by:
 * - `onStartCapture` is destructured in `CaptureConsent` and handed to exactly
 *   one child, `PreNotice`. No other state renders a control that can fire it,
 *   so a consumer who wires only the happy-path callbacks cannot start capture
 *   from `recording` or from the compact chip.
 * - Both switches in `PreNotice` are local, unexported state that starts off.
 *   There is no `defaultRecord`/`defaultSharing` prop, and the component
 *   unmounts `PreNotice` whenever `state` moves on, so every visit starts clear.
 * - Recording and sharing are two switches. Neither implies the other.
 * - Training consent is not here. The copy points at the data controls by name
 *   only; the component imports nothing from that surface.
 *
 * One `role="status"` element persists across every state of a form, so each
 * state change is announced politely without the live region being mounted at
 * the same instant as its text. It never auto-dismisses, and nothing in the
 * component animates on its own account.
 */

type CaptureConsentState = "pre-notice" | "recording" | "others-notified" | "declined" | "ended";
type CaptureConsentForm = "compact" | "bar";

interface CaptureConsentStartInfo {
  /** What the initiator chose in the other switch. Recording itself is implied by firing. */
  sharing: boolean;
  /** ISO timestamp captured the moment Start is pressed. */
  startedAt: string;
}

interface CaptureConsentProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Declared state: this component only renders the state it is given. */
  state?: CaptureConsentState;
  /** `compact` is a passive chip for a topbar slot; `bar` owns the capture and its controls. */
  form?: CaptureConsentForm;
  /** Who will be told, in `pre-notice`, and who was told, in `others-notified`. */
  participants?: string[];
  /** Who opted out, shown in `declined`. */
  declinedBy?: string[];
  /** What the initiator can no longer do, in `declined`. Falls back to a plain default. */
  consequence?: string;
  /** What is kept after `ended`. */
  kept?: string;
  /** What is deleted after `ended`. */
  deleted?: string;
  /** Pre-formatted elapsed time while capturing. Visible text only; it is not announced. */
  elapsedLabel?: string;
  /** Whether notes are being shared, while capturing. Controlled; the pre-notice switch is local. */
  sharing?: boolean;
  onSharingChange?: (sharing: boolean) => void;
  /** Name of the surface where training use is set. Named in text, never linked or imported. */
  dataControlsName?: string;
  /** Handed to the `pre-notice` step only. The sole path to starting capture. */
  onStartCapture?: (info: CaptureConsentStartInfo) => void;
  /** Stops capture from the `bar` form. The chip has no control. */
  onStopCapture?: () => void;
}

const SWITCH_MOTION =
  "motion-reduce:transition-none **:data-[slot=switch-thumb]:motion-reduce:transition-none";

function joinNames(names: string[] | undefined, fallback: string) {
  if (!names || names.length === 0) return fallback;
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

const STATUS = {
  "pre-notice": { icon: MicOff, text: "Not recording", chip: "outline" },
  recording: { icon: Mic, text: "Recording", chip: "default" },
  "others-notified": { icon: Users, text: "Recording, others notified", chip: "default" },
  declined: { icon: UserX, text: "Capture declined", chip: "secondary" },
  ended: { icon: Square, text: "Recording stopped", chip: "outline" },
} as const;

/** Visible text and the polite announcement are the same string, plus a verb on start. */
function StatusText({ state }: { state: CaptureConsentState }) {
  const { text } = STATUS[state];
  return (
    <>
      {text}
      {state === "recording" || state === "others-notified" ? (
        <span className="sr-only"> started</span>
      ) : null}
    </>
  );
}

function PreNotice({
  participants,
  dataControlsName,
  onStartCapture,
}: Pick<CaptureConsentProps, "participants" | "dataControlsName" | "onStartCapture">) {
  // Local and unexported on purpose, like E10's checkbox: no prop can pre-set
  // either switch, and the parent unmounts this step whenever `state` moves on.
  const [record, setRecord] = React.useState(false);
  const [share, setShare] = React.useState(false);
  const recordId = React.useId();
  const shareId = React.useId();

  return (
    <div data-slot="capture-consent-pre-notice" className="flex flex-col gap-3">
      <p data-slot="capture-consent-notice" className="text-foreground text-sm">
        Starting capture tells {joinNames(participants, "the other participants")} that this session is being
        recorded.
      </p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span id={recordId} className="text-foreground text-sm">
            Record this session
          </span>
          <Switch
            data-slot="capture-consent-record"
            aria-labelledby={recordId}
            checked={record}
            onCheckedChange={setRecord}
            className={SWITCH_MOTION}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span id={shareId} className="text-foreground text-sm">
            Share notes with participants
          </span>
          <Switch
            data-slot="capture-consent-share"
            aria-labelledby={shareId}
            checked={share}
            onCheckedChange={setShare}
            className={SWITCH_MOTION}
          />
        </div>
      </div>

      <p className="text-foreground text-xs">
        Whether captures are used to train models is set in {dataControlsName ?? "Data controls"}, not here.
      </p>

      <Button
        type="button"
        data-slot="capture-consent-start"
        className="self-start"
        disabled={!record}
        onClick={() => onStartCapture?.({ sharing: share, startedAt: new Date().toISOString() })}
      >
        <Mic aria-hidden /> Start capture
      </Button>
    </div>
  );
}

function Capturing({
  state,
  participants,
  elapsedLabel,
  sharing = false,
  onSharingChange,
  onStopCapture,
}: Pick<
  CaptureConsentProps,
  "participants" | "elapsedLabel" | "sharing" | "onSharingChange" | "onStopCapture"
> & { state: CaptureConsentState }) {
  const shareId = React.useId();
  return (
    <div data-slot="capture-consent-capturing" className="flex flex-col gap-3">
      {state === "others-notified" ? (
        <p data-slot="capture-consent-notified" className="text-foreground text-sm">
          {joinNames(participants, "The other participants")}{" "}
          {participants && participants.length === 1 ? "was" : "were"} told this session is being recorded.
        </p>
      ) : null}
      {elapsedLabel ? (
        <p data-slot="capture-consent-elapsed" className="text-foreground text-sm tabular-nums">
          {elapsedLabel}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <span id={shareId} className="text-foreground text-sm">
          Share notes with participants
        </span>
        <Switch
          data-slot="capture-consent-share"
          aria-labelledby={shareId}
          checked={sharing}
          onCheckedChange={(next) => onSharingChange?.(next)}
          className={SWITCH_MOTION}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        data-slot="capture-consent-stop"
        className="self-start"
        onClick={() => onStopCapture?.()}
      >
        <Square aria-hidden /> Stop capture
      </Button>
    </div>
  );
}

function CaptureConsent({
  state = "pre-notice",
  form = "bar",
  participants,
  declinedBy,
  consequence,
  kept,
  deleted,
  elapsedLabel,
  sharing,
  onSharingChange,
  dataControlsName,
  onStartCapture,
  onStopCapture,
  className,
  ...props
}: CaptureConsentProps) {
  const { icon: Icon, chip } = STATUS[state];

  if (form === "compact") {
    // A chip cannot carry the notice, so the compact pre-notice is passive:
    // `onStartCapture` is deliberately not reachable from here.
    return (
      <div
        data-slot="capture-consent"
        data-state={state}
        data-form="compact"
        className={cn("inline-flex", className)}
        {...props}
      >
        <Badge data-slot="capture-consent-status" role="status" variant={chip}>
          <Icon aria-hidden />
          <StatusText state={state} />
        </Badge>
      </div>
    );
  }

  return (
    <div
      data-slot="capture-consent"
      data-state={state}
      data-form="bar"
      className={cn("w-full max-w-md", className)}
      {...props}
    >
      <Alert role="group" aria-label="Capture consent" className="gap-2">
        <AlertTitle className="flex items-center gap-2">
          <Icon aria-hidden className="size-4 shrink-0" />
          <span data-slot="capture-consent-status" role="status">
            <StatusText state={state} />
          </span>
        </AlertTitle>

        {state === "pre-notice" ? (
          <AlertDescription className="text-foreground">
            <PreNotice
              participants={participants}
              dataControlsName={dataControlsName}
              onStartCapture={onStartCapture}
            />
          </AlertDescription>
        ) : null}

        {state === "recording" || state === "others-notified" ? (
          <AlertDescription className="text-foreground">
            <Capturing
              state={state}
              participants={participants}
              elapsedLabel={elapsedLabel}
              sharing={sharing}
              onSharingChange={onSharingChange}
              onStopCapture={onStopCapture}
            />
          </AlertDescription>
        ) : null}

        {state === "declined" ? (
          <AlertDescription data-slot="capture-consent-declined" className="text-foreground">
            <p>{joinNames(declinedBy, "A participant")} declined.</p>
            <p>{consequence ?? "Capture stays off until everyone who declined agrees to be recorded."}</p>
          </AlertDescription>
        ) : null}

        {state === "ended" ? (
          <AlertDescription className="text-foreground">
            <dl data-slot="capture-consent-ended" className="flex flex-col gap-1">
              {kept ? (
                <div className="flex gap-1">
                  <dt className="font-medium">Kept:</dt>
                  <dd>{kept}</dd>
                </div>
              ) : null}
              {deleted ? (
                <div className="flex gap-1">
                  <dt className="font-medium">Deleted:</dt>
                  <dd>{deleted}</dd>
                </div>
              ) : null}
            </dl>
          </AlertDescription>
        ) : null}
      </Alert>
    </div>
  );
}

export { CaptureConsent };
export type { CaptureConsentForm, CaptureConsentProps, CaptureConsentStartInfo, CaptureConsentState };
