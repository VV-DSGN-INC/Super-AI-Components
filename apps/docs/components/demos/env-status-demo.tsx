"use client";

import { EnvStatus, type EnvStatusProvider } from "@/registry/super-ai/env-status";

/**
 * The same four states this component declares, on the same kind of
 * providers `connection-manager`'s own demo configures — configuration and
 * liveness over one shared set of facts, not two unrelated lists.
 */
const PROVIDERS: EnvStatusProvider[] = [
  { id: "openai", name: "OpenAI", state: "ok", checkedAt: "Checked 30 seconds ago" },
  { id: "anthropic", name: "Anthropic", state: "degraded", checkedAt: "Checked just now" },
  { id: "replicate", name: "Replicate", state: "key-invalid", checkedAt: "Checked 2 minutes ago" },
  { id: "llama", name: "Llama 3.1 8B (local)", state: "not-running", checkedAt: "Checked 1 minute ago" },
];

export default function EnvStatusDemo() {
  return <EnvStatus label="Provider status" providers={PROVIDERS} />;
}
