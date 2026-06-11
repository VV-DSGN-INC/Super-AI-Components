import * as React from "react";

import { cn } from "@/lib/utils";

interface DateSectionProps extends React.ComponentProps<"section"> {
  label: string;
}

function DateSection({ label, className, children, ...props }: DateSectionProps) {
  const id = React.useId();
  return (
    <section
      data-slot="date-section"
      role="group"
      aria-labelledby={id}
      className={cn("space-y-1", className)}
      {...props}
    >
      <h3
        id={id}
        data-slot="date-section-label"
        className="text-muted-foreground px-2 py-1 text-xs font-medium"
      >
        {label}
      </h3>
      {children}
    </section>
  );
}

export { DateSection };
