"use client";

import { PrivateSessionChip, PrivateSessionNotice } from "@/registry/super-ai/private-session-notice";

const STATEMENT =
  "This chat will not be saved to history or memory, and will not be used to train models. Your prompts, files and outputs stay out of personalisation.";

export default function PrivateSessionNoticeDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <PrivateSessionNotice state="entering" statement={STATEMENT} />
      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <span className="text-sm font-medium">Untitled chat</span>
        <PrivateSessionChip />
      </div>
      <PrivateSessionNotice
        state="connectors-reduced"
        statement={STATEMENT}
        connectors={[
          { name: "Calendar", scope: "off" },
          { name: "Drive", scope: "reduced", detail: "Read-only, no history" },
        ]}
      />
    </div>
  );
}
