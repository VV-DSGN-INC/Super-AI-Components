import type { ComponentDocs } from "@/lib/component-docs";

/**
 * Seeded from docs/design-system/component-specs.md#m3-quota-meter.
 * Translate the spec's internal voice into consumer-facing guidance — do not
 * ship the seed text verbatim.
 *
 * No "use client" here: this module is plain data read by a Server
 * Component (component-docs.tsx), which destructures `docs.whatItIs`,
 * `docs.evidence`, etc. directly. This component needs no interactive
 * examples, so there is no ./quota-meter.examples client sidecar.
 */
export const QuotaMeterDocs: ComponentDocs = {
  whatItIs:
    "A stack of plan-usage meters, one row per metered resource, each showing what has been used against what the plan allows and when the allowance comes back. Every row is a labelled progressbar built on Progress, with three thresholds it derives itself from the numbers you pass: normal, near-limit, and over-limit.",
  whyItMatters:
    "AI plans meter several things at once — messages, image generations, video minutes, tool calls — and they do not run out together. A single blended \"78% of your plan used\" reads fine right up until the one resource you actually need is the one at zero, so this component refuses to aggregate: the row that will stop you is visible as its own row. The other half is timing. The decision a user makes at 90% is different from the one they make at 100%, and different again if the counter resets tomorrow, which is why near-limit is a state of its own rather than a darker shade of normal, and why the reset countdown sits in the row instead of behind a tooltip.",
  evidence: ["Zapier", "Lovable", "Claude", "Descript"],
  anatomy: [
    { slot: "quota-meter", note: "Root column holding one row per resource." },
    {
      slot: "quota-meter-row",
      note: "One metered resource. Carries data-state=\"normal\" | \"near-limit\" | \"over-limit\", derived from used/limit — style against this rather than recomputing the threshold.",
    },
    { slot: "quota-meter-label", note: "The resource name, and the accessible name of that row's progressbar." },
    {
      slot: "quota-meter-value",
      note: "The used / limit readout, with the optional unit appended. Forced dir=\"ltr\" so the numeric pair survives an RTL page.",
    },
    {
      slot: "quota-meter-track",
      note: "The progressbar itself — role, aria-valuenow/min/max, aria-valuetext, and aria-labelledby pointing at the row's own label.",
    },
    { slot: "quota-meter-bar", note: "The filled portion. Clamps to 100%; the numbers above it do not." },
    { slot: "quota-meter-reset", note: "The reset line. Rendered only when resetsIn is supplied and compact is off." },
  ],
  usage:
    "Reach for it wherever a user goes to find out what their plan has left — a settings or billing page, a plan card, or the bottom of a sidebar in its compact form. Pass one entry in `resources` per thing you meter, with the raw `used` and `limit` numbers; the component derives the threshold itself, so you never pass a state. Tune where the amber starts with `nearLimitAt` (a ratio, defaulting to 0.8) when a resource is expensive enough to warrant earlier warning. `resetsIn` is a preformatted node rather than a Date on purpose — the host owns the clock, because formatting a countdown at render time produces different text on the server and the client and desyncs hydration.",
  dos: [
    {
      text: "Give every metered resource its own row, even when one of them is nowhere near its limit — the point of the stack is that the rows disagree.",
    },
    {
      text: "Format resetsIn upstream, where you know the user's timezone and locale, and pass the finished string.",
    },
    {
      text: "Use compact when the meter lives in a sidebar or a dense panel, and put the reset date somewhere else on that surface — compact drops the reset line entirely.",
    },
  ],
  donts: [
    {
      text: "Don't collapse the rows into one overall percentage before passing them in — an aggregate is exactly the summary that hides the resource about to stop the user.",
    },
    {
      text: "Don't pass a Date, a timestamp, or a live countdown to resetsIn — it takes a rendered node because the component does not own a clock, and computing one here desyncs hydration.",
    },
    {
      text: "Don't hand-tint the rows to signal severity — the threshold is derived from used and limit, and a caller-applied colour will disagree with data-state the moment the numbers move.",
    },
  ],
  pitfalls: [
    "This component needs the --warning token, which is not part of stock shadcn — it ships in the component's cssVars and the CLI writes it into your globals.css. If it is missing, Tailwind emits no rule at all rather than failing, so near-limit degrades silently: the amber bar renders unpainted and the amber number falls back to inherited text. Check for --warning in your CSS before concluding that near-limit does not work.",
    "Where --warning is defined, near-limit's readout paints text-warning on your page background, which measures roughly 2.2:1 in the default light theme — under the 4.5:1 that normal-size text needs. The state is also carried by the bar and by data-state, so it is not the only signal, but do not rely on the amber number alone to communicate near-limit, and expect an audit to flag it.",
    "nearLimitAt is a ratio between 0 and 1, not a percentage. Passing 80 instead of 0.8 does not raise the threshold — no row can ever reach it, so every resource reads normal until it tips straight to over-limit.",
    "The bar clamps at 100% but the numbers never do, so an over-limit row shows a full bar beside a readout like 5,240 / 5,000. That is deliberate — the real overage is the useful number — but it means bar width alone cannot tell you how far over a plan is.",
    "A resource with limit set to 0 always reads over-limit with a full bar, since there is no allowance to be within. If you mean unmetered, leave the resource out rather than passing a zero limit.",
  ],
};
