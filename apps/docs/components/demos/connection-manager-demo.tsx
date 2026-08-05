"use client";

import * as React from "react";

import { ConnectionManager, type ConnectionProvider } from "@/registry/super-ai/connection-manager";

/**
 * The demo owns what a real settings page owns: the stored fingerprints and the
 * verdict of each test. The component never holds a key — this stands in for the
 * backend that does. Note that saving produces a fingerprint and no verdict, and
 * that only "Test connection" can tell `invalid` from `unreachable`.
 */
const INITIAL: ConnectionProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    status: "valid",
    fingerprint: "sk-live ···· 4f2a",
    testedAt: "Tested 4 minutes ago",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    status: "invalid",
    fingerprint: "sk-ant ···· 91bd",
    testedAt: "Tested just now",
  },
  {
    id: "replicate",
    name: "Replicate",
    status: "unreachable",
    fingerprint: "r8 ···· 0c17",
    testedAt: "Tested 30 seconds ago",
  },
  { id: "mistral", name: "Mistral", status: "not-set" },
  {
    id: "llama",
    name: "Llama 3.1 8B (local)",
    status: "not-set",
    local: {
      size: "4.7 GB",
      requirements: [
        { label: "Memory", value: "16 GB RAM", met: true },
        { label: "Disk", value: "12 GB free", met: true },
        { label: "Accelerator", value: "Apple silicon or CUDA GPU", met: false },
      ],
    },
  },
];

// A stand-in for whatever the network actually reports back.
const VERDICT: Record<string, ConnectionProvider["status"]> = {
  openai: "valid",
  anthropic: "invalid",
  replicate: "unreachable",
  mistral: "valid",
  llama: "valid",
};

export default function ConnectionManagerDemo() {
  const [providers, setProviders] = React.useState(INITIAL);

  const patch = (id: string, next: Partial<ConnectionProvider>) =>
    setProviders((current) => current.map((p) => (p.id === id ? { ...p, ...next } : p)));

  return (
    <ConnectionManager
      label="Model providers"
      description="Bring your own keys, or run a model on this machine."
      providers={providers}
      onSaveKey={(id, key) =>
        // The key is used once, to derive a fingerprint, and is never put back
        // into state. Status stays "not-set" until a test says otherwise.
        patch(id, {
          fingerprint: `${key.slice(0, 2)} ···· ${key.slice(-4)}`,
          status: "not-set",
          testedAt: undefined,
        })
      }
      onTest={(id) => {
        patch(id, { testing: true });
        setTimeout(
          () => patch(id, { testing: false, status: VERDICT[id], testedAt: "Tested just now" }),
          900,
        );
      }}
      onDownload={(id) => patch(id, { status: "valid", testedAt: "Installed just now" })}
    />
  );
}
