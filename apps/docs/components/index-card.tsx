import Link from "next/link";
import type * as React from "react";

import { Badge } from "@/components/ui/badge";

export interface IndexCardProps {
  href: string;
  title: string;
  description: string;
  /** Small caps line above the title: the stage or the family. */
  kicker?: string;
  /** Registry names; three shown, the rest counted. */
  chips?: string[];
  badge?: string;
}

export function IndexCard({ href, title, description, kicker, chips = [], badge }: IndexCardProps) {
  const shown = chips.slice(0, 3);
  const rest = chips.length - shown.length;
  return (
    // The hover ground is `bg-accent`, and the description below is
    // `text-muted-foreground`: 4.34:1 against a 4.5:1 minimum. Rebinding the
    // variable on the card retints every muted descendant at once, which a
    // slot-level override cannot reach (a11y-baseline.md).
    <Link
      href={href}
      className="bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground hover:[--muted-foreground:var(--accent-foreground)] flex flex-col gap-2 rounded-lg border p-4 text-sm transition-colors"
    >
      {kicker ? (
        <span className="text-muted-foreground text-xs tracking-wider uppercase">{kicker}</span>
      ) : null}
      <span className="flex items-center gap-2">
        <span className="font-medium">{title}</span>
        {badge ? <Badge variant="outline">{badge}</Badge> : null}
      </span>
      <span className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">{description}</span>
      {shown.length ? (
        <span className="mt-auto flex flex-wrap gap-1 pt-1">
          {shown.map((c) => (
            <code key={c} className="rounded border px-1 py-0.5 text-[11px]">
              {c}
            </code>
          ))}
          {rest > 0 ? <span className="text-xs">+{rest}</span> : null}
        </span>
      ) : null}
    </Link>
  );
}

export function IndexGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
