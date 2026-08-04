"use client";
import { QuotaMeter } from "@/registry/super-ai/quota-meter";

export default function QuotaMeterDemo() {
  return (
    <div className="w-full max-w-sm">
      <QuotaMeter
        resources={[
          { label: "Messages", used: 1240, limit: 5000, resetsIn: "Resets in 12 days" },
          { label: "Image generations", used: 168, limit: 200, resetsIn: "Resets in 12 days" },
          { label: "Video minutes", used: 30, limit: 30, unit: "min", resetsIn: "Resets in 12 days" },
        ]}
      />
    </div>
  );
}
