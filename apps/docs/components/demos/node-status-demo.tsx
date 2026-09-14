import { FLOW_STATUSES } from "@/registry/super-ai/flow-types";
import { NodeStatusBadge } from "@/registry/super-ai/node-status";

export default function NodeStatusDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {FLOW_STATUSES.map((status) => (
          <NodeStatusBadge key={status} status={status} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {FLOW_STATUSES.map((status) => (
          <NodeStatusBadge key={status} status={status} compact />
        ))}
      </div>
    </div>
  );
}
