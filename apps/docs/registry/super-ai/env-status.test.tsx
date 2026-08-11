import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EnvStatus, type EnvStatusState } from "./env-status";

/** The one row this suite renders per state, to keep each test to one fact. */
function renderState(state: EnvStatusState) {
  return render(<EnvStatus providers={[{ id: "openai", name: "OpenAI", state }]} />);
}

const row = () => document.querySelector('[data-slot="env-status-provider"]')!;
const condition = () => document.querySelector('[data-slot="env-status-condition"]')!;
const remedy = () => document.querySelector('[data-slot="env-status-remedy"]')!;
const badge = () => document.querySelector('[data-slot="env-status-badge"]')!;

describe("EnvStatus", () => {
  it("renders the ok state — reachable, nothing to do", () => {
    renderState("ok");
    expect(condition().textContent).toMatch(/reachable/i);
    expect(remedy().textContent!.length).toBeGreaterThan(0);
    expect(badge().textContent).toMatch(/^ok$/i);
  });

  it("renders the degraded state — the remedy is to wait, not to touch a credential", () => {
    renderState("degraded");
    expect(condition().textContent).toMatch(/degraded/i);
    // The remedy has to say "wait" and must not tell the user to go fix a key
    // or start a process — that is what makes degraded a different state
    // from key-invalid and not-running, not just a different word.
    expect(remedy().textContent).toMatch(/wait/i);
    expect(remedy().textContent).not.toMatch(/credential|key|start/i);
    expect(badge().textContent).toMatch(/degraded/i);
  });

  it("renders the key-invalid state — the remedy is to go fix a credential", () => {
    renderState("key-invalid");
    expect(condition().textContent).toMatch(/key invalid|rejected/i);
    expect(remedy().textContent).toMatch(/credential|key/i);
    expect(badge().textContent).toMatch(/key invalid/i);
  });

  it("renders the not-running state — the remedy is to start something locally", () => {
    renderState("not-running");
    expect(condition().textContent).toMatch(/not running/i);
    expect(remedy().textContent).toMatch(/start/i);
    expect(remedy().textContent).toMatch(/local/i);
    expect(badge().textContent).toMatch(/not running/i);
  });

  it("conveys every state in text, never by colour or icon alone", () => {
    // This is the central rule in the spec: a row of coloured dots is the
    // failure mode this component exists to avoid. For every declared state,
    // the icon must be decorative (aria-hidden, so it is never the sole
    // channel) and the condition sentence must be real, visible text —
    // exposed to assistive tech, not aria-hidden — that names the state in
    // words a screen reader announces and a sighted user reads regardless
    // of colour vision. Renamed/removed condition text should fail this,
    // not silently pass because an icon or a background colour is present.
    const states: EnvStatusState[] = ["ok", "degraded", "key-invalid", "not-running"];
    const expectedWord: Record<EnvStatusState, RegExp> = {
      ok: /reachable/i,
      degraded: /degraded/i,
      "key-invalid": /key invalid|rejected/i,
      "not-running": /not running/i,
    };

    for (const state of states) {
      const { unmount } = renderState(state);

      const icon = row().querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon).toHaveAttribute("aria-hidden", "true");

      const conditionEl = condition();
      expect(conditionEl).not.toHaveAttribute("aria-hidden");
      expect(conditionEl.textContent).toMatch(expectedWord[state]);

      unmount();
    }
  });

  it("passes className through", () => {
    render(<EnvStatus className="test-class" />);
    expect(document.querySelector('[data-slot="env-status"]')!.className).toContain("test-class");
  });
});
