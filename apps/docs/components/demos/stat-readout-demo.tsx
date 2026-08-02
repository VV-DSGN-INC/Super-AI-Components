"use client";
import { StatReadout } from "@/registry/super-ai/stat-readout";

export default function StatReadoutDemo() {
  return (
    <div className="w-full max-w-xs">
      <StatReadout
        items={[
          { label: "Model", value: "flux-1-dev" },
          { label: "Seed", value: "884201773", copyable: true },
          { label: "Sampler", value: "euler" },
          { label: "Guidance", value: "3.5" },
          { label: "Negative", value: undefined },
        ]}
      />
    </div>
  );
}
