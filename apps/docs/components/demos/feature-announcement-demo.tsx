"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FeatureAnnouncement } from "@/registry/super-ai/feature-announcement";

/**
 * Local state stands in for whatever the consuming app actually persists
 * (localStorage, a user preference row, a feature-flag service). The component
 * only ever emits the id — it never stores anything itself, which is why the
 * reset button below can honestly bring every announcement back.
 */
export default function FeatureAnnouncementDemo() {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const dismiss = (id: string) => setDismissedIds((ids) => (ids.includes(id) ? ids : [...ids, id]));

  return (
    <div className="flex w-full max-w-md flex-col items-start gap-6">
      <div className="flex w-full flex-col items-start gap-2">
        <p className="text-xs text-muted-foreground">Modal — the product works differently now.</p>
        <Button type="button" size="sm" variant="outline" onClick={() => setModalOpen(true)}>
          Announce agent mode
        </Button>
        <FeatureAnnouncement
          id="agent-mode-launch"
          level="modal"
          stage="New"
          title="Agent mode"
          description="Hand the assistant a goal and it plans, runs, and reports back on its own."
          ctaLabel="Try agent mode"
          onCtaClick={() => console.log("agent-mode-launch: cta clicked")}
          open={modalOpen}
          onOpenChange={setModalOpen}
          dismissed={dismissedIds.includes("agent-mode-launch")}
          onDismiss={dismiss}
        />
      </div>

      <div className="flex w-full flex-col items-start gap-2">
        <p className="text-xs text-muted-foreground">Anchored — points at the control the feature lives on.</p>
        <FeatureAnnouncement
          id="timeline-markers"
          level="anchored"
          stage="Beta"
          title="Markers on the timeline"
          description="Drop a marker with M and jump between them with the bracket keys."
          ctaLabel="Show me"
          onCtaClick={() => console.log("timeline-markers: cta clicked")}
          anchorLabel="Timeline"
          defaultOpen={false}
          dismissed={dismissedIds.includes("timeline-markers")}
          onDismiss={dismiss}
        />
      </div>

      <div className="flex w-full flex-col items-start gap-2">
        <p className="text-xs text-muted-foreground">Inline card — worth reading, not worth blocking.</p>
        <FeatureAnnouncement
          id="voice-library"
          level="inline-card"
          stage="Preview"
          title="Shared voice library"
          description="Voices you clone are now available to everyone in the workspace."
          ctaLabel="Open the library"
          onCtaClick={() => console.log("voice-library: cta clicked")}
          dismissed={dismissedIds.includes("voice-library")}
          onDismiss={dismiss}
        />
      </div>

      <div className="flex w-full flex-col items-start gap-2">
        <p className="text-xs text-muted-foreground">Chip — a tweak, a rename, a limit change.</p>
        <FeatureAnnouncement
          id="export-limit-raised"
          level="dismissible-chip"
          stage="v2.4"
          title="Exports now run up to 4K"
          ctaLabel="Details"
          onCtaClick={() => console.log("export-limit-raised: cta clicked")}
          dismissed={dismissedIds.includes("export-limit-raised")}
          onDismiss={dismiss}
        />
      </div>

      {dismissedIds.length > 0 ? (
        <Button type="button" size="sm" variant="outline" onClick={() => setDismissedIds([])}>
          Show all again ({dismissedIds.length} dismissed)
        </Button>
      ) : null}
    </div>
  );
}
