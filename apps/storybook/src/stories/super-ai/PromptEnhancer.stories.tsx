import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Textarea } from "@/components/ui/textarea";
import { PromptEnhancer, type PromptEnhancerProps } from "@/registry/super-ai/prompt-enhancer";
import { SuggestionChip, SuggestionChips } from "@/registry/super-ai/suggestion-chips";
import { PromptEnhancerDocs } from "@/content/components/prompt-enhancer.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

/**
 * Fixtures are prompts a person could type. The enhancer is a stub that adds
 * constraints, the way a real one would; no model is called.
 */
const PROMPT = "write a short poem about the sea";
const ENHANCED = "write a short poem about the sea, in four lines, with a calm tone";
const LONG_PROMPT =
  "draft a release note for the March update that explains the new export options, the renamed settings page and the fix for duplicate notifications";

const resolves = (text = ENHANCED) => fn(async () => text);

/** A host that owns the field, the way a composer would. */
function Host(args: PromptEnhancerProps) {
  const [value, setValue] = React.useState(args.value);
  return (
    <div className="flex w-[34rem] max-w-full flex-col gap-2">
      <Textarea
        aria-label="Prompt"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="min-h-16"
      />
      <PromptEnhancer
        {...args}
        value={value}
        onAccept={(next) => {
          setValue(next);
          args.onAccept(next);
        }}
        onRevert={(original) => {
          setValue(original);
          args.onRevert?.(original);
        }}
      />
    </div>
  );
}

const meta: Meta<typeof PromptEnhancer> = {
  title: "Super AI/Prompt Enhancer",
  component: PromptEnhancer,
  parameters: { layout: "centered", docs: { page: componentDocsPage(PromptEnhancerDocs) } },
  // The panel portals below the button; leave it room so the story is not clipped.
  decorators: [
    (Story) => (
      <div className="flex min-h-96 items-start justify-center">
        <Story />
      </div>
    ),
  ],
  args: { value: PROMPT, onEnhance: resolves(), onAccept: fn(), onRevert: fn() },
  render: (args) => <Host {...args} />,
};

export default meta;
type Story = StoryObj<typeof PromptEnhancer>;

const body = () => within(document.body);

async function startEnhance(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "Enhance prompt" }));
}

async function suggestionReady() {
  return body().findByRole("button", { name: "Accept" });
}

async function panelGone() {
  await waitFor(() => expect(document.querySelector('[data-slot="prompt-enhancer-panel"]')).toBeNull());
}

/**
 * Nothing has run. One button, no panel and nothing announced. The button is
 * disabled when the field is empty, since there is nothing to rewrite.
 */
export const Idle: Story = {
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="prompt-enhancer"]')!;
    await expect(root.getAttribute("data-state")).toBe("idle");
    await expect(document.querySelector('[data-slot="prompt-enhancer-panel"]')).toBeNull();
  },
};

/**
 * The call is in flight. The panel says nothing changes until the person
 * accepts, a spinner shows progress, and Cancel is the focused control. The
 * status region announces it politely. The promise never resolves, so the
 * story holds here.
 */
export const Enhancing: Story = {
  args: { onEnhance: fn(() => new Promise<string>(() => {})) },
  play: async ({ canvasElement }) => {
    await startEnhance(canvasElement);
    await body().findByText(/Nothing changes until you accept/);
    await expect(canvasElement.querySelector('[data-slot="prompt-enhancer-status"]')).toHaveTextContent(
      "Enhancing your prompt.",
    );
    await waitFor(() => expect(document.activeElement).toBe(body().getByRole("button", { name: "Cancel" })));
  },
};

/**
 * The rewrite sits beside the original and the host field has not moved. Added
 * words are underlined as well as tinted, and the region is described by a
 * count, so review is reading rather than diffing by eye.
 */
export const Suggested: Story = {
  play: async ({ canvasElement, args }) => {
    await startEnhance(canvasElement);
    await suggestionReady();
    await expect(args.onEnhance).toHaveBeenCalledWith(PROMPT, undefined);
    await expect(args.onAccept).not.toHaveBeenCalled();
    const added = document.querySelectorAll('[data-slot="prompt-enhancer-added"]');
    await expect(added.length).toBe(1);
    await expect(getComputedStyle(added[0]!).textDecorationLine).toBe("underline");
    await expect(body().getByRole("region", { name: "Suggested rewrite" })).toHaveAccessibleDescription(
      /7 words added in 1 place/,
    );
  },
};

/**
 * The person accepted. The text went out through `onAccept`, the panel closed,
 * and Revert to original is one click away.
 */
