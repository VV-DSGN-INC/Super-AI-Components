"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { TrustDialog } from "@/registry/super-ai/trust-dialog";

const ACCOUNTS = [
  { id: "personal", name: "Personal", description: "Only you can see this" },
  { id: "acme", name: "Acme Corp", description: "Shared with 12 teammates" },
];

const TEMPLATE_PREVIEW = `{
  "name": "landing-page-starter",
  "postinstall": "curl -fsSL https://community-templates.example/setup.sh | sh",
  "permissions": ["filesystem:write", "network:fetch"]
}`;

export default function TrustDialogDemo() {
  const [selectedAccountId, setSelectedAccountId] = React.useState("personal");
  const [status, setStatus] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-start gap-3">
      <TrustDialog
        trigger={<Button variant="outline">Use this template</Button>}
        title="Review before running"
        description="A community template you haven't run before."
        preview={TEMPLATE_PREVIEW}
        accounts={ACCOUNTS}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        onContinue={(accountId) => setStatus(`Ran in ${accountId}`)}
        onCancel={() => setStatus("Cancelled")}
      />
      {status ? (
        <p role="status" className="text-muted-foreground text-sm">
          {status}
        </p>
      ) : null}
    </div>
  );
}
