import { MediaSlot } from "@/registry/super-ai/flow/media-slot";

export default function MediaSlotDemo() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Image – empty state */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Image · idle</p>
        <MediaSlot kind="image" status="idle" />
      </div>

      {/* Image – streaming shimmer */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Image · streaming</p>
        <MediaSlot kind="image" status="streaming" />
      </div>

      {/* Image – done with source */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Image · done</p>
        <MediaSlot kind="image" status="done" src="/stubs/image-1.webp" alt="Generated image stub" />
      </div>

      {/* Video – done with native player */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Video · done</p>
        <MediaSlot kind="video" status="done" src="/stubs/video-1.mp4" />
      </div>
    </div>
  );
}
