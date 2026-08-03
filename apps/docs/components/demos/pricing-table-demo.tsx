"use client";
import { useState } from "react";

import { PricingTable } from "@/registry/super-ai/pricing-table";

export default function PricingTableDemo() {
  const [storage, setStorage] = useState(false);

  return (
    <div className="w-full">
      <PricingTable
        plans={[
          {
            name: "Free",
            description: "Try the models",
            monthly: 0,
            yearly: 0,
            current: true,
            featureGroups: [{ title: "Generation", features: ["50 images / month", "Standard queue"] }],
          },
          {
            name: "Pro",
            description: "For daily work",
            monthly: 20,
            yearly: 16,
            highlighted: true,
            featureGroups: [
              { title: "Generation", features: ["Unlimited images", "Priority queue", "All models"] },
              { title: "Collaboration", features: ["5 seats", "Shared library"] },
            ],
          },
          {
            name: "Team",
            description: "For studios",
            monthly: 60,
            yearly: 50,
            featureGroups: [
              { title: "Generation", features: ["Unlimited images", "Dedicated capacity"] },
              { title: "Collaboration", features: ["Unlimited seats", "Usage dashboard"] },
            ],
          },
        ]}
        addOns={[
          {
            name: "Extra storage",
            description: "1 TB of asset storage",
            monthly: 5,
            yearly: 4,
            enabled: storage,
            onToggle: setStorage,
          },
        ]}
      />
    </div>
  );
}
