"use client";

import { PermissionPrompt } from "@/registry/super-ai/permission-prompt";

export default function PermissionPromptDemo() {
  return (
    <PermissionPrompt
      open
      action="Send email to finance@acme.com"
      reason="The invoice PDF finished rendering and this recipient is on the approved list from the last three runs."
      args={[
        { key: "to", value: "finance@acme.com" },
        { key: "subject", value: "Q3 invoice — ready for review" },
        { key: "attachment", value: "q3-invoice.pdf" },
      ]}
      onAllowOnce={() => {}}
      onAlwaysAllow={() => {}}
      onDeny={() => {}}
      onEditFirst={() => {}}
    />
  );
}
