"use client";

import * as React from "react";
import { Unplug, VenetianMask } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntityRow } from "@/registry/super-ai/entity-row";

/**
 * Private Session Notice — Incognito mode: the fixed statement, the persistent chip, and what is switched off.
 *
 * Spec: docs/design-system/component-specs.md#n15-private-session-notice
 * States: entering · active · connectors-reduced · exiting · unavailable
 */
type PrivateSessionState = "entering" | "active" | "connectors-reduced" | "exiting" | "unavailable";
type PrivateSessionForm = "banner" | "chip";

/** `off` = the connector does not run at all; `reduced` = it runs with narrower scope. */
type ConnectorScope = "off" | "reduced";

interface PrivateSessionConnector {
  name: string;
  scope: ConnectorScope;
  /** What the reduced scope still allows, e.g. "Read-only, no history". Optional. */
  detail?: string;
  icon?: React.ReactNode;
}

/** The three retention shapes: deleted now, deleted after a period, kept locally. */
type PrivateSessionRetention =
  | { kind: "deleted-now"; detail?: string }
  | { kind: "deleted-after"; period: string; detail?: string }
  | { kind: "kept-locally"; detail?: string };

type PrivateSessionUnavailableReason = "plan" | "admin";

const CHIP_LABEL: Record<PrivateSessionState, string> = {
  entering: "Private session",
  active: "Private session",
  "connectors-reduced": "Private session, connectors reduced",
  exiting: "Ending private session",
  unavailable: "Private session unavailable",
};

const SCOPE_LABEL: Record<ConnectorScope, string> = { off: "Off", reduced: "Reduced" };

const UNAVAILABLE_REASON: Record<PrivateSessionUnavailableReason, string> = {
  plan: "Private sessions are not included in your plan.",
  admin: "Your administrator has turned off private sessions.",
};

function retentionText(retention: PrivateSessionRetention): string {
  if (retention.detail) return retention.detail;
  switch (retention.kind) {
    case "deleted-now":
      return "This session is deleted now.";
    case "deleted-after":
      return `This session is deleted after ${retention.period}.`;
    case "kept-locally":
      return "This session is kept on this device only.";
  }
}

