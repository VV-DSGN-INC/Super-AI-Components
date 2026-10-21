"use client";

import { ContentCredentials } from "@/registry/super-ai/content-credentials";

/**
 * Live examples for content-credentials.docs.tsx.
 *
 * A client sidecar so the docs module can stay plain server-evaluable data.
 * The panel is a portal that opens on interaction, so each example shows the
 * mark a reader would meet first, next to the sentence the decision is about.
 */

export function StrippedSaysRemoved() {
  return (
    <div className="flex items-center gap-3">
      <ContentCredentials trigger="popover" credentials={{ status: "stripped" }} />
      <p className="text-foreground text-xs">
        Open it: the panel says the credentials were removed, nothing more.
      </p>
    </div>
  );
}

export function UnverifiedKeepsItsDetails() {
  return (
    <div className="flex items-center gap-3">
      <ContentCredentials
        trigger="popover"
        credentials={{
          status: "unverified",
          origin: "ai-generated",
          issuer: "Example Issuer CA",
          model: "Flux 1.1 Pro",
          generatedAt: "2026-10-12T09:30:00Z",
        }}
      />
      <p className="text-foreground text-xs">Open it: the fields stay, and the publisher reads as a claim.</p>
    </div>
  );
}

export function PlainBadgeForStripped() {
  return (
    <div className="flex items-center gap-3">
      <span className="border-border text-foreground rounded-md border px-1.5 py-0.5 text-xs font-medium">
        Human-made
      </span>
      <p className="text-foreground text-xs">
        Credentials were missing, so the tile claims a person made it.
      </p>
    </div>
  );
}

export function HoverCardOnlyOnTouch() {
  return (
    <div className="flex items-center gap-3">
      <ContentCredentials
        trigger="hover-card"
        credentials={{ status: "verified", issuer: "Example Issuer CA" }}
      />
      <p className="text-foreground text-xs">
        Hover or Tab to it. A touch screen has no hover, so this is only the right form beside a tile that is
        already a hover target.
      </p>
    </div>
  );
}
