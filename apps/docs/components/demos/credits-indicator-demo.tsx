"use client";
import { CreditsIndicator } from "@/registry/super-ai/credits-indicator";

export default function CreditsIndicatorDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <CreditsIndicator form="ring" balance={414} total={1000} onManage={() => {}} />
      <CreditsIndicator balance={82} total={1000} onManage={() => {}} />
      <CreditsIndicator balance={0} total={1000} onManage={() => {}} onTopUp={() => {}} />
    </div>
  );
}
