"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Channel = "app" | "push" | "chat" | "email" | "phone";
type MessageKind = "ask" | "due" | "ready" | "receipt" | "notice";
type ChannelMessageState =
  | "pending"
  | "sent"
  | "answered"
  | "withdrawn"
  | "expired"
  | "failed-check"
  | "not-routed";

interface ChannelMessageData {
  kind: MessageKind;
  /** The sender. One identity across every channel. */
  from: string;
  /** The message itself. Plain words; the render never rewrites it. */
  what: string;
  /** At most one question. Empty for `ready`, `receipt` and `notice`. */
  ask?: string;
  /** Closed answers to the ask. Each channel shows its first N and says how many more are in the app. */
  options?: string[];
  /** Where the app holds the full record. Rendered as a label, never as a live link. */
  link: string;
  /** When an `ask` or `due` stops being answerable. Printed as given. */
  expires?: string;
  /** The label of the way to stop these messages. Every channel carries it. */
  quiet: string;
  /** Who takes over and when the person hears from them. */
  handoff?: string;
  /** What a second recipient reads instead of `what`: status and next step, no detail. */
  summary?: string;
}

interface ChannelMessageProps extends Omit<React.ComponentProps<"article">, "children"> {
  channel: Channel;
  message: ChannelMessageData;
  state: ChannelMessageState;
  /** The second recipient gets `summary` and none of the ask. */
  to?: "member" | "second";
  /** A line the channel always carries, such as what the sender never asks for. */
  trust?: string;
  /** `large` switches the render to the larger type scale. */
  typeSize?: "default" | "large";
  /** `slow` makes the phone script state the key fact twice. */
  pace?: "default" | "slow";
  /** Push only. The lock screen shows who and what kind, and nothing else. Defaults to true. */
  locked?: boolean;
  /** How the text was produced. */
  path?: "code" | "live" | "fallback";
  /** The value that answered, shown in place of the controls once `state` is `answered`. */
  answer?: string;
  /** Why the state is what it is, in words. */
  reason?: string;
  /** Present: options are buttons while the message is `sent`. Absent: options are inert text. */
  onAnswer?: (value: string) => void;
}

/**
 * Caps per channel. Options past the cap are not dropped silently: the render says how many more
 * are in the app. Phone has no stated cap in the spec; it takes the app's five.
 */
const OPTION_CAP: Record<Channel, number> = { app: 5, push: 3, chat: 5, email: 1, phone: 5 };

const STATE_WORD: Record<ChannelMessageState, string> = {
  pending: "Pending",
  sent: "Sent",
  answered: "Answered",
  withdrawn: "Withdrawn",
  expired: "Expired",
  "failed-check": "Failed check",
  "not-routed": "Not routed",
};

const CHANNEL_WORD: Record<Channel, string> = {
  app: "App",
  push: "Push",
  chat: "Chat",
  email: "Email",
  phone: "Phone",
};

const PATH_WORD: Record<NonNullable<ChannelMessageProps["path"]>, string> = {
  code: "Written by code",
  live: "Written live",
  fallback: "Fallback template",
};

/** What the lock screen says in place of the message: sender, then this phrase. */
const KIND_PHRASE: Record<MessageKind, string> = {
  ask: "has a check-in",
  due: "has something due",
  ready: "has something ready",
  receipt: "saved something",
  notice: "has a notice",
};

const KIND_WORD: Record<MessageKind, string> = {
  ask: "Ask",
  due: "Due",
  ready: "Ready",
  receipt: "Receipt",
  notice: "Notice",
};

/**
 * Hierarchy comes from size and weight, never from `text-muted-foreground`: several frames below
 * paint `bg-muted`, and that pair measures 4.34:1.
 */
function typeScale(large: boolean) {
  return large
    ? { what: "text-lg font-medium", body: "text-base", small: "text-base", button: "min-h-9 px-3 text-base" }
    : { what: "text-sm font-medium", body: "text-sm", small: "text-xs", button: "" };
}

type Scale = ReturnType<typeof typeScale>;

interface OptionsProps {
  channel: Channel;
  options: string[];
  /** Phone options are read aloud with a keypad digit. */
  spoken?: boolean;
  answerable: boolean;
  onAnswer?: (value: string) => void;
  scale: Scale;
  className?: string;
}

