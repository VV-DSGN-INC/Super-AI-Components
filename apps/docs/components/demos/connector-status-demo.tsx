import type { ConnectorState } from "@/registry/super-ai/agent-types";
import { ConnectorStatus } from "@/registry/super-ai/connector-status";

const connectors: ConnectorState[] = [
  { id: "c1", name: "github-mcp", health: "connected", toolCount: 12, latencyMs: 45 },
  { id: "c2", name: "figma-mcp", health: "auth-needed", toolCount: 8 },
  { id: "c3", name: "sql-mcp", health: "error", toolCount: 0, latencyMs: 1200 },
];

export default function ConnectorStatusDemo() {
  return <ConnectorStatus connectors={connectors} className="w-full max-w-md" />;
}
