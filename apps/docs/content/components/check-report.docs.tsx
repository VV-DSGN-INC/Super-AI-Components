import type { ComponentDocs } from "@/lib/component-docs";
import { CheckReport, type CheckRule } from "@/registry/super-ai/check-report";

/**
 * Seeded from docs/design-system/component-specs.md#r3-check-report.
 *
 * No "use client" here, and no event handlers: check-report is a plain
 * function component, so its examples can sit in this module directly.
 */

const RULES: CheckRule[] = [
  "kind-on-list",
  "slots-filled",
  "one-ask",
  "no-number-in-ask",
  "fits-channel",
  "glossary",
  "no-guilt",
  "readability",
];

const ALL_PASS = RULES.map((rule) => ({ rule, pass: true }));
const NO_GUILT_FAILS = RULES.map((rule) =>
  rule === "no-guilt" ? { rule, pass: false, detail: 'Found "you missed"' } : { rule, pass: true },
);

export const CheckReportDocs: ComponentDocs = {
  whatItIs:
    "The output checks' verdict per rule. Each rule that ran gets a row with the word pass or fail, its name and an optional detail. When a failed check sent the same-kind template instead of the text as written, the report says so. It shows results; it does not run any rule.",
  whyItMatters:
    "A message written live by an agent is checked before it goes out, and one that fails is never sent as written. That only builds trust if a reader can see which rule failed and what happened next. Designing Bots asks for a way out of every dead end and a fallback when the bot cannot do what was asked (chapter 8). The rule list belongs to this project and no industry standard sets it, and no product count is claimed for this item; it rests on the book and the content system.",
  evidence: ["Designing Bots (chapter 8)"],
  anatomy: [
    { slot: "check-report", note: 'The region, named "Output checks" or "Output checks for <channel>".' },
    { slot: "check-report-rule", note: "One rule that ran: the verdict, the rule's name and the detail." },
    { slot: "check-report-verdict", note: "The word pass or fail, as text in a badge." },
    {
      slot: "check-report-fallback",
      note: 'The line "Sent the template instead", present only when the fallback was used.',
    },
  ],
  usage:
    "Run your rules and pass the results. The report lists the rules that appear in `results`, always in the same order: kind on the list, slots filled, one ask, no number in the ask, fits the channel, glossary words, no guilt, readability. A rule you switched off has no result and no row. Set `fallback` when a failure sent the template instead, and `channel` to say which channel the text was written for.",
  dos: [
    {
      text: "Pass a result for every rule that ran, including the ones that passed. A report that lists only failures cannot show that the others ran.",
      example: <CheckReport results={ALL_PASS} channel="email" />,
    },
    {
      text: "Say what happened after a failure. Set `fallback` so the report states that the template went out instead.",
      example: <CheckReport results={NO_GUILT_FAILS} channel="chat" fallback />,
    },
  ],
  donts: [
    {
      text: 'Don\'t leave a failed rule without a detail. "fail" alone tells the reader a rule broke and not what to change.',
      example: <CheckReport results={[{ rule: "no-guilt", pass: false }]} />,
    },
    {
      text: "Don't set `fallback` on a report where nothing failed. It then claims the template was sent for no reason.",
      example: <CheckReport results={ALL_PASS.slice(0, 2)} fallback />,
    },
  ],
  accessibility: {
    keyboard: [
      "No tab stops. The report is text, and nothing in it is a control.",
      "There is no keyboard navigation inside it. It is read as ordinary text in page order.",
    ],
    screenReader: [
      'A `section` with an `aria-label`, so it is a landmark region named "Output checks" or "Output checks for <channel>".',
      "Each rule is a list item that reads the word pass or fail, then the rule's name, then the detail. The verdict is text; the solid badge for fail and the outlined badge for pass are emphasis only.",
      "The fallback line is plain text in the same region. Nothing announces a change in the results, so put a live region around it if results arrive while the page is open.",
    ],
  },
  pitfalls: [
    "A rule with no entry in `results` is not shown. That is how a switched-off rule behaves, so a report with fewer than eight rows can be correct. A rule that ran and passed still needs its own `pass: true` entry.",
    "Results are listed in the fixed rule order, not the order you pass them in.",
    "`fallback` is a statement about what was sent, and the component does not check it against the results. Setting it with no failure reads as a contradiction.",
  ],
  variants: {
    none: "The report renders every rule one way, as a verdict word beside a name, because the reader's job is to find the rule that failed and a row styled by severity would hide the ones that passed.",
  },
  insteadUse: [
    {
      component: "safety-block",
      when: "One request or response was stopped by policy and you are showing that block to a person. Check-report lists every output rule for one message, pass or fail, with the fallback stated.",
    },
  ],
};
