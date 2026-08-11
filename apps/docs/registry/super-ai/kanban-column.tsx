"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  GROUP_HEADER_CLASS,
  GROUP_TONE_MARK,
  groupAccessibleName,
} from "@/registry/super-ai/data-views-shared";
import type { GroupTone } from "@/registry/super-ai/data-views-shared";

export interface KanbanColumnProps {
  title: string;
  count: number;
  tone?: GroupTone;
  children?: ReactNode;
  className?: string;
}

export function KanbanColumn({ title, count, tone = "neutral", children, className }: KanbanColumnProps) {
  return (
    <section
      data-slot="kanban-column"
      aria-label={groupAccessibleName(title, count, tone)}
      className={cn("bg-muted/40 flex min-w-64 flex-col rounded-lg border", className)}
    >
      {/* The header is never tinted. Tone rides on the mark, because this
          system's two chromatic tokens are not legal as label colours — see
          GROUP_TONE_MARK. The tone word reaches assistive tech through the
          section's accessible name above, not through a second visible label. */}
      <header className={GROUP_HEADER_CLASS}>
        {GROUP_TONE_MARK[tone]}
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="ml-auto text-xs tabular-nums opacity-70">{count}</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">{children}</div>
    </section>
  );
}
