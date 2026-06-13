"use client";

import { Box, Filter, ShieldAlert, TriangleAlert, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { GuardrailKind } from "./agent-types";

const KIND_ICON: Record<GuardrailKind, React.ReactNode> = {
  refusal: <ShieldAlert className="size-4" aria-hidden />,
  degraded: <TriangleAlert className="size-4" aria-hidden />,
  sandbox: <Box className="size-4" aria-hidden />,
  filter: <Filter className="size-4" aria-hidden />,
};

interface SafetyBannerProps extends React.ComponentProps<"div"> {
  kind: GuardrailKind;
  message: string;
  onDismiss?: () => void;
}

function SafetyBanner({ kind, message, onDismiss, className, ...props }: SafetyBannerProps) {
  return (
    <div
      data-slot="safety-banner"
      data-kind={kind}
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm text-foreground",
        kind === "degraded" && "border-destructive/50",
        className,
      )}
      {...props}
    >
      <span className="text-muted-foreground">{KIND_ICON[kind]}</span>
      <p className="min-w-0 flex-1">{message}</p>
      {onDismiss && (
        <Button type="button" variant="ghost" size="icon" aria-label="Dismiss" onClick={onDismiss}>
          <X className="size-3.5" aria-hidden />
        </Button>
      )}
    </div>
  );
}

export { SafetyBanner };
export type { SafetyBannerProps };
