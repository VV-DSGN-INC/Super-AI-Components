import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { MemoryManager } from "@/registry/super-ai/memory-manager";
import { PresetGrid } from "@/registry/super-ai/preset-grid";
import {
  ActiveVoiceChip,
  VoiceProfile,
  type Voice,
  type VoiceProfileProps,
} from "@/registry/super-ai/voice-profile";
import { VoiceProfileDocs } from "@/content/components/voice-profile.docs";
import { componentDocsPage } from "@/lib/component-docs-page";
import { settledFocusRing } from "@/lib/focus-ring";

/**
 * Fixtures are voices a real assistant could hold: a personal writing style, a
 * project voice, a team guide and a built-in preset. No invented company, no
 * figures.
 */
const PLAIN: Voice = {
  id: "plain",
  name: "Plain and direct",
  source: "personal",
  scope: "global",
  rules: {
    tone: "Plain and direct, no preamble.",
    use: ["because", "so"],
    avoid: ["leverage", "synergy"],
    formatting: "Short paragraphs. No bullet lists.",
    example: "We shipped it. Here is what changed.",
  },
};

const DOCS: Voice = {
  id: "docs",
  name: "Docs voice",
  source: "personal",
  scope: { project: "Docs site" },
  rules: { tone: "Second person, present tense.", avoid: ["simply", "just"] },
};

const TEAM: Voice = {
  id: "team",
  name: "Team style guide",
  source: "team",
  scope: "global",
  rules: { tone: "Friendly and exact.", avoid: ["utilize"] },
};

const FORMAL: Voice = {
  id: "formal",
  name: "Formal",
  source: "system",
  scope: "global",
  rules: { tone: "Formal and measured.", formatting: "Full sentences, no contractions." },
};

const VOICES = [PLAIN, DOCS, TEAM, FORMAL];

const meta: Meta<typeof VoiceProfile> = {
  title: "Super AI/Voice Profile",
  component: VoiceProfile,
  parameters: { layout: "centered", docs: { page: componentDocsPage(VoiceProfileDocs) } },
};

export default meta;
type Story = StoryObj<typeof VoiceProfile>;

const preview = (rules: { tone?: string }) =>
  new Promise<string>((resolve) =>
    setTimeout(
      () =>
        resolve(
          `${rules.tone ?? "Default tone"} We shipped the export fix, so large files finish in one pass.`,
        ),
      50,
    ),
  );

/** Holds the list, the active voice and the scope, which the component leaves to its host. */
function Host(props: Partial<VoiceProfileProps> & { initialActive?: string | null }) {
  const { initialActive = null, voices: initialVoices = VOICES, onReset, ...rest } = props;
  const [voices, setVoices] = React.useState(initialVoices);
  const [activeId, setActiveId] = React.useState<string | null>(initialActive);
  return (
    <VoiceProfile
      voices={voices}
      activeId={activeId}
      onActiveChange={setActiveId}
      onSave={(next) => setVoices((all) => all.map((v) => (v.id === next.id ? next : v)))}
      onScopeChange={(id, scope) => setVoices((all) => all.map((v) => (v.id === id ? { ...v, scope } : v)))}
      onReset={() => {
        onReset?.();
        setActiveId(null);
      }}
      {...rest}
    />
  );
}

/**
 * No voice active. The card says plainly that no rules are applied, offers every
 * saved voice, and has no Reset because there is nothing to reset. Pressing Use
 * makes the voice current and moves focus to the current-voice line.
 */
export const None: Story = {
  render: () => <Host />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/No voice rules are applied/)).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Reset to neutral" })).toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "Use Formal" }));
    await expect(canvasElement.querySelector('[data-slot="voice-profile-current"]')).toHaveTextContent(
      "Formal",
    );
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="voice-profile-current"]')).toHaveFocus(),
    );
  },
};

/**
 * A built-in preset. Its rules show as text and say they are read-only: no Edit,
 * no scope control, because a preset is not the person's to change here.
 */
