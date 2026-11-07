"use client";

import { ContentCredentials } from "@/registry/super-ai/content-credentials";

export default function ContentCredentialsDemo() {
  return (
    <ContentCredentials
      trigger="popover"
      credentials={{
        status: "verified",
        origin: "ai-edited",
        issuer: "Example Issuer CA",
        model: "Flux 1.1 Pro",
        generatedAt: "2026-10-12T09:30:00Z",
        edits: [
          { action: "Generated", by: "Flux 1.1 Pro", at: "2026-10-12T09:30:00Z" },
          { action: "Cropped", by: "Crop tool", at: "2026-10-12T09:41:00Z" },
          { action: "Generative fill", by: "Inpaint tool", at: "2026-10-12T10:05:00Z" },
        ],
      }}
    />
  );
}