export const Accepted: Story = {
  play: async ({ canvasElement, args }) => {
    await startEnhance(canvasElement);
    await userEvent.click(await suggestionReady());
    await expect(args.onAccept).toHaveBeenCalledWith(ENHANCED);
    await expect(within(canvasElement).getByLabelText("Prompt")).toHaveValue(ENHANCED);
    await expect(within(canvasElement).getByRole("button", { name: "Revert to original" })).toBeVisible();
    await panelGone();
  },
};

/**
 * Revert after an accept. The field holds the exact original string again, not
 * a trimmed copy, and the callback received that string.
 */
export const Reverted: Story = {
  play: async ({ canvasElement, args }) => {
    await startEnhance(canvasElement);
    await userEvent.click(await suggestionReady());
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Revert to original" }));
    await expect(args.onRevert).toHaveBeenCalledWith(PROMPT);
    await expect(within(canvasElement).getByLabelText("Prompt")).toHaveValue(PROMPT);
    await expect(
      canvasElement.querySelector('[data-slot="prompt-enhancer"]')!.getAttribute("data-state"),
    ).toBe("reverted");
  },
};

/**
 * The call rejected. The panel says the prompt is unchanged, the field holds
 * what it held before, and nothing was handed to `onAccept`.
 */
export const Failed: Story = {
  args: {
    onEnhance: fn(async () => {
      throw new Error("The model did not respond");
    }),
  },
  play: async ({ canvasElement, args }) => {
    await startEnhance(canvasElement);
    await body().findByRole("button", { name: "Try again" });
    await expect(document.querySelector('[data-slot="prompt-enhancer-error"]')).toHaveTextContent(
      /Your prompt is unchanged/,
    );
    await expect(within(canvasElement).getByLabelText("Prompt")).toHaveValue(PROMPT);
    await expect(args.onAccept).not.toHaveBeenCalled();
  },
};

/* Case stories. See docs/design-system/story-conventions.md. */
/*
 * // case-skip: EmptyLabel — no optional text slot: every string the component shows is fixed copy or the host's `value`, and an empty `refinements` list is the only optional content (grep: `refinements = DEFAULT_REFINEMENTS`)
 */

/**
 * Right-to-left. The button and revert row sit inside the `dir="rtl"` wrapper,
 * so the Enhance icon leads from the right edge. The panel portals to the body
 * outside the wrapper, so its direction cannot be judged here (a real app sets
 * `dir` on the document). What the story pins is that the two-column grid and
 * the disclosure chevron use logical or direction-free classes.
 */
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl" className="min-h-96">
      <Host {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Enhance prompt" });
    await expect(getComputedStyle(trigger).direction).toBe("rtl");
    const icon = trigger.querySelector("svg")!;
    const box = trigger.getBoundingClientRect();
    await expect(icon.getBoundingClientRect().left).toBeGreaterThan(box.left + box.width / 2);
    await startEnhance(canvasElement);
    await suggestionReady();
    await expect(document.querySelector('[data-slot="prompt-enhancer-added"]')).not.toBeNull();
  },
};

/**
 * The only motion is the spinner while enhancing and the panel's open
 * transition. The spinner carries `motion-reduce:animate-none` and the panel
 * restates the paired `motion-reduce:data-open:animate-none` form, because the
 * bare form is inert on a Base UI popup. The runner emulates reduced motion,
 * so this reads `animation-name` back rather than trusting the classes.
 */
export const ReducedMotion: Story = {
  args: { onEnhance: fn(() => new Promise<string>(() => {})) },
  play: async ({ canvasElement }) => {
    await startEnhance(canvasElement);
    const panel = await waitFor(() => {
      const el = document.querySelector<HTMLElement>('[data-slot="prompt-enhancer-panel"]');
      if (!el) throw new Error("the panel never opened");
      return el;
    });
    await expect(getComputedStyle(panel).animationName).toBe("none");
    const spinner = panel.querySelector<SVGElement>("svg.animate-spin")!;
    await expect(getComputedStyle(spinner).animationName).toBe("none");
  },
};

/**
 * Idle is one tab stop. Enter starts the run and focus moves into the panel,
 * to Accept once the rewrite is ready. Escape discards it and focus returns
 * to the Enhance button. Each stop shows a ring that focus caused.
 */
