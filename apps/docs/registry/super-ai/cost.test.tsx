import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CostProvider, formatCost, formatShortfall, useCost, type Cost } from "./cost";

/** Renders whatever useCost resolves, so the hook can be asserted through the DOM. */
function Probe({ local }: { local?: Cost }) {
  const resolved = useCost(local);
  return (
    <>
      <span data-testid="text">{resolved.cost ? formatCost(resolved.cost) : ""}</span>
      <span data-testid="insufficient">{String(resolved.insufficient)}</span>
      <span data-testid="shortfall">{resolved.shortfall}</span>
    </>
  );
}

const text = () => screen.getByTestId("text").textContent;
const insufficient = () => screen.getByTestId("insufficient").textContent;
const shortfall = () => screen.getByTestId("shortfall").textContent;

describe("useCost", () => {
  it("derives insufficient from balance < amount", () => {
    render(
      <CostProvider balance={2}>
        <Probe local={{ amount: 4 }} />
      </CostProvider>,
    );
    expect(insufficient()).toBe("true");
    expect(shortfall()).toBe("2");
  });

  it("cannot have insufficient overridden by a prop", () => {
    // The only way to say "insufficient" is to make it true — there is no prop
    // for it on Cost at all, which is the point. A caller who wants to claim a
    // cost is unaffordable has to supply a balance that makes it so.
    const cost = { amount: 4, insufficient: true } as unknown as Cost;
    render(
      <CostProvider balance={10}>
        <Probe local={cost} />
      </CostProvider>,
    );
    expect(insufficient()).toBe("false");
    expect(shortfall()).toBe("0");
  });

  it("lets props beat context", () => {
    render(
      <CostProvider cost={{ amount: 900 }} balance={1000}>
        <Probe local={{ amount: 55 }} />
      </CostProvider>,
    );
    expect(text()).toBe("55 credits");
    expect(insufficient()).toBe("false");
  });

  it("lets context beat nothing", () => {
    render(
      <CostProvider cost={{ amount: 900 }} balance={100}>
        <Probe />
      </CostProvider>,
    );
    expect(text()).toBe("900 credits");
    expect(insufficient()).toBe("true");
  });

  it("renders nothing rather than a zero when there is no cost anywhere", () => {
    render(<Probe />);
    expect(text()).toBe("");
    expect(insufficient()).toBe("false");
  });

  it("works with no provider at all, which is the single-file install case", () => {
    render(<Probe local={{ amount: 55 }} />);
    expect(text()).toBe("55 credits");
    // No balance is knowable, so nothing is called unaffordable.
    expect(insufficient()).toBe("false");
  });

  it("does not call a cost unaffordable while it is still being estimated", () => {
    render(
      <CostProvider balance={1}>
        <Probe local={{ amount: 900, status: "estimating" }} />
      </CostProvider>,
    );
    expect(insufficient()).toBe("false");
  });
});

describe("formatCost", () => {
  it("is the same output for the same Cost across every consumer", () => {
    const cost: Cost = { amount: 55 };
    // Two independent trees, one provider each, same value in — same text out.
    const { unmount } = render(<Probe local={cost} />);
    const first = text();
    unmount();
    render(
      <CostProvider cost={cost} balance={100}>
        <Probe />
      </CostProvider>,
    );
    expect(text()).toBe(first);
    expect(first).toBe(formatCost(cost));
  });

  it("renders the rate form", () => {
    expect(formatCost({ amount: 900, per: "min" })).toBe("900 credits/min");
  });

  it("never renders a stale amount while estimating", () => {
    expect(formatCost({ amount: 900, status: "estimating" })).toBe("Estimating…");
    expect(formatCost({ amount: 900, status: "estimating" })).not.toContain("900");
  });

  it("says so when a cost is unavailable rather than showing a number", () => {
    expect(formatCost({ amount: 0, status: "unavailable" })).toBe("Cost unavailable");
  });

  it("singularises the unit at one, so no surface can print '1 credits'", () => {
    expect(formatCost({ amount: 1 })).toBe("1 credit");
    expect(formatCost({ amount: 2 })).toBe("2 credits");
    expect(formatCost({ amount: 1, unit: "minutes" })).toBe("1 minute");
  });

  it("rounds in one place, so two surfaces cannot round differently", () => {
    expect(formatCost({ amount: 17.00001 })).toBe("17 credits");
    expect(formatCost({ amount: 0.12345, unit: "tokens" })).toBe("0.1235 tokens");
  });

  it("groups large amounts", () => {
    expect(formatCost({ amount: 12500 })).toBe("12,500 credits");
  });
});

describe("formatShortfall", () => {
  it("phrases the gap once, for every surface", () => {
    expect(
      formatShortfall({ cost: { amount: 4 }, balance: 2, insufficient: true, shortfall: 2 }),
    ).toBe("Need 4 credits, you have 2");
  });

  it("is undefined when the cost is affordable", () => {
    expect(
      formatShortfall({ cost: { amount: 4 }, balance: 10, insufficient: false, shortfall: 0 }),
    ).toBeUndefined();
  });
});
