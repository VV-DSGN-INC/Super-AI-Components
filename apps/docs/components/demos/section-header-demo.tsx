"use client";
import { SectionHeader } from "@/registry/super-ai/section-header";

export default function SectionHeaderDemo() {
  return (
    <div className="w-full max-w-sm space-y-4">
      <SectionHeader title="Recent projects" count={12} action={<a href="#">View all</a>} />
      <SectionHeader title="Filters" collapsible defaultOpen />
      <SectionHeader title="Elements" size="sm" />
    </div>
  );
}