function Options({ channel, options, spoken, answerable, onAnswer, scale, className }: OptionsProps) {
  const shown = options.slice(0, OPTION_CAP[channel]);
  const more = options.length - shown.length;
  const label = (option: string, index: number) => (spoken ? `Press ${index + 1} for ${option}` : option);
  const itemClass = cn("min-w-0 break-words", scale.button);
  return (
    <div data-slot="channel-message-options" className={cn("flex flex-col gap-1.5", className)}>
      <ul className={cn("flex min-w-0 list-none flex-wrap gap-1.5 p-0", spoken && "flex-col")}>
        {shown.map((option, index) => (
          <li key={option} className="min-w-0 max-w-full">
            {answerable && onAnswer ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("h-auto min-h-7 whitespace-normal py-1", itemClass)}
                onClick={() => onAnswer(option)}
              >
                {label(option, index)}
              </Button>
            ) : (
              <span
                className={cn(
                  itemClass,
                  "inline-flex min-h-7 items-center rounded-lg border border-border bg-background px-2.5 py-1 text-foreground",
                  scale.button ? "" : "text-xs",
                )}
              >
                {label(option, index)}
              </span>
            )}
          </li>
        ))}
      </ul>
      {more > 0 && (
        <p data-slot="channel-message-overflow" className={cn(scale.small, "text-foreground")}>
          and {more} more in the app
        </p>
      )}
    </div>
  );
}

/**
 * One message drawn in the shape of the channel it is sent on.
 *
 * Spec: docs/design-system/component-specs.md#s1-channel-message
 * States: pending · sent · answered · withdrawn · expired · failed-check · not-routed
 */
