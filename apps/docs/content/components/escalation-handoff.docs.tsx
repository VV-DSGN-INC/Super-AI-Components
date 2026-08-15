import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#n11-escalation-handoff.
 * Translated into consumer-facing guidance rather than shipped verbatim.
 *
 * No "use client" here: this module is plain data read by a Server Component
 * (component-docs.tsx). It deliberately carries no live examples — every
 * meaningful rendering of this card needs an `onSend`/`onLeaveMessage`
 * handler, and event handlers cannot cross the server boundary. The states
 * and situations are all rendered in EscalationHandoff.stories.tsx instead.
 */
export const EscalationHandoffDocs: ComponentDocs = {
  whatItIs:
    "The card an agent shows when it is handing the conversation to a person. Its subject is the packet, not the button: the summary the receiving human reads first, the resolved frame of slot values, what the agent already tried, and the specific unblock being asked for. It moves through four states — the packet in preview, queued, accepted, or unavailable — and the user sees the packet before any of it is sent.",
  whyItMatters:
    "Handoff is the strongest result in the agent slice of the reference board: five unrelated products converged on it, and they converged on the same thing. Sierra auto-generates the handoff summary; Decagon sends history, attempted actions, customer data and an issue summary; Intercom Fin, Voiceflow and Rasa's pattern_human_handoff all ship an equivalent. What none of them converged on was the button. The escalation button is the easy half and the part users notice least — the packet is what decides whether the person on the other end can actually help, or has to start the conversation over.",
  evidence: ["Sierra", "Decagon", "Intercom Fin", "Voiceflow", "Rasa"],
  anatomy: [
    { slot: "escalation-handoff", note: "Root card. Carries data-trigger and data-state, so you can style or assert on either." },
    {
      slot: "escalation-handoff-reason",
      note: "The one-line reason, chosen by `trigger`. Four fixed strings; not overridable by design.",
    },
    {
      slot: "escalation-handoff-wait",
      note: "Queue copy, in the `queued` state only. Prints an honest fallback when `wait` is absent.",
    },
    {
      slot: "escalation-handoff-availability",
      note: "The closed-door message, in the `unavailable` state only. `availability` appends the window people are back.",
    },
    {
      slot: "escalation-handoff-packet",
      note: "The packet section — summary, the resolved frame, what was already tried. Rendered in every state.",
    },
    {
      slot: "escalation-handoff-request",
      note: "The specific ask. Optional in the API, but an escalation without one is just a forward.",
    },
  ],
  usage:
    "Reach for it at the moment the agent stops and a person starts: the user asked for someone, the repair loop has run out of road, confidence is too low for a high-stakes action, or policy requires a human review. Pick the `trigger` that is actually true — the four reasons produce four different messages, and \"you asked for a person\" and \"policy requires a person\" are not interchangeable claims about the conversation. Keep `state` in your own state and advance it as the handoff progresses; the component renders what you give it and never moves itself. Show `preview` first so the user can read and edit the packet before it travels, because it is their conversation being forwarded.",
  dos: [
    {
      text: "Put the specific unblock in `request` — name what the person is being asked to do, not just what went wrong.",
    },
    {
      text: "Wire `onEditPacket` in the preview state. The user is the one who knows the summary is wrong, and it is the only privacy control on a forward of their conversation.",
    },
    {
      text: "Use `unavailable` honestly when nobody is on, with a real window in `availability` and an asynchronous path in `onLeaveMessage`.",
    },
  ],
  donts: [
    {
      text: "Don't queue a handoff nobody will pick up. A fake \"connecting you\" at 3 a.m. is worse than a closed door, because the user waits in it.",
    },
    {
      text: "Don't restate the reason inside `summary` — the trigger copy already says it, and the packet should read as a briefing for the human, not a second explanation for the user.",
    },
    {
      text: "Don't let the thread die at handoff. Decide what `accepted` leads to before you ship it: the conversation resumes with state intact, or it is explicitly closed.",
    },
  ],
  pitfalls: [
    "The footer only renders in `preview` and `unavailable`. In `queued` and `accepted` there is no footer at all, so `onCancel` and `onEditPacket` are accepted and silently dropped — the escape hatch disappears exactly while the user is waiting. If you need a way out of the queue, it has to live outside this card.",
    "In `preview` and `unavailable` the footer element renders even when you pass no handlers at all, leaving an empty action bar under the packet. Pass at least one action, or the card ends in a blank strip.",
    "`wait` being absent is not the same as passing an empty string: the component prints \"We don't have a wait time yet.\" on purpose. That fallback is the honest answer when queue depth is unknown — don't pass an invented estimate to avoid it.",
    "The four trigger strings are a module constant, not props. You cannot reword them per surface; if none of the four fits, the situation probably is not an escalation.",
    "The component models no return path. `accepted` is where it stops — there is no prop for resuming the conversation or closing it out, so the host owns whatever happens after a person picks it up.",
    "Under `dir=\"rtl\"` the card mirrors correctly, but the \"Already tried\" bullets use a right-pointing arrow that does not flip. Cosmetic rather than blocking, and tracked as a gap.",
  ],
};
