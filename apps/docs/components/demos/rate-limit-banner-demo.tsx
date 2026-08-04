"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { RateLimitBanner, type RateLimitCause } from "@/registry/super-ai/rate-limit-banner";

export default function RateLimitBannerDemo() {
  const [cause, setCause] = React.useState<RateLimitCause>("your-limit");
  const [remainingSeconds, setRemainingSeconds] = React.useState(154);
  const [notified, setNotified] = React.useState(false);

  // The clock lives here, in the host, not in the component. That is the whole
  // convention: the banner renders whatever second it is handed, so the wait it
  // shows can never drift from the reset the host actually knows about.
  React.useEffect(() => {
    const id = setInterval(() => setRemainingSeconds((s) => (s <= 0 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <RateLimitBanner
        cause={cause}
        resource={cause === "your-limit" ? "Image generations · 50 of 50 used today" : "Claude Opus 4.5"}
        remainingSeconds={remainingSeconds}
        onNotifyMe={() => setNotified((on) => !on)}
        notifyEnabled={notified}
        action={
          <Button type="button" variant="outline" size="sm">
            {cause === "your-limit" ? "Upgrade plan" : "Use a faster model"}
          </Button>
        }
      />

      {/* Stands in for the composer the banner sits above. */}
      <div className="border-input text-muted-foreground rounded-lg border px-3 py-2 text-sm">
        Describe what you want to make…
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCause((c) => (c === "your-limit" ? "provider-capacity" : "your-limit"))}
        >
          Swap cause
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setRemainingSeconds(154)}>
          Restart countdown
        </Button>
      </div>
    </div>
  );
}
