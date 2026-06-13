"use client";

import { SafetyBanner } from "@/registry/super-ai/safety-banner";

export default function SafetyBannerDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <SafetyBanner kind="degraded" message="Fallback model active — responses may be slower." />
      <SafetyBanner kind="sandbox" message="Code execution is sandboxed for this session." onDismiss={() => {}} />
      <SafetyBanner kind="filter" message="Content filter is active for this workspace." />
    </div>
  );
}