export const Preset: Story = {
  render: () => <Host initialActive="formal" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/preset voice. Its rules are read-only/)).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Edit rules" })).toBeNull();
    await expect(canvas.queryByRole("combobox")).toBeNull();
  },
};

/**
 * A personal voice as five rules: tone, words to use, words to avoid,
 * formatting, an example. Each is text. The play opens a preview and reads the
 * sample back, which is announced through a live region.
 */
export const Custom: Story = {
  render: () => <Host initialActive="plain" onPreview={preview} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const slot of ["tone", "use", "avoid", "formatting", "example"]) {
      await expect(canvasElement.querySelector(`[data-slot="voice-profile-rule-${slot}"]`)).not.toBeNull();
    }
    await userEvent.click(canvas.getByRole("button", { name: "Preview a sample" }));
    await expect(await canvas.findByText(/We shipped the export fix/)).toBeInTheDocument();
    await expect(canvas.getByText("Sample under these rules")).toBeInTheDocument();
  },
};

/**
 * The rules editor. Labelled fields start from the saved voice, word lists are
 * typed with commas, and a preview runs on the unsaved draft. The play edits a
 * list, saves, reads the new rule back and checks focus returned to Edit.
 */
export const Editing: Story = {
  render: () => <Host initialActive="plain" defaultEditingId="plain" onPreview={preview} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const name = canvas.getByRole("textbox", { name: "Voice name" });
    await waitFor(() => expect(name).toHaveFocus());
    const avoid = canvas.getByRole("textbox", { name: "Words to avoid" });
    await userEvent.clear(avoid);
    await userEvent.type(avoid, "leverage, circle back");
    await userEvent.click(canvas.getByRole("button", { name: "Save voice" }));
    await expect(canvas.getByText("circle back")).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByRole("button", { name: "Edit rules" })).toHaveFocus());
  },
};

/**
 * A voice held to one project. Scope is in text on the current voice and on
 * every row, a voice held to another project says it is not used here, and the
 * Applies to select changes scope in one action. The play moves the voice to
 * all projects and reads it back.
 */
export const Scoped: Story = {
  render: () => <Host initialActive="docs" activeProject="Docs site" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelector('[data-slot="voice-profile-current-meta"]')).toHaveTextContent(
      "Project: Docs site",
    );
    await userEvent.click(canvas.getByRole("combobox"));
    await userEvent.click(
      await within(canvasElement.ownerDocument.body).findByRole("option", { name: "All projects" }),
    );
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="voice-profile-current-meta"]')).toHaveTextContent(
        "Personal voice · All projects",
      ),
    );
  },
};

/**
 * Two voices could apply, a project voice and a global one. The card names the
 * winner, the voice it wins over, and why, as a sentence, instead of dropping
 * one silently.
 */