function ChannelMessage({
  channel,
  message,
  state,
  to = "member",
  trust,
  typeSize = "default",
  pace = "default",
  locked = true,
  path,
  answer,
  reason,
  onAnswer,
  className,
  ...props
}: ChannelMessageProps) {
  const scale = typeScale(typeSize === "large");
  const second = to === "second";
  // A failed check sends the template of the same kind, so the person has a copy to answer.
  const answerable = state === "sent" || state === "failed-check";
  const options = !second && message.options?.length ? message.options : undefined;
  const ask = second ? undefined : message.ask;
  const handoff = second ? undefined : message.handoff;
  const body = second ? message.summary : message.what;
  const lockPhrase = `${message.from} ${KIND_PHRASE[message.kind]}`;

  // Focus follows the controls: when the message becomes `answered` after it was shown, the result
  // takes focus, since the button the person pressed has just left the page. On first render it
  // does not, so a page of answered messages never steals focus on load.
  const rootRef = React.useRef<HTMLElement>(null);
  const answerRef = React.useRef<HTMLParagraphElement>(null);
  const previousState = React.useRef(state);
  React.useEffect(() => {
    if (previousState.current !== "answered" && state === "answered") {
      // Only when focus was on the message (the pressed button just left) or nowhere. A caller that
      // sets `answered` from its own Step or Play control keeps focus on that control.
      const active = document.activeElement;
      if (!active || active === document.body || rootRef.current?.contains(active))
        answerRef.current?.focus();
    }
    previousState.current = state;
  }, [state]);

  const showAnswer = state === "answered" && (answer !== undefined || options !== undefined);

  const optionList = options ? (
    showAnswer ? null : (
      <Options
        channel={channel}
        options={options}
        spoken={channel === "phone"}
        answerable={answerable}
        onAnswer={onAnswer}
        scale={scale}
      />
    )
  ) : null;

  const answerLine = showAnswer ? (
    <p
      ref={answerRef}
      tabIndex={-1}
      data-slot="channel-message-answer"
      className={cn(
        scale.body,
        "font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      )}
    >
      {answer !== undefined ? `Answered: ${answer}` : "Answered"}
    </p>
  ) : null;

  const fromLine = (
    <span
      data-slot="channel-message-from"
      className={cn(scale.body, "min-w-0 break-words font-semibold text-foreground")}
    >
      {message.from}
    </span>
  );

  const kindBadge = (
    <Badge variant="secondary" data-slot="channel-message-kind">
      {KIND_WORD[message.kind]}
    </Badge>
  );

  const whatLine = body ? (
    <p data-slot="channel-message-what" className={cn(scale.what, "min-w-0 break-words text-foreground")}>
      {body}
    </p>
  ) : (
    // A second recipient with no summary still learns what kind of message it is, and nothing else.
    <p data-slot="channel-message-what" className={cn(scale.what, "min-w-0 break-words text-foreground")}>
      {lockPhrase}
    </p>
  );

  const askLine = ask ? (
    <p data-slot="channel-message-ask" className={cn(scale.body, "min-w-0 break-words text-foreground")}>
      {ask}
    </p>
  ) : null;

  const expiresLine = message.expires ? (
    <p className={cn(scale.small, "text-foreground")}>Expires {message.expires}</p>
  ) : null;

  const handoffLine = handoff ? (
    <p data-slot="channel-message-handoff" className={cn(scale.small, "min-w-0 break-words text-foreground")}>
      {handoff}
    </p>
  ) : null;

  const linkLabel = (
    <span data-slot="channel-message-link" data-link={message.link} className="min-w-0 break-words">
      Open in the app
    </span>
  );

  const quiet = (prefix?: string) => (
    <p data-slot="channel-message-quiet" className={cn(scale.small, "min-w-0 break-words text-foreground")}>
      {prefix}
      {message.quiet}
    </p>
  );

  let frame: React.ReactNode;
  if (state === "not-routed") {
    // Nothing was sent on this channel, so there is no shape to draw. The state and its reason are
    // the whole render; the footer below carries them.
    frame = (
      <p className={cn(scale.body, "text-foreground")}>
        Nothing was sent on {CHANNEL_WORD[channel].toLowerCase()}.
      </p>
    );
  } else if (channel === "app") {
    frame = (
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {fromLine}
          {kindBadge}
        </div>
        <div className="flex min-w-0 flex-col gap-2 rounded-2xl rounded-ss-sm bg-muted px-3 py-2.5 text-foreground">
          {whatLine}
          {askLine}
          {expiresLine}
          {answerLine}
          {optionList}
        </div>
        {handoffLine}
        {quiet("Dismiss: ")}
      </div>
    );
  } else if (channel === "push") {
    frame = (
      <Card size="sm" className="min-w-0 gap-2 px-3 text-foreground">
        <div className="flex flex-wrap items-baseline gap-x-2">
          {fromLine}
          {locked && (
            <span data-slot="channel-message-kind" className={cn(scale.body, "text-foreground")}>
              {KIND_PHRASE[message.kind]}
            </span>
          )}
        </div>
        {!locked && (
          <>
            {whatLine}
            {askLine}
            {expiresLine}
            {answerLine}
            {optionList}
            {handoffLine}
            <p className={cn(scale.small, "text-foreground")}>
              <span data-slot="channel-message-link" data-link={message.link}>
                Tap to open in the app
              </span>
            </p>
            {quiet("Action: ")}
          </>
        )}
      </Card>
    );
  } else if (channel === "chat") {
    frame = (
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {fromLine}
          {kindBadge}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 rounded-2xl rounded-ss-sm bg-muted px-3 py-2.5 text-foreground">
          {whatLine}
          {askLine}
          {expiresLine}
          {handoffLine}
        </div>
        {answerLine}
        {optionList}
        <p className={cn(scale.small, "text-foreground")}>[ {linkLabel} ]</p>
        {quiet("/quiet: ")}
      </div>
    );
  } else if (channel === "email") {
    frame = (
      <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background px-4 py-3 text-foreground">
        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
          <span className={cn(scale.small, "text-foreground")}>From</span>
          {fromLine}
          {kindBadge}
        </div>
        {/* Subject is `what`; the first line under it is the ask, or the deadline when there is none. */}
        {whatLine}
        {askLine ?? expiresLine}
        {askLine && expiresLine}
        {handoffLine}
        {answerLine}
        {optionList}
        <p className={cn(scale.small, "text-foreground")}>{linkLabel}</p>

        <div className="border-t border-border pt-2">{quiet("Footer link: ")}</div>
      </div>
    );
  } else {
    const repeat = pace === "slow";
    frame = (
      <div
        data-slot="channel-message-script"
        className="flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-background px-4 py-3 text-foreground"
      >
        <p className={cn(scale.small, "font-semibold text-foreground")}>Phone script</p>
        <p className={scale.body}>This is {message.from}.</p>
        {trust && (
          <p data-slot="channel-message-trust" className={scale.body}>
            {trust}
          </p>
        )}
        <p className={cn(scale.body, "break-words")}>{body ?? lockPhrase}</p>
        {repeat && <p className={cn(scale.body, "break-words")}>{body ?? lockPhrase}</p>}
        {ask && <p className={cn(scale.body, "break-words")}>{ask}</p>}
        {answerLine}
        {optionList}
        {expiresLine}
        {handoff && <p className={cn(scale.body, "break-words")}>{handoff}</p>}
        <p className={scale.body}>It is in your app too.</p>
        <p data-slot="channel-message-quiet" className={cn(scale.body, "break-words")}>
          {message.quiet}: say &quot;stop&quot;.
        </p>
      </div>
    );
  }

  return (
    <article
      ref={rootRef}
      data-slot="channel-message"
      data-channel={channel}
      data-state={state}
      aria-label={`${CHANNEL_WORD[channel]} message from ${message.from}`}
      className={cn("flex w-full min-w-0 max-w-md flex-col gap-2", className)}
      {...props}
    >
      {frame}
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {/* The state is always a word. `role="status"` announces it when it changes. */}
        <span role="status" className="inline-flex">
          <Badge variant="outline" data-slot="channel-message-state">
            {STATE_WORD[state]}
          </Badge>
        </span>
        {path && (
          <span data-slot="channel-message-path" className={cn(scale.small, "text-foreground")}>
            {PATH_WORD[path]}
          </span>
        )}
        {reason && (
          <span
            data-slot="channel-message-reason"
            className={cn(scale.small, "min-w-0 break-words text-foreground")}
          >
            {reason}
          </span>
        )}
      </div>
      {trust && channel !== "phone" && (
        <p
          data-slot="channel-message-trust"
          className={cn(scale.small, "min-w-0 break-words text-foreground")}
        >
          {trust}
        </p>
      )}
    </article>
  );
}

export { ChannelMessage };
export type { Channel, ChannelMessageData, ChannelMessageProps, ChannelMessageState, MessageKind };