interface PrivateSessionChipProps extends Omit<React.ComponentProps<"span">, "children"> {
  /** Which moment of the session the chip marks. */
  state?: PrivateSessionState;
  /** Overrides the English label for the state. */
  label?: string;
  /** Present when the chip opens the statement. It then renders as a button. */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

/**
 * The persistent indicator. A host hands this to B7 `app-topbar`'s privacy slot.
 * It has no close control and no timer: it stays for the whole session.
 */
function PrivateSessionChip({
  state = "active",
  label,
  onClick,
  className,
  ...props
}: PrivateSessionChipProps) {
  const unavailable = state === "unavailable";
  const content = (
    <>
      {unavailable ? (
        <Unplug aria-hidden="true" data-slot="private-session-chip-icon" />
      ) : (
        <VenetianMask aria-hidden="true" data-slot="private-session-chip-icon" />
      )}
      <span data-slot="private-session-chip-label">{label ?? CHIP_LABEL[state]}</span>
    </>
  );
  const chipClassName = cn(
    // The shape carries the state alongside colour: unavailable gets a dashed
    // border, and every state has its own words in the label.
    "h-6 gap-1.5 px-2.5",
    unavailable && "border-dashed",
    onClick && "cursor-pointer",
    className,
  );
  const variant = unavailable ? "outline" : state === "exiting" ? "secondary" : "default";

  if (onClick) {
    return (
      <Badge
        render={<button type="button" onClick={onClick} />}
        variant={variant}
        className={chipClassName}
        data-slot="private-session-chip"
        data-state={state}
        {...props}
      >
        {content}
      </Badge>
    );
  }
  return (
    <Badge
      variant={variant}
      className={chipClassName}
      data-slot="private-session-chip"
      data-state={state}
      {...props}
    >
      {content}
    </Badge>
  );
}

interface PrivateSessionNoticeBase {
  /**
   * The fixed sentence: what is and is not remembered. Required, no default —
   * this component must not claim more than the host enforces.
   */
  statement: React.ReactNode;
  /** `banner` is the statement block; `chip` is the persistent topbar indicator. */
  form?: PrivateSessionForm;
  /** Heading of the banner. Defaults per state. */
  title?: string;
  /** Label of the on-demand control in `active` and `connectors-reduced`. */
  statementToggleLabel?: string;
}

type PrivateSessionNoticeProps = Omit<React.ComponentProps<"div">, "children" | "title"> &
  PrivateSessionNoticeBase &
  (
    | { state: "entering" | "active" }
    | { state: "connectors-reduced"; connectors: readonly PrivateSessionConnector[] }
    | { state: "exiting"; retention: PrivateSessionRetention }
    | {
        state: "unavailable";
        /** Why the mode is off. Unknown to this component, so the host must say. */
        reason: PrivateSessionUnavailableReason;
        /** Replaces the default sentence for the reason. */
        reasonText?: string;
        /** Optional next step, e.g. a link to plan settings. */
        action?: React.ReactNode;
      }
  );

const DEFAULT_TITLE: Record<PrivateSessionState, string> = {
  entering: "This is a private session",
  active: "Private session",
  "connectors-reduced": "Connectors in this private session",
  exiting: "Ending this private session",
  unavailable: "Private session unavailable",
};

function PrivateSessionNotice(props: PrivateSessionNoticeProps) {
  const {
    statement,
    form = "banner",
    title,
    statementToggleLabel = "What a private session keeps",
    state,
    className,
    ...rest
  } = props;
  // Each state's own props are read off the union and kept out of the div spread.
  const connectors = "connectors" in props ? props.connectors : undefined;
  const retention = "retention" in props ? props.retention : undefined;
  const reason = "reason" in props ? props.reason : undefined;
  const reasonText = "reasonText" in props ? props.reasonText : undefined;
  const action = "action" in props ? props.action : undefined;
  const divProps = { ...rest } as Record<string, unknown>;
  for (const key of ["connectors", "retention", "reason", "reasonText", "action"]) delete divProps[key];

  const [statementOpen, setStatementOpen] = React.useState(false);
  const statementId = React.useId();
  const heading = title ?? DEFAULT_TITLE[state];

  if (form === "chip") {
    return (
      <PrivateSessionChip
        state={state}
        className={className}
        {...(divProps as React.ComponentProps<"span">)}
      />
    );
  }

  // `text-start` on every Alert: the vendored Alert hard-codes `text-left`,
  // which pins the statement to the physical left under `dir="rtl"`.
  const statementAlert = (
    <Alert
      // Not `alert`: a persistent statement is not urgent, and an assertive
      // live region would interrupt a screen-reader user on every mount.
      role="note"
      id={statementId}
      data-slot="private-session-statement"
      className="text-start"
    >
      <VenetianMask aria-hidden="true" />
      <AlertTitle>{heading}</AlertTitle>
      {/* text-foreground: the statement is the whole point, so it is never muted. */}
      <AlertDescription className="text-foreground">{statement}</AlertDescription>
    </Alert>
  );

  const onDemand = (
    <div data-slot="private-session-controls" className="flex flex-wrap items-center gap-2">
      <PrivateSessionChip state={state} />
      <Button
        type="button"
        variant="ghost"
        size="xs"
        aria-expanded={statementOpen}
        aria-controls={statementOpen ? statementId : undefined}
        onClick={() => setStatementOpen((open) => !open)}
      >
        {statementToggleLabel}
      </Button>
    </div>
  );

  let body: React.ReactNode;
  switch (state) {
    case "entering":
      body = statementAlert;
      break;
    case "active":
      body = (
        <>
          {onDemand}
          {statementOpen ? statementAlert : null}
        </>
      );
      break;
    case "connectors-reduced":
      body = (
        <>
          {onDemand}
          {statementOpen ? statementAlert : null}
          <Alert role="note" data-slot="private-session-connectors" className="text-start">
            <VenetianMask aria-hidden="true" />
            <AlertTitle>{heading}</AlertTitle>
            {/* min-w-0: the Alert body is a grid item, whose automatic minimum is the
                min-content of A9's non-wrapping (truncating) title, so without it a long
                connector name widens the whole notice past its container. */}
            <AlertDescription className="text-foreground min-w-0">
              <ul className="flex flex-col">
                {(connectors ?? []).map((connector) => (
                  <li key={connector.name}>
                    <EntityRow
                      data-scope={connector.scope}
                      icon={connector.icon}
                      title={<span title={connector.name}>{connector.name}</span>}
                      description={connector.detail}
                      trailing={
                        <Badge variant={connector.scope === "off" ? "outline" : "secondary"}>
                          {SCOPE_LABEL[connector.scope]}
                        </Badge>
                      }
                    />
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </>
      );
      break;
    case "exiting":
      body = (
        <Alert role="status" data-slot="private-session-exit" className="text-start">
          <VenetianMask aria-hidden="true" />
          <AlertTitle>{heading}</AlertTitle>
          <AlertDescription className="text-foreground">
            {retention ? retentionText(retention) : null}
          </AlertDescription>
        </Alert>
      );
      break;
    case "unavailable":
      body = (
        <Alert role="note" data-slot="private-session-unavailable" className="text-start">
          <Unplug aria-hidden="true" />
          <AlertTitle>{heading}</AlertTitle>
          <AlertDescription className="text-foreground">
            <p>{reasonText ?? (reason ? UNAVAILABLE_REASON[reason] : null)}</p>
            {action ? <div className="mt-2">{action}</div> : null}
          </AlertDescription>
        </Alert>
      );
      break;
  }

  return (
    <div
      data-slot="private-session-notice"
      data-state={state}
      data-form={form}
      className={cn("flex w-full flex-col gap-2", className)}
      {...(divProps as React.ComponentProps<"div">)}
    >
      {body}
    </div>
  );
}

export { PrivateSessionNotice, PrivateSessionChip };
export type {
  PrivateSessionChipProps,
  PrivateSessionConnector,
  PrivateSessionForm,
  PrivateSessionNoticeProps,
  PrivateSessionRetention,
  PrivateSessionState,
  PrivateSessionUnavailableReason,
};
