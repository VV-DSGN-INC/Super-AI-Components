import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SkillMenu, type SkillMenuItem } from "./skill-menu";

const SKILLS: SkillMenuItem[] = [
  {
    id: "summarize",
    title: "Summarize",
    description: "Condense a long document into key points",
    preview: <p>Summary preview</p>,
  },
  {
    id: "translate",
    title: "Translate",
    description: "Convert text between languages",
    cost: 2,
    preview: <p>Translation preview</p>,
  },
];

describe("SkillMenu", () => {
  it("renders the search state, filtering rows by title AND description", async () => {
    const user = userEvent.setup();
    render(<SkillMenu skills={SKILLS} />);

    // The search input carries a real accessible name (not a bare
    // placeholder) — `getByRole` with `name` fails outright otherwise.
    const search = screen.getByRole("combobox", { name: /search skills/i });

    expect(screen.getByText("Summarize")).toBeInTheDocument();
    expect(screen.getByText("Translate")).toBeInTheDocument();
    // Per-action cost composes cost-chip via entity-row's trailing slot.
    expect(screen.getByText(/2 credits/i)).toBeInTheDocument();

    // "languages" only appears in Translate's description, never its title.
    await user.type(search, "languages");

    expect(screen.queryByText("Summarize")).not.toBeInTheDocument();
    expect(screen.getByText("Translate")).toBeInTheDocument();
  });

  it("renders the hover-preview state, reachable by mouse AND keyboard", async () => {
    const user = userEvent.setup();
    render(<SkillMenu skills={SKILLS} />);

    // Default preview is the first skill's — a skill's preview is always
    // mounted, never introduced only once something is hovered.
    expect(screen.getByText("Summary preview")).toBeInTheDocument();

    // Mouse: cmdk drives its "active" row via pointermove.
    fireEvent.pointerMove(screen.getByText("Translate"));
    expect(screen.getByText("Translation preview")).toBeInTheDocument();
    expect(screen.queryByText("Summary preview")).not.toBeInTheDocument();

    // Keyboard: arrow navigation on the search input drives the exact same
    // "active" state cmdk uses for pointer hover — a mouse-only preview
    // (the documented trap) would never update here.
    const search = screen.getByRole("combobox", { name: /search skills/i });
    search.focus();
    await user.keyboard("{ArrowUp}");
    expect(screen.getByText("Summary preview")).toBeInTheDocument();
    expect(screen.queryByText("Translation preview")).not.toBeInTheDocument();
  });

  it("renders the new-skill-footer state with both authoring verbs", async () => {
    const user = userEvent.setup();
    const onCreateSkill = vi.fn();
    const onGenerateSkill = vi.fn();
    render(<SkillMenu skills={SKILLS} onCreateSkill={onCreateSkill} onGenerateSkill={onGenerateSkill} />);

    await user.click(screen.getByRole("button", { name: /create your own/i }));
    expect(onCreateSkill).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: /have the agent build it/i }));
    expect(onGenerateSkill).toHaveBeenCalledOnce();
  });

  it("passes className through", () => {
    render(<SkillMenu className="test-class" />);
    expect(document.querySelector('[data-slot="skill-menu"]')!.className).toContain("test-class");
  });
});
