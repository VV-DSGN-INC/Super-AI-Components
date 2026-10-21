"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { CaptureConsent, type CaptureConsentState } from "@/registry/super-ai/capture-consent";

const PEOPLE = ["Priya", "Marcus", "Dana"];

export default function CaptureConsentDemo() {
  const [state, setState] = React.useState<CaptureConsentState>("pre-notice");
  const [sharing, setSharing] = React.useState(false);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-foreground text-sm">Topbar privacy slot</span>
        <CaptureConsent form="compact" state={state} />
      </div>
      <CaptureConsent
        state={state}
        participants={PEOPLE}
        declinedBy={["Marcus"]}
        elapsedLabel="12:04"
        sharing={sharing}
        onSharingChange={setSharing}
        kept="Summary and action items"
        deleted="Audio and transcript"
        onStartCapture={(info) => {
          setSharing(info.sharing);
          setState("recording");
        }}
        onStopCapture={() => setState("ended")}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setState("others-notified")}>
          Notice delivered
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setState("declined")}>
          Someone declines
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setState("pre-notice")}>
          Reset
        </Button>
      </div>
    </div>
  );
}