export const Conflict: Story = {
  render: () => (
    <Host
      initialActive="docs"
      activeProject="Docs site"
      conflict={{
        winnerId: "docs",
        otherId: "plain",
        reason: "A voice held to a project is more specific than one that follows you everywhere.",
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const conflict = canvasElement.querySelector('[data-slot="voice-profile-conflict"]')!;
    await expect(conflict).toHaveTextContent("Docs voice wins over Plain and direct.");
    await expect(conflict).toHaveTextContent("more specific");
  },
};

const onReset = fn();

/**
 * Reset to neutral. One press, one `onReset`, no dialog, and the card says
 * saved voices are kept. The play presses it once and counts the calls.
 */
export const Reset: Story = {
  render: () => <Host initialActive="plain" onReset={onReset} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onReset.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Reset to neutral" }));
    await expect(onReset).toHaveBeenCalledTimes(1);
    await expect(canvasElement.querySelector('[data-slot="voice-profile-current"]')).toHaveTextContent(
      "Neutral",
    );
    await expect(canvas.getByText(/your saved voices are kept/)).toBeInTheDocument();
    await expect(canvasElement.querySelectorAll('[data-slot="voice-profile-item"]')).toHaveLength(
      VOICES.length,
    );
    await waitFor(() =>
      expect(canvasElement.querySelector('[data-slot="voice-profile-current"]')).toHaveFocus(),
    );
  },
};

/* -------------------------------------------------------------------------
 * Case stories. See docs/design-system/story-conventions.md.
 *
 * Not written for this component, deliberately:
 *
 * // case-skip: ReducedMotion — voice-profile.tsx carries no animate-* class and its only transition is transition-colors on the chip hover, which moves nothing (grep returns two lines); the Select popup restates its motion-reduce pair at the call site
 * // case-skip: EmptyLabel — the text each control is named from (voice name, rule labels, Use, Reset) is required; the only optional text is `description`, and an absent one omits its element without leaving an unnamed control
 */

/**
 * `activeId` is the host's. The host here records the request and applies it
 * only when told to: pressing Use does not move the current voice, the
 * callback fires with the id the host needs, a re-render with the same id holds
 * it, and applying the request moves it.
 */
const spyActive = fn();
export const Controlled: Story = {
  render: () => {
    function Held() {
      const [activeId, setActiveId] = React.useState<string>("plain");
      const [tick, setTick] = React.useState(0);
      return (
        <div className="flex flex-col gap-3">
          <VoiceProfile voices={VOICES} activeId={activeId} onActiveChange={spyActive} />
          <button type="button" data-testid="rerender" onClick={() => setTick((n) => n + 1)}>
            Re-render {tick}
          </button>
          <button type="button" data-testid="apply" onClick={() => setActiveId("formal")}>
            Apply
          </button>
        </div>
      );
    }
    return <Held />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const current = () => canvasElement.querySelector('[data-slot="voice-profile-current"]')!;
    spyActive.mockClear();
    await userEvent.click(canvas.getByRole("button", { name: "Use Formal" }));
    await expect(spyActive).toHaveBeenCalledWith("formal");
    await expect(current()).toHaveTextContent("Plain and direct");
    await userEvent.click(canvas.getByTestId("rerender"));
    await expect(current()).toHaveTextContent("Plain and direct");
    await userEvent.click(canvas.getByTestId("apply"));
    await waitFor(() => expect(current()).toHaveTextContent("Formal"));
  },
};

/**
 * Tab order with a personal voice active: Reset to neutral, the Applies to
 * select, Edit rules, then Use on each other voice top to bottom. Every stop
 * paints a settled focus ring. The walk asserts the sequence directly rather
 * than counting tabs inside a budget.
 */
export const KeyboardOrder: Story = {
  render: () => <Host initialActive="plain" activeProject="Docs site" voices={[PLAIN, DOCS, FORMAL]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stops = [
      canvas.getByRole("button", { name: "Reset to neutral" }),
      canvas.getByRole("combobox"),
      canvas.getByRole("button", { name: "Edit rules" }),
      canvas.getByRole("button", { name: "Use Docs voice" }),
      canvas.getByRole("button", { name: "Use Formal" }),
    ];
    await userEvent.tab();
    for (const stop of stops) {
      await waitFor(() => expect(document.activeElement).toBe(stop));
      await expect(stop.matches(":focus-visible")).toBe(true);
      await settledFocusRing(stop, waitFor);
      if (stop !== stops[stops.length - 1]) await userEvent.tab();
    }
  },
};

/**
 * A voice name of about 90 characters and a long tone rule. Both wrap and
 * nothing truncates, because the name and the rules are what the person is
 * judging. The Use button keeps its place beside the name.
 */
export const LongContent: Story = {
  render: () => (
    <Host
      initialActive="long"
      voices={[
        {
          id: "long",
          name: "Release notes for the engineering newsletter, written for readers who skim on a phone",
          source: "personal",
          scope: "global",
          rules: {
            tone: "Plain and direct, with the change in the first line and the reason in the second, and no closing summary at all.",
          },
        },
        FORMAL,
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const name = canvasElement.querySelector<HTMLElement>('[data-slot="voice-profile-current"]')!;
    await expect(getComputedStyle(name).whiteSpace).toBe("normal");
    await expect(`name wraps=${name.getBoundingClientRect().height > 24}`).toBe("name wraps=true");
    const use = within(canvasElement).getByRole("button", { name: "Use Formal" });
    await expect(use.getBoundingClientRect().right).toBeLessThanOrEqual(
      canvasElement.querySelector<HTMLElement>('[data-slot="voice-profile"]')!.getBoundingClientRect().right,
    );
  },
};

/**
 * 375px. The wrapper constrains width, not the breakpoint, and nothing here
 * keys on a breakpoint. The current voice, the rules, the editor fields and the
 * list rows must fit without sideways scroll.
 */
export const Mobile: Story = {
  render: () => (
    <div data-testid="frame" className="w-[375px] max-w-full">
      <Host initialActive="plain" activeProject="Docs site" defaultEditingId="plain" onPreview={preview} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = within(canvasElement).getByTestId("frame");
    await expect(`frame width=${frame.clientWidth}`).toBe("frame width=375");
    await expect(`frame overflows=${frame.scrollWidth > frame.clientWidth}`).toBe("frame overflows=false");
    for (const item of canvasElement.querySelectorAll('[data-slot="voice-profile-item"]')) {
      await expect(`item overflows=${item.scrollWidth > item.clientWidth}`).toBe("item overflows=false");
    }
  },
};

/**
 * Under dir="rtl" the list mirrors: the voice name starts at the right edge and
 * its Use button sits to the left of it. The sample quote uses a logical border
 * and padding, so it mirrors with it.
 */
export const RTL: Story = {
  render: () => (
    <div dir="rtl" data-testid="rtl" className="w-[480px] max-w-full">
      <Host initialActive="plain" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const name = canvasElement.querySelector<HTMLElement>('[data-slot="voice-profile-item-name"]')!;
    const use = within(canvasElement).getAllByRole("button", { name: /^Use / })[0];
    await expect(getComputedStyle(name).direction).toBe("rtl");
    await expect(
      `use is left of name=${use.getBoundingClientRect().left < name.getBoundingClientRect().left}`,
    ).toBe("use is left of name=true");
  },
};

/**
 * The chip is the entry point at the input. It states the voice name, source
 * and scope in text, and becomes a button that opens the profile when the host
 * passes `onOpen`. Neutral reads "Voice: Neutral".
 */
const onOpen = fn();
export const Chip: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-2">
      <ActiveVoiceChip voice={DOCS} onOpen={onOpen} />
      <ActiveVoiceChip voice={TEAM} />
      <ActiveVoiceChip voice={null} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    onOpen.mockClear();
    const chips = canvasElement.querySelectorAll('[data-slot="active-voice-chip"]');
    await expect(chips).toHaveLength(3);
    await expect(chips[0]).toHaveTextContent("Voice: Docs voice");
    await expect(chips[0]).toHaveTextContent("Project: Docs site");
    await expect(chips[1]).toHaveTextContent("Team");
    await expect(chips[2]).toHaveTextContent("Voice: Neutral");
    await userEvent.click(canvas.getByRole("button", { name: /Voice: Docs voice/ }));
    await expect(onOpen).toHaveBeenCalledTimes(1);
  },
};

/**
 * Three neighbours, one question each: what is being decided?
 *
 * - **Voice profile**: rules for how output sounds, and where they apply.
 * - **Preset grid**: a saved visual style picked from a grid of previews.
 * - **Memory manager**: what the assistant knows about the person.
 *
 * Mode tabs (a mode of work) and parameter panel (generation parameters) are
 * not drawn here.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Voice profile: how output sounds</p>
        <Host initialActive="plain" voices={[PLAIN, FORMAL]} />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Preset grid: a saved visual style</p>
        <PresetGrid
          items={[
            { id: "sketch", label: "Sketch" },
            { id: "watercolor", label: "Watercolor" },
          ]}
          defaultValue="sketch"
        />
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-foreground text-xs font-medium">Memory manager: what the assistant knows</p>
        <MemoryManager
          memories={[
            {
              id: "f1",
              text: "Works as a product designer on a design systems team.",
              kind: "fact",
              addedAt: "2026-09-02",
              source: "Added by you",
              scope: "global",
            },
          ]}
        />
      </section>
    </div>
  ),
};
