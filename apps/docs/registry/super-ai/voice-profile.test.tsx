import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectAccessibleName } from "@/lib/test-utils";
import { ActiveVoiceChip, VoiceProfile, type Voice } from "./voice-profile";

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
  rules: { tone: "Second person, present tense." },
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
  rules: { tone: "Formal and measured." },
};

const VOICES = [PLAIN, DOCS, TEAM, FORMAL];

const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`);

describe("VoiceProfile", () => {
  it("renders the none state: neutral, no rules, no reset, every voice offered", () => {
    render(<VoiceProfile voices={VOICES} />);
    expect(slot("voice-profile-current")).toHaveTextContent("Neutral");
    expect(screen.getByText(/No voice rules are applied/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset to neutral" })).toBeNull();
    expect(slot("voice-profile-detail")).toBeNull();
    expect(screen.getAllByRole("button", { name: /^Use / })).toHaveLength(4);
  });

  it("renders the none state with no saved voices at all", () => {
    render(<VoiceProfile voices={[]} />);
    expect(screen.getByText(/No saved voices yet/)).toBeInTheDocument();
  });

  it("renders the preset state: a system voice shows its rules read-only", () => {
    render(<VoiceProfile voices={VOICES} activeId="formal" />);
    expect(slot("voice-profile-current")).toHaveTextContent("Formal");
    expect(slot("voice-profile-current-meta")).toHaveTextContent("Preset voice · All projects");
    expect(slot("voice-profile-rule-tone")).toHaveTextContent("Formal and measured.");
    expect(screen.getByText(/preset voice. Its rules are read-only/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit rules" })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("a team voice is read-only too and says so", () => {
    render(<VoiceProfile voices={VOICES} activeId="team" />);
    expect(screen.getByText(/team voice. Its rules are read-only/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit rules" })).toBeNull();
  });

  it("renders the custom state: all five rules as text, with Edit", () => {
    render(<VoiceProfile voices={VOICES} activeId="plain" />);
    expect(slot("voice-profile-rule-tone")).toHaveTextContent("Plain and direct, no preamble.");
    expect(slot("voice-profile-rule-use")).toHaveTextContent("Words to usebecauseso");
    expect(slot("voice-profile-rule-avoid")).toHaveTextContent("leverage");
    expect(slot("voice-profile-rule-formatting")).toHaveTextContent("Short paragraphs");
    expect(slot("voice-profile-rule-example")).toHaveTextContent("We shipped it.");
    expect(screen.getByRole("button", { name: "Edit rules" })).toBeInTheDocument();
    expect(slot("voice-profile-item-active")).toHaveTextContent("Active");
  });

  it("omits a rule that is empty and says when there are none", () => {
    render(<VoiceProfile voices={[{ ...PLAIN, rules: {} }]} activeId="plain" />);
    expect(screen.getByText("This voice has no rules yet.")).toBeInTheDocument();
    expect(slot("voice-profile-rules")).toBeNull();
  });

  it("renders the editing state: labelled fields start from the saved voice", () => {
    render(<VoiceProfile voices={VOICES} activeId="plain" defaultEditingId="plain" />);
    expect(screen.getByRole("textbox", { name: "Voice name" })).toHaveValue("Plain and direct");
    expect(screen.getByRole("textbox", { name: "Tone" })).toHaveValue("Plain and direct, no preamble.");
    expect(screen.getByRole("textbox", { name: "Words to use" })).toHaveValue("because, so");
    expect(screen.getByRole("textbox", { name: "Words to avoid" })).toHaveValue("leverage, synergy");
    expect(screen.getByRole("textbox", { name: "Formatting" })).toHaveValue(
      "Short paragraphs. No bullet lists.",
    );
    expect(screen.getByRole("textbox", { name: "Example" })).toHaveValue(
      "We shipped it. Here is what changed.",
    );
    expect(screen.getByRole("textbox", { name: "Voice name" })).toHaveFocus();
    expect(slot("voice-profile-detail")).toBeNull();
  });

  it("does not open an editor for a voice that is not personal", () => {
    render(<VoiceProfile voices={VOICES} activeId="team" defaultEditingId="team" />);
    expect(slot("voice-profile-editor")).toBeNull();
  });

  it("saves an edit with the whole voice, parsing word lists, and returns focus to Edit", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceProfile voices={VOICES} activeId="plain" defaultEditingId="plain" onSave={onSave} />);
    const avoid = screen.getByRole("textbox", { name: "Words to avoid" });
    await user.clear(avoid);
    await user.type(avoid, "leverage,  circle back , ");
    await user.click(screen.getByRole("button", { name: "Save voice" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toEqual({
      ...PLAIN,
      rules: { ...PLAIN.rules, avoid: ["leverage", "circle back"] },
    });
    await waitFor(() => expect(screen.getByRole("button", { name: "Edit rules" })).toHaveFocus());
    expect(slot("voice-profile-status")).toHaveTextContent("Voice saved.");
  });

  it("Save is off while the name is empty, and Escape cancels without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<VoiceProfile voices={VOICES} activeId="plain" defaultEditingId="plain" onSave={onSave} />);
    const name = screen.getByRole("textbox", { name: "Voice name" });
    await user.clear(name);
    expect(screen.getByRole("button", { name: "Save voice" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(onSave).not.toHaveBeenCalled();
    expect(slot("voice-profile-editor")).toBeNull();
    await waitFor(() => expect(screen.getByRole("button", { name: "Edit rules" })).toHaveFocus());
  });

  it("renders the scoped state: scope in text on every voice, other-project voices marked", () => {
    render(<VoiceProfile voices={VOICES} activeId="docs" activeProject="Docs site" />);
    expect(slot("voice-profile-current-meta")).toHaveTextContent("Personal voice · Project: Docs site");
    const items = document.querySelectorAll('[data-slot="voice-profile-item"]');
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("All projects");
    expect(items[1]).toHaveTextContent("Project: Docs site");
    expect(slot("voice-profile-item-inactive")).toBeNull();
  });

  it("says in text when a voice is held to a different project", () => {
    render(<VoiceProfile voices={VOICES} activeId="plain" activeProject="Pricing page" />);
    const inactive = document.querySelectorAll('[data-slot="voice-profile-item-inactive"]');
    expect(inactive).toHaveLength(1);
    expect(inactive[0]).toHaveTextContent("Not used in Pricing page");
  });

  it("switches scope in one action", async () => {
    const user = userEvent.setup();
    const onScopeChange = vi.fn();
    render(
      <VoiceProfile
        voices={VOICES}
        activeId="plain"
        activeProject="Docs site"
        onScopeChange={onScopeChange}
      />,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveTextContent("All projects");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Only Docs site" }));
    expect(onScopeChange).toHaveBeenCalledTimes(1);
    expect(onScopeChange).toHaveBeenCalledWith("plain", { project: "Docs site" });
  });

  it("offers no scope control when there is no project to hold a voice to", () => {
    render(<VoiceProfile voices={VOICES} activeId="plain" />);
    expect(screen.queryByRole("combobox")).toBeNull();
  });

  it("renders the conflict state: who wins, over whom, and why, as text", () => {
    render(
      <VoiceProfile
        voices={VOICES}
        activeId="docs"
        activeProject="Docs site"
        conflict={{
          winnerId: "docs",
          otherId: "plain",
          reason: "A voice held to a project is more specific than a global one.",
        }}
      />,
    );
    const conflict = slot("voice-profile-conflict")!;
    expect(conflict).toHaveTextContent("Conflict");
    expect(conflict).toHaveTextContent("Docs voice wins over Plain and direct.");
    expect(conflict).toHaveTextContent("A voice held to a project is more specific than a global one.");
    expect(conflict).toHaveAttribute("data-winner", "docs");
  });

  it("shows no conflict block when there is no conflict", () => {
    render(<VoiceProfile voices={VOICES} activeId="plain" />);
    expect(slot("voice-profile-conflict")).toBeNull();
  });

  it("renders the reset state: one press, one callback, saved voices kept", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    function Host() {
      const [id, setId] = React.useState<string | null>("plain");
      return (
        <VoiceProfile
          voices={VOICES}
          activeId={id}
          onReset={() => {
            onReset();
            setId(null);
          }}
        />
      );
    }
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Reset to neutral" }));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(slot("voice-profile-current")).toHaveTextContent("Neutral");
    expect(slot("voice-profile-reset-note")).toHaveTextContent("your saved voices are kept");
    expect(document.querySelectorAll('[data-slot="voice-profile-item"]')).toHaveLength(4);
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(slot("voice-profile-current")).toHaveFocus();
    expect(slot("voice-profile-status")).toHaveTextContent("Voice reset to neutral.");
  });

  it("Use switches the active voice, announces it, and moves focus off the vanishing button", async () => {
    const user = userEvent.setup();
    const onActiveChange = vi.fn();
    render(<VoiceProfile voices={VOICES} onActiveChange={onActiveChange} />);
    await user.click(screen.getByRole("button", { name: "Use Formal" }));
    expect(onActiveChange).toHaveBeenCalledWith("formal");
    expect(slot("voice-profile-current")).toHaveFocus();
    expect(slot("voice-profile-status")).toHaveTextContent("Voice set to Formal.");
  });

  it("is controlled: Use alone does not change the active voice", async () => {
    const user = userEvent.setup();
    render(<VoiceProfile voices={VOICES} activeId="plain" />);
    await user.click(screen.getByRole("button", { name: "Use Formal" }));
    expect(slot("voice-profile-current")).toHaveTextContent("Plain and direct");
  });

  describe("preview", () => {
    it("shows a sample written under the current rules", async () => {
      const user = userEvent.setup();
      const onPreview = vi.fn().mockResolvedValue("We shipped it. Here is why.");
      render(<VoiceProfile voices={VOICES} activeId="plain" onPreview={onPreview} />);
      await user.click(screen.getByRole("button", { name: "Preview a sample" }));
      expect(await screen.findByText("We shipped it. Here is why.")).toBeInTheDocument();
      expect(onPreview).toHaveBeenCalledWith(PLAIN.rules);
      expect(screen.getByText("Sample under these rules")).toBeInTheDocument();
      expect(slot("voice-profile-preview-output")).toHaveAttribute("role", "status");
    });

    it("previews the unsaved draft while editing", async () => {
      const user = userEvent.setup();
      const onPreview = vi.fn().mockResolvedValue("ok");
      render(
        <VoiceProfile voices={VOICES} activeId="plain" defaultEditingId="plain" onPreview={onPreview} />,
      );
      const tone = screen.getByRole("textbox", { name: "Tone" });
      await user.clear(tone);
      await user.type(tone, "Warm");
      await user.click(screen.getByRole("button", { name: "Preview a sample" }));
      await screen.findByText("ok");
      expect(onPreview.mock.calls[0][0]).toEqual({ ...PLAIN.rules, tone: "Warm" });
    });

    it("says so when the sample fails, and offers it again", async () => {
      const user = userEvent.setup();
      const onPreview = vi.fn().mockRejectedValue(new Error("down"));
      render(<VoiceProfile voices={VOICES} activeId="plain" onPreview={onPreview} />);
      await user.click(screen.getByRole("button", { name: "Preview a sample" }));
      expect(await screen.findByText(/could not be written/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Preview a sample" })).toBeEnabled();
    });

    it("clears a stale sample when the rules change", async () => {
      const user = userEvent.setup();
      const onPreview = vi.fn().mockResolvedValue("Old sample");
      render(
        <VoiceProfile voices={VOICES} activeId="plain" defaultEditingId="plain" onPreview={onPreview} />,
      );
      await user.click(screen.getByRole("button", { name: "Preview a sample" }));
      await screen.findByText("Old sample");
      await user.type(screen.getByRole("textbox", { name: "Tone" }), "!");
      await waitFor(() => expect(screen.queryByText("Old sample")).toBeNull());
    });

    it("has no preview control without onPreview, and none for neutral", () => {
      const { rerender } = render(<VoiceProfile voices={VOICES} activeId="plain" />);
      expect(screen.queryByRole("button", { name: "Preview a sample" })).toBeNull();
      rerender(<VoiceProfile voices={VOICES} onPreview={async () => "x"} />);
      expect(screen.queryByRole("button", { name: "Preview a sample" })).toBeNull();
    });
  });

  it("names Use by the voice it switches to", () => {
    render(<VoiceProfile voices={VOICES} activeId="plain" />);
    expectAccessibleName(screen.getByRole("button", { name: "Use Formal" }), "Use Formal");
  });

  it("is a group named by its title, a heading at the chosen level", () => {
    render(<VoiceProfile voices={VOICES} headingLevel={2} title="Writing voice" />);
    expect(screen.getByRole("group", { name: "Writing voice" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Writing voice" })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<VoiceProfile voices={[]} className="test-class" />);
    expect(slot("voice-profile")!.className).toContain("test-class");
  });
});

describe("ActiveVoiceChip", () => {
  it("states name, source and scope in text under its own data-slot", () => {
    render(<ActiveVoiceChip voice={DOCS} />);
    const chip = slot("active-voice-chip")!;
    expect(chip).toHaveTextContent("Voice: Docs voice");
    expect(chip).toHaveTextContent("Personal");
    expect(chip).toHaveTextContent("Project: Docs site");
    expect(chip.tagName).toBe("SPAN");
  });

  it("says Neutral when no voice is active", () => {
    render(<ActiveVoiceChip voice={null} />);
    expect(slot("active-voice-chip")).toHaveTextContent("Voice: Neutral");
    expect(slot("active-voice-chip-source")).toBeNull();
  });

  it("is a button that opens the profile when onOpen is passed", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<ActiveVoiceChip voice={TEAM} onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: /Voice: Team style guide/ });
    expect(within(button).getByText("Team")).toBeInTheDocument();
    await user.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("passes className through", () => {
    render(<ActiveVoiceChip voice={null} className="chip-class" />);
    expect(slot("active-voice-chip")!.className).toContain("chip-class");
  });
});
