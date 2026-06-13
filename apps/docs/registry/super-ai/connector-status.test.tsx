import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ConnectorState } from "./agent-types";
import { ConnectorStatus } from "./connector-status";

const connectors: ConnectorState[] = [
  { id: "c1", name: "github-mcp", health: "connected", toolCount: 12, latencyMs: 45 },
  { id: "c2", name: "figma-mcp", health: "auth-needed" },
  { id: "c3", name: "sql-mcp", health: "error", toolCount: 0 },
];

describe("ConnectorStatus", () => {
  it("renders one chip per connector with health on data-health", () => {
    render(<ConnectorStatus connectors={connectors} />);
    expect(screen.getByText("github-mcp").closest("[data-slot='connector-chip']")).toHaveAttribute(
      "data-health",
      "connected",
    );
    expect(screen.getByText("figma-mcp").closest("[data-slot='connector-chip']")).toHaveAttribute(
      "data-health",
      "auth-needed",
    );
  });

  it("expands a connector to show tools and latency, and fires onConnectorSelect", async () => {
    const onConnectorSelect = vi.fn();
    render(<ConnectorStatus connectors={connectors} onConnectorSelect={onConnectorSelect} />);
    const chip = screen.getByRole("button", { name: "Toggle detail for github-mcp" });
    await userEvent.click(chip);
    expect(screen.getByText("12 tools")).toBeInTheDocument();
    expect(screen.getByText("45ms")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Open github-mcp" }));
    expect(onConnectorSelect).toHaveBeenCalledWith("c1");
  });

  it("renders an empty state with no connectors", () => {
    render(<ConnectorStatus connectors={[]} />);
    expect(screen.getByText("No connectors configured.")).toBeInTheDocument();
  });
});
