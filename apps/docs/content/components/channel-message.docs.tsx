import type { ComponentDocs } from "@/lib/component-docs";
import {
  AnswerReplacesTheButtons,
  ButtonsThatNeverAnswer,
  LockedPushShowsWhoAndWhatKind,
  NotRoutedSaysWhy,
  ReadyHasNoQuestion,
  ReadyThatAsksAQuestion,
  SixOptionsOnAPush,
} from "./channel-message.examples";

/**
 * Seeded from docs/design-system/component-specs.md#s1-channel-message.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). Every live example that needs a handler lives in the
 * ./channel-message.examples client sidecar and is referenced as a zero-prop
 * element.
 */
export const ChannelMessageDocs: ComponentDocs = {
  whatItIs:
    "One message drawn in the shape of the channel it is sent on. The message is a kind plus a few slots (who it is from, what it says, one question, a few closed answers, a way to stop). The `channel` prop picks the shape: a thread bubble for the app, a lock-screen card for push, a bubble with inline buttons for chat, a sender, subject and one button for email, and a spoken script for phone. The component shows the message and its state in words. It sends nothing and decides nothing.",
  whyItMatters:
    "A bot that reaches a person on five channels has one voice and five shapes, and a design system built for screens gives the other four no way to say so. Designing Bots pairs Slack message attachments with Messenger templates for the same content (chapter 9) and says that writing once and running everywhere runs at low quality, while separating the logic from the presentation and tuning per platform is better (chapter 20). Notification products already preview one message per channel: Courier holds every channel in one template and renders each variant with test data, Novu previews on every channel's editor, Knock puts a preview pane on each channel step, and Braze documents a composer preview for email, in-app messages, content cards and banners. This component makes the same move for a bot: one message, five shapes, chosen by a prop, so the five cannot drift apart.",
  evidence: ["Courier", "Novu", "Knock", "Braze", "Designing Bots (chapters 9 and 20)"],
  anatomy: [
    {
      slot: "channel-message",
      note: "The article. Carries data-channel and data-state, and is named by its channel and sender.",
    },
    { slot: "channel-message-from", note: "Who sent it. The only identity, the same on every channel." },
    {
      slot: "channel-message-kind",
      note: "The kind as a badge on app, chat and email, and as the lock-screen phrase on a locked push. An unlocked push and the phone script do not show it.",
    },
    {
      slot: "channel-message-what",
      note: "The message, or the summary when the recipient is the second person.",
    },
    { slot: "channel-message-ask", note: "The one question. Absent for ready, receipt and notice messages." },
    {
      slot: "channel-message-options",
      note: "The closed answers, capped per channel. Buttons while the message is sent and onAnswer is given, inert text otherwise.",
    },
    {
      slot: "channel-message-overflow",
      note: "Says how many options did not fit, and that they are in the app.",
    },
    {
      slot: "channel-message-link",
      note: "The way back to the app, as text on push, chat and email. The app thread and the phone script carry it implicitly and print no label. Never a live link.",
    },
    { slot: "channel-message-quiet", note: "The way to stop these messages, worded for the channel." },
    {
      slot: "channel-message-trust",
      note: "The line this channel always carries, such as what the sender never asks for.",
    },
    { slot: "channel-message-handoff", note: "Who takes over and when the person hears from them." },
    { slot: "channel-message-state", note: "The state as a word, announced when it changes." },
    {
      slot: "channel-message-path",
      note: "How the text was produced: by code, live, or the fallback template.",
    },
    { slot: "channel-message-reason", note: "Why the state is what it is, when the caller says." },
    {
      slot: "channel-message-answer",
      note: "The result that replaces the controls once answered. Takes focus when it arrives.",
    },
    { slot: "channel-message-script", note: "The phone channel's spoken script, as one block of lines." },
  ],
  usage:
    'Reach for it wherever one message has to be shown as it will arrive: a configurator that previews a message per channel, a delivery log, a support view of what a person saw. Pass the message once and render it per channel with `channel`. Keep the state in your own store and pass it in; the component never changes it. To make the controls work, give `onAnswer`, set `state` to `sent`, and when the callback fires set `state` to `answered` with the `answer` value. Without `onAnswer` the options render as plain text, which is what a screenshot or a static page should show. Use `to="second"` for a second recipient, who reads `summary` and none of the question. Use `locked` on push to choose between the lock screen and the unlocked notification.',
  dos: [
    {
      text: 'Let the caller own the state: report the pressed option through `onAnswer`, then pass `state="answered"` and the `answer`. The buttons are replaced by the result and focus moves to it.',
      example: <AnswerReplacesTheButtons />,
    },
    {
      text: "Leave a push locked unless you are showing the unlocked notification. The lock screen shows who sent it and what kind it is, and nothing from the message.",
      example: <LockedPushShowsWhoAndWhatKind />,
    },
    {
      text: "Say why a channel was skipped. A `not-routed` message names its state in words and shows your reason beside it.",
      example: <NotRoutedSaysWhy />,
    },
    {
      text: "Keep a `ready` message free of a question. It has nothing to ask, so it needs no options and no deadline.",
      example: <ReadyHasNoQuestion />,
    },
  ],
  donts: [
    {
      text: "Don't put an ask on a `ready`, `receipt` or `notice`. The component renders it, because it draws what it is given, and the message then promises nothing and asks something. Use kind `ask`.",
      example: <ReadyThatAsksAQuestion />,
    },
    {
      text: "Don't expect more than three actions on a push. The rest are not dropped silently: the card says how many more are in the app.",
      example: <SixOptionsOnAPush />,
    },
    {
      text: "Don't pass `onAnswer` and expect buttons in every state. Only a `sent` or `failed-check` message can be answered; a withdrawn, expired or pending one shows its options as text.",
      example: <ButtonsThatNeverAnswer />,
    },
  ],
  accessibility: {
    keyboard: [
      'With `onAnswer` and `state="sent"`, every option is a real button and a tab stop, in reading order, up to the channel\'s cap (three on an unlocked push, one on email, five elsewhere). Space and Enter press it. A locked push, an answered message and every other state add no tab stops at all.',
      "Nothing is a roving group. Arrow keys do nothing, and there is no shortcut for the options or for the quiet line.",
      "The quiet line, the link label and the state are text, not controls. A person using only the keyboard cannot press them, which is the same as what they would see in a render of the channel.",
    ],
    screenReader: [
      'The root is an `article` named "<Channel> message from <sender>". A caller\'s own `aria-label` replaces it.',
      'Each option button is named by its own text. On the phone script the text is the spoken phrase, for example "Press 2 for Not great", so the name carries the digit.',
      "The state is a word in a status region, so a change from sent to answered or withdrawn is announced. The state is never conveyed by colour: `Pending`, `Sent`, `Answered`, `Withdrawn`, `Expired`, `Failed check` and `Not routed` are all text.",
      "The link label and the quiet line are plain text. The link is not announced as a link because it is not one.",
      "A locked push card holds the sender and the kind phrase and nothing else from the message. The body, the question and the actions are not in the DOM, so a screen reader cannot read what the lock screen hides. The state, path, reason and trust lines sit below the card and stay.",
    ],
    focus: [
      "When `state` changes to `answered` after the message was on screen, focus moves to the result line (`tabIndex={-1}`) if it was on the message or nowhere, because the button the person pressed has just left the page. If focus is on a control of your own, such as a Step or Play button that set the state, it stays there. A message that first renders already answered does not take focus.",
      "A withdrawn or expired message keeps no focus target. If a button had focus when the state changed, the browser puts focus on the page body, so move it in your own handler.",
    ],
  },
  pitfalls: [
    "The component does not check the message against its kind. A `ready` with an `ask` renders as written. Validate the kind against the slots before you pass it in.",
    "Only `sent` and `failed-check` are answerable. A `failed-check` message was not delivered as written, but the template of the same kind went out in its place, so the person has a copy to answer and its options are buttons. Pending, withdrawn, expired and not-routed messages show their options as text.",
    '`link` is text and never an anchor, and it follows each channel\'s habit. Push prints "Tap to open in the app", chat and email print "Open in the app", and the app thread and the phone script ("It is in your app too.") print no label. The address sits in a `data-link` attribute on the push, chat and email labels only. The component has no prop for navigation; open the address from your own handler.',
    '`expires` is printed as you give it. Pass the words a person should read, such as "Fri 18:00", not a timestamp.',
    "Hierarchy comes from size and weight. Do not add `text-muted-foreground` text inside the thread and chat bubbles: they paint `bg-muted`, and the pair measures 4.34:1 against a 4.5:1 minimum.",
    '`typeSize="large"` changes the type scale inside the render only. Give it a container that can wrap; text and options wrap onto further lines and never scroll sideways.',
  ],
  variants: [
    {
      prop: "channel",
      default: undefined,
      values: [
        {
          value: "app",
          intent: "The record. A thread bubble with the controls under it, always sent first.",
        },
        {
          value: "push",
          intent: "An interruption. A lock-screen card that shows who and what kind until unlocked.",
        },
        { value: "chat", intent: "A conversation. A bubble with inline buttons and a command to stop." },
        {
          value: "email",
          intent: "Something to read later. A sender, a subject, one button and a footer link.",
        },
        { value: "phone", intent: "Something said aloud. A script that asks once, by voice or keypad." },
      ],
    },
    {
      prop: "to",
      default: "member",
      values: [
        {
          value: "member",
          intent: "The person the message is about, who gets the question and the options.",
        },
        {
          value: "second",
          intent: "A second recipient such as a caregiver, who gets the summary and no detail.",
        },
      ],
    },
    {
      prop: "typeSize",
      default: "default",
      values: [
        { value: "default", intent: "Most readers. The ordinary type scale." },
        {
          value: "large",
          intent: "Readers who need larger text, set once per recipient and not per message.",
        },
      ],
    },
    {
      prop: "pace",
      default: "default",
      values: [
        { value: "default", intent: "The phone script says each fact once." },
        {
          value: "slow",
          intent: "The phone script says the key fact twice, for listeners who need the repeat.",
        },
      ],
    },
  ],
  insteadUse: [
    {
      component: "chat-shell",
      when: "You are building the live conversation itself. Chat-shell is the thread a person types into; channel-message draws one message as it would arrive on a channel, for previews, logs and configurators.",
    },
  ],
};
