import { computeAccessibleName } from "dom-accessibility-api";

/**
 * Assert an element's COMPUTED accessible name, not its text content.
 *
 * accname concatenates name-from-content chunks with whitespace trimmed and no
 * separator, so `<span>In</span><span class="sr-only"> point at 3s</span>`
 * computes as "Inpoint at 3s". Two components shipped that bug on the same
 * afternoon and it broke three tests before anyone worked out why.
 *
 * The fix at the component is either an outright `aria-label`, or marking the
 * visual half `aria-hidden` and putting the COMPLETE phrase in the sr-only span.
 *
 * This is deliberately a helper rather than a static gate: a detector for
 * "visible text plus an sr-only sibling" fires on every legitimate use of the
 * pattern, and a noisy gate gets excluded. See the design spec §6 G5.
 *
 * Lives in lib/, not registry/super-ai/ — the registry is the published
 * product and a test helper must never be installable by `shadcn add`.
 */
export function expectAccessibleName(el: Element, expected: string): void {
  const actual = computeAccessibleName(el);
  if (actual !== expected) {
    throw new Error(
      `accessible name mismatch — expected "${expected}", computed "${actual}". ` +
        `If the two differ only by a missing space, an sr-only span has fused with the visible text.`,
    );
  }
}

/**
 * Everything a user could focus, click or type into. DOM-level on purpose: jsdom
 * applies no stylesheet, so it cannot tell a hidden control from a shown one, and
 * the loading contract says nothing interactive is mounted, not that it is hidden.
 */
const INTERACTIVE = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="slider"]',
  '[role="combobox"]',
  '[role="textbox"]',
].join(", ");

interface ShellContract {
  /** The shell's registry name, which is also its root `data-slot`. */
  name: string;
  /** The shell's manifest `regions`. */
  regions: readonly string[];
}

function describeElement(el: Element): string {
  const slot = el.getAttribute("data-slot");
  return slot ? `${el.tagName.toLowerCase()}[data-slot=${slot}]` : el.tagName.toLowerCase();
}

function fail(name: string, half: string, problems: string[]): void {
  if (problems.length > 0) throw new Error(`${name} ${half} contract:\n  ${problems.join("\n  ")}`);
}

/**
 * The loading half of a family O shell's contract (block-build-brief.md, "Status
 * and loading"): a busy root, every region drawn once as a skeleton hidden from
 * assistive tech, and nothing mounted that takes focus apart from `status`.
 * The browser half, that each skeleton sits where its region will land, is the
 * loading twin in apps/storybook/src/lib/loading-twin.tsx.
 */
export function expectShellLoadingContract(root: Element, { name, regions }: ShellContract): void {
  const problems: string[] = [];
  if (root.getAttribute("aria-busy") !== "true") problems.push('the root does not carry aria-busy="true"');
  for (const region of regions) {
    const marked = root.querySelectorAll(`[data-region="${region}"]`).length;
    if (marked !== 1) problems.push(`region "${region}" is marked ${marked} times, expected once`);
    const twins = root.querySelectorAll(`[data-loading-region="${region}"]`);
    if (twins.length !== 1) problems.push(`region "${region}" has ${twins.length} skeletons, expected one`);
    else if (!twins[0].closest('[aria-hidden="true"]'))
      problems.push(`the "${region}" skeleton is not hidden from assistive tech`);
  }
  const status = root.querySelector(`[data-slot="${name}-status"]`);
  const live = Array.from(root.querySelectorAll(INTERACTIVE)).filter((el) => !status?.contains(el));
  if (live.length > 0)
    problems.push(
      `${live.length} interactive element(s) mounted while loading: ${live.slice(0, 3).map(describeElement).join(", ")}`,
    );
  fail(name, "loading", problems);
}

/**
 * The loaded half: no `aria-busy`, and each region's box carries the
 * `data-loading-region` marker the loading twin measures, exactly once.
 */
export function expectShellLoadedContract(root: Element, { name, regions }: ShellContract): void {
  const problems: string[] = [];
  if (root.hasAttribute("aria-busy")) problems.push("the root carries aria-busy while loaded");
  for (const region of regions) {
    const boxes = root.querySelectorAll(`[data-loading-region="${region}"]`).length;
    if (boxes !== 1)
      problems.push(`region "${region}" has ${boxes} [data-loading-region] boxes, expected one`);
  }
  if (root.querySelector('[data-slot="shell-skeleton-region"]'))
    problems.push("a skeleton region is mounted while loaded");
  fail(name, "loaded", problems);
}