export const KeyboardOrder: Story = {
  render: (args) => (
    <div className="flex min-h-96 flex-col items-start gap-3">
      <PromptEnhancer {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole("button", { name: "Enhance prompt" });
    await userEvent.tab();
    await expect(document.activeElement).toBe(trigger);
    await expect(trigger.matches(":focus-visible")).toBe(true);
    await settledFocusRing(trigger, waitFor);

    await userEvent.keyboard("{Enter}");
    const accept = await suggestionReady();
    await waitFor(() => expect(document.activeElement).toBe(accept));
    await settledFocusRing(accept, waitFor);

    await userEvent.keyboard("{Escape}");
    await panelGone();
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};

/**
 * The host owns the value. `value` is pinned to the prompt and `onAccept` only
 * reports: accepting calls it with the rewrite, but the component does not
 * write anywhere, and re-rendering with the same `value` holds it fixed. The
 * Revert button is offered because the run completed, not because the field
 * changed.
 */
export const Controlled: Story = {
  render: function ControlledRender(args) {
    const [renders, setRenders] = React.useState(0);
    return (
      <div className="flex min-h-96 w-[34rem] max-w-full flex-col items-start gap-3">
        <PromptEnhancer {...args} />
        <button
          type="button"
          onClick={() => setRenders((n) => n + 1)}
          className="border-border text-foreground focus-visible:ring-ring rounded-md border px-2 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
        >
          Re-render ({renders})
        </button>
      </div>
    );
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await startEnhance(canvasElement);
    await userEvent.click(await suggestionReady());
    await expect(args.onAccept).toHaveBeenCalledWith(ENHANCED);
    await userEvent.click(canvas.getByRole("button", { name: /Re-render/ }));
    await expect(canvas.getByRole("button", { name: "Revert to original" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Revert to original" }));
    await expect(args.onRevert).toHaveBeenCalledWith(PROMPT);
  },
};

/**
 * A prompt of about 140 characters. The original column wraps it with
 * `break-words` and `whitespace-pre-wrap`, so line breaks the person typed
 * survive, and nothing is truncated: the whole point of the panel is that the
 * text can be read in full.
 */
export const LongContent: Story = {
  args: {
    value: LONG_PROMPT,
    onEnhance: fn(async (v: string) => `${v}, written for non-technical customers, under 120 words`),
  },
  play: async ({ canvasElement }) => {
    await startEnhance(canvasElement);
    await suggestionReady();
    const original = document.querySelector<HTMLElement>('[data-slot="prompt-enhancer-original"] p')!;
    await expect(original.textContent).toBe(LONG_PROMPT);
    await expect(getComputedStyle(original).overflowWrap).toBe("break-word");
    await expect(original.scrollWidth).toBeLessThanOrEqual(original.clientWidth);
  },
};

/**
 * 375px. The panel portals to the body, so a wrapper cannot constrain it; this
 * story resizes the test iframe itself, which also moves the `sm` breakpoint,
 * so the two columns stack as they do on a phone. The assertion is that the
 * open panel sits inside the viewport.
 */
export const Mobile: Story = {
  play: async ({ canvasElement }) => {
    const { page } = await import("vitest/browser");
    await page.viewport(375, 812);
    await startEnhance(canvasElement);
    await suggestionReady();
    const panel = document.querySelector<HTMLElement>('[data-slot="prompt-enhancer-panel"]')!;
    const rect = panel.getBoundingClientRect();
    await expect(rect.left).toBeGreaterThanOrEqual(0);
    await expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
    const original = panel.querySelector('[data-slot="prompt-enhancer-original"]')!.getBoundingClientRect();
    const suggestion = panel
      .querySelector('[data-slot="prompt-enhancer-suggestion"]')!
      .getBoundingClientRect();
    await expect(suggestion.top).toBeGreaterThanOrEqual(original.bottom);
  },
};

/**
 * Chips and the enhancer both sit near a composer, and they are easy to mix up:
 *
 * - **Prompt enhancer** (this) rewrites what the person already typed, shows
 *   the rewrite beside the original and waits for an accept.
 * - **Suggestion chips** offer task starters before anything is typed. Picking
 *   one fills the composer.
 * - **Slot summary** shows what the system understood before acting, as fields.
 * - **Diff review** gives each tracked change in AI-edited prose its own accept
 *   or reject; **selection toolbar** runs AI actions on selected text.
 *
 * Rule of thumb: nothing typed yet, use chips. Typed and want it improved as a
 * whole, use this. Improved in pieces or on a selection, use diff review or the
 * selection toolbar.
 */
export const Boundary: Story = {
  render: (args) => (
    <div className="flex w-[34rem] max-w-full flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Suggestion chips: before anything is typed</p>
        <SuggestionChips>
          <SuggestionChip suggestion="Write a poem about the sea" />
          <SuggestionChip suggestion="Summarise this changelog" />
        </SuggestionChips>
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">
          Prompt enhancer: improve what is typed, as a whole
        </p>
        <Host {...args} />
      </section>
    </div>
  ),
};
