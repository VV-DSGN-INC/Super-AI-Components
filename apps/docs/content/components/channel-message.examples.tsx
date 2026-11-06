"use client";

import * as React from "react";

import {
  ChannelMessage,
  type ChannelMessageData,
  type ChannelMessageState,
} from "@/registry/super-ai/channel-message";

/**
 * Live examples for channel-message.docs.tsx.
 *
 * This is a client sidecar on purpose: the docs module is read by a Server
 * Component and cannot carry "use client" or an event handler. Every example
 * that needs `onAnswer` lives here and crosses into the docs module as a
 * zero-prop element.
 */

const CHECK_IN: ChannelMessageData = {
  kind: "ask",
  from: "Dr O'Body",
  what: "Your blood pressure reading is due.",
  ask: "How did it go today?",
  options: ["Fine", "Not great", "Skip today"],
  link: "lifeos://vitals/7",
  expires: "Fri 18:00",
  quiet: "Stop asking",
};

const WEEKLY_REVIEW: ChannelMessageData = {
  kind: "ready",
  from: "Lifey",
  what: "Your Weekly Review is ready.",
  link: "lifeos://review/42",
  quiet: "Stop asking",
};

/** The caller owns the state: pressing an option reports the value, and the caller sets `answered`. */
export function AnswerReplacesTheButtons() {
  const [state, setState] = React.useState<ChannelMessageState>("sent");
  const [answer, setAnswer] = React.useState<string>();
  return (
    <ChannelMessage
      channel="chat"
      message={CHECK_IN}
      state={state}
      answer={answer}
      onAnswer={(value) => {
        setAnswer(value);
        setState("answered");
      }}
    />
  );
}

export function ReadyHasNoQuestion() {
  return <ChannelMessage channel="chat" message={WEEKLY_REVIEW} state="sent" />;
}

export function LockedPushShowsWhoAndWhatKind() {
  return <ChannelMessage channel="push" message={CHECK_IN} state="sent" />;
}

export function NotRoutedSaysWhy() {
  return (
    <ChannelMessage channel="push" message={CHECK_IN} state="not-routed" reason="push was answered first" />
  );
}

export function ReadyThatAsksAQuestion() {
  return (
    <ChannelMessage
      channel="chat"
      message={{ ...WEEKLY_REVIEW, ask: "Want to read it now?", options: ["Now", "Later"] }}
      state="sent"
    />
  );
}

export function SixOptionsOnAPush() {
  return (
    <ChannelMessage
      channel="push"
      locked={false}
      message={{ ...CHECK_IN, options: ["Fine", "Tired", "Dizzy", "Sore", "Anxious", "Skip today"] }}
      state="sent"
    />
  );
}

export function ButtonsThatNeverAnswer() {
  return <ChannelMessage channel="chat" message={CHECK_IN} state="withdrawn" onAnswer={() => {}} />;
}
