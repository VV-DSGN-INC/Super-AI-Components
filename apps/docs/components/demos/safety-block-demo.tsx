"use client";
import { SafetyBlock } from "@/registry/super-ai/safety-block";

export default function SafetyBlockDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <SafetyBlock
        variant="input-blocked"
        policy="Clinical advice boundary"
        fragment="what dosage should this patient take"
        alternatives="Clinical questions go to the medical information team."
      />
      <SafetyBlock
        variant="output-blocked"
        policy="Member data — minimum necessary"
        fragment="member 449-22-8801"
        sensitive
        alternatives="Request access in the member records system."
      />
    </div>
  );
}
