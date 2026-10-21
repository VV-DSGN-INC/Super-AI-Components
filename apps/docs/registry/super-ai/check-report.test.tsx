import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CheckReport, type CheckRule } from "./check-report";

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

const allPass = RULES.map((rule) => ({ rule, pass: true }));
const verdicts = () =>
  [...document.querySelectorAll('[data-slot="check-report-rule"]')].map(
    (r) => r.querySelector('[data-slot="check-report-verdict"]')!.textContent,
  );

describe("CheckReport", () => {
  it("lists all eight rules, each with the word pass, when everything passes", () => {
    render(<CheckReport results={allPass} />);
    expect(verdicts()).toEqual(Array(8).fill("pass"));
  });

  it("a report with one failure says fail once and pass seven times", () => {
    const results = allPass.map((r) => (r.rule === "no-guilt" ? { ...r, pass: false } : r));
    render(<CheckReport results={results} />);
    expect(verdicts().filter((v) => v === "fail")).toHaveLength(1);
    expect(verdicts().filter((v) => v === "pass")).toHaveLength(7);
  });

  it("names each rule in words", () => {
    render(<CheckReport results={allPass} />);
    for (const label of [
      "Kind on the list",
      "Slots filled",
      "One ask",
      "No number in the ask",
      "Fits the channel",
      "Glossary words",
      "No guilt",
      "Readability",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("lists the rules in the union's order whatever order the results arrive in", () => {
    render(<CheckReport results={[...allPass].reverse()} />);
    const labels = [...document.querySelectorAll('[data-slot="check-report-rule"]')].map(
      (r) => r.textContent,
    );
    expect(labels[0]).toContain("Kind on the list");
    expect(labels[7]).toContain("Readability");
  });

  it("lists only the rules that ran", () => {
    render(<CheckReport results={[{ rule: "one-ask", pass: true }]} />);
    expect(verdicts()).toEqual(["pass"]);
  });

  it("shows the detail beside the verdict", () => {
    render(<CheckReport results={[{ rule: "no-guilt", pass: false, detail: 'found "you missed"' }]} />);
    expect(document.querySelector('[data-slot="check-report-rule"]')!.textContent).toContain(
      'found "you missed"',
    );
  });

  it("states the fallback when it was used", () => {
    render(<CheckReport results={allPass} fallback />);
    expect(document.querySelector('[data-slot="check-report-fallback"]')!.textContent).toBe(
      "Sent the template instead",
    );
  });

  it("says nothing about a fallback that did not happen", () => {
    render(<CheckReport results={allPass} />);
    expect(document.querySelector('[data-slot="check-report-fallback"]')).toBeNull();
  });

  it("names the channel it checked for", () => {
    render(<CheckReport results={allPass} channel="chat" />);
    expect(screen.getByRole("region", { name: "Output checks for chat" })).toBeInTheDocument();
  });

  it("is a labelled region without a channel", () => {
    render(<CheckReport results={allPass} />);
    expect(screen.getByRole("region", { name: "Output checks" })).toBeInTheDocument();
  });

  it("passes className through", () => {
    render(<CheckReport className="test-class" results={allPass} />);
    expect(document.querySelector('[data-slot="check-report"]')!.className).toContain("test-class");
  });
});
