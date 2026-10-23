import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { CheckReport, type CheckRule } from "@/registry/super-ai/check-report";
import { CheckReportDocs } from "@/content/components/check-report.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof CheckReport> = {
  title: "Super AI/Check Report",
  component: CheckReport,
  parameters: { layout: "centered", docs: { page: componentDocsPage(CheckReportDocs) } },
};

export default meta;
type Story = StoryObj<typeof CheckReport>;

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

/**
 * Every rule ran and every rule passed. All eight are listed, each with the
 * word "pass": a report that listed nothing would not show the checks ran.
 */
export const AllPass: Story = {
  args: { results: ALL_PASS, channel: "chat" },
  play: async ({ canvasElement }) => {
    const verdicts = [...canvasElement.querySelectorAll('[data-slot="check-report-verdict"]')];
    await expect(verdicts.map((v) => v.textContent)).toEqual(Array(8).fill("pass"));
  },
};

/**
 * Live text for chat said "you missed", so `no-guilt` failed and the template
 * went out instead. One "fail", seven "pass", and the fallback stated.
 */
export const SomeFail: Story = {
  args: {
    channel: "chat",
    fallback: true,
    results: ALL_PASS.map((r) =>
      r.rule === "no-guilt" ? { ...r, pass: false, detail: 'Found "you missed"' } : r,
    ),
  },
  play: async ({ canvasElement }) => {
    const verdicts = [...canvasElement.querySelectorAll('[data-slot="check-report-verdict"]')].map(
      (v) => v.textContent,
    );
    await expect(verdicts.filter((v) => v === "fail")).toHaveLength(1);
    await expect(canvasElement.querySelector('[data-slot="check-report-fallback"]')!.textContent).toBe(
      "Sent the template instead",
    );
  },
};

/* -------------------------------------------------------------------------
 * Case stories.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: RTL — no physical left/right classes and no icon to mirror
 * `grep -nE "\b(ml|mr|pl|pr|left|right|text-left|text-right)-" registry/super-ai/check-report.tsx`
 * matches nothing; the row is a wrapping flex row.
 *
 * // case-skip: ReducedMotion — nothing this component adds animates
 * `grep -nE "animate-|transition|duration-" registry/super-ai/check-report.tsx`
 * matches nothing. The vendored Badge carries `transition-all` for colour on
 * hover and focus, and the badge here is never interactive.
 *
 * // case-skip: KeyboardOrder — nothing in the tree is focusable
 * The report is text and badges. It adds no tab stops.
 *
 * // case-skip: Controlled — there is no value or onChange pair
 * The component renders `results` and owns no state.
 *
 * // case-skip: EmptyLabel — no text slot can be empty
 * A rule's name is fixed, and `detail` is simply omitted when absent.
 *
 * // case-skip: Boundary — its near-twin reports a different event
 * `safety-block` shows one request or response stopped by policy; this lists
 * every output rule for one message. The choosing rule is `insteadUse` in the
 * docs module.
 * ---------------------------------------------------------------------- */

/**
 * Details three times longer than a typical one, on two rules. They wrap
 * beside the verdict and never leave the report.
 */
export const LongContent: Story = {
  args: {
    channel: "email",
    fallback: true,
    results: [
      {
        rule: "fits-channel",
        pass: false,
        detail:
          "The subject is 112 characters and an email subject is cut at 78, so the reader would see the first line and not the ask",
      },
      {
        rule: "readability",
        pass: false,
        detail: "Grade 11 against a target of 8: shorten the sentences and use the words in the glossary",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const box = canvasElement
      .querySelector<HTMLElement>('[data-slot="check-report"]')!
      .getBoundingClientRect();
    for (const el of canvasElement.querySelectorAll<HTMLElement>('[data-slot="check-report"] *')) {
      await expect(el.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5);
    }
  },
};

/**
 * A real 375x812 viewport with all eight rules and two long details. Rows wrap
 * and the page does not scroll sideways.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="mobile-frame" className="w-[375px] max-w-full p-4">
      <CheckReport
        channel="email"
        fallback
        results={ALL_PASS.map((r) =>
          r.rule === "readability"
            ? { ...r, pass: false, detail: "Grade 11 against a target of 8: shorten the sentences" }
            : r,
        )}
      />
    </div>
  ),
  play: async () => {
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    await waitFor(() => expect(window.innerWidth).toBe(375));
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(375);
  },
};
