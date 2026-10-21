# Check Report

> The output checks' verdict per rule. Each rule that ran gets a row with the word pass or fail, its name and an optional detail. When a failed check sent the same-kind template instead of the text as written, the report says so. It shows results; it does not run any rule.

Layer: component · Family: R · Install: `npx shadcn@latest add https://super-ai-components.vercel.app/r/check-report.json` · Contract: `components/super-ai/check-report.meta.json` (installed beside the component; version-locked to the code, so it outranks this page) · Docs: https://super-ai-components.vercel.app/components/check-report

## Why it matters

A message written live by an agent is checked before it goes out, and one that fails is never sent as written. That only builds trust if a reader can see which rule failed and what happened next. Designing Bots asks for a way out of every dead end and a fallback when the bot cannot do what was asked (chapter 8). The rules here are this project's, not an industry standard, and no product count is claimed for this item; it rests on the book and the content system.

## When to reach for it

Run your rules and pass the results. The report lists the rules that appear in `results`, always in the same order: kind on the list, slots filled, one ask, no number in the ask, fits the channel, glossary words, no guilt, readability. A rule you switched off has no result and no row. Set `fallback` when a failure sent the template instead, and `channel` to say which channel the text was written for.

## Variants

None: The report renders every rule one way, as a verdict word beside a name, because the reader's job is to find the rule that failed and a row styled by severity would hide the ones that passed.

## Instead use

- **safety-block**: One request or response was stopped by policy and you are showing that block to a person. Check-report lists every output rule for one message, pass or fail, with the fallback stated.

## Do

- Pass a result for every rule that ran, including the ones that passed. A report that lists only failures cannot show that the others ran.
- Say what happened after a failure. Set `fallback` so the report states that the template went out instead.

## Don't

- Don't leave a failed rule without a detail. "fail" alone tells the reader a rule broke and not what to change.
- Don't set `fallback` on a report where nothing failed. It then claims the template was sent for no reason.

## Anatomy

- `check-report`: The region, named "Output checks" or "Output checks for <channel>".
- `check-report-rule`: One rule that ran: the verdict, the rule's name and the detail.
- `check-report-verdict`: The word pass or fail, as text in a badge.
- `check-report-fallback`: The line "Sent the template instead", present only when the fallback was used.

## Accessibility

**Keyboard**

- No tab stops. The report is text, and nothing in it is a control.
- There is no keyboard navigation inside it. It is read as ordinary text in page order.

**Screen reader**

- A `section` with an `aria-label`, so it is a landmark region named "Output checks" or "Output checks for <channel>".
- Each rule is a list item that reads the word pass or fail, then the rule's name, then the detail. The verdict is text; the solid badge for fail and the outlined badge for pass are emphasis only.
- The fallback line is plain text in the same region. Nothing announces a change in the results, so put a live region around it if results arrive while the page is open.

## Pitfalls

- A rule with no entry in `results` is not shown. That is how a switched-off rule behaves, so a report with fewer than eight rows can be correct. A rule that ran and passed still needs its own `pass: true` entry.
- Results are listed in the fixed rule order, not the order you pass them in.
- `fallback` is a statement about what was sent, and the component does not check it against the results. Setting it with no failure reads as a contradiction.

## Composition

- States: `all-pass`, `some-fail`
- Composes from this registry: nothing
- shadcn primitives: badge
- npm: none

## Evidence

Designing Bots (chapter 8)
