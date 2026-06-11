import { MediaSlot } from "@/registry/super-ai/flow/media-slot"

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
        <MediaSlot
          kind="image"
          status="done"
          src="https://images.unsplash.com/photo-1682686581580-d99b0230064e?w=800&q=80"
          alt="AI generated landscape"
        />
      </div>

      {/* Audio – done with native player */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Audio · done</p>
        <MediaSlot
          kind="audio"
          status="done"
          src="https://www.w3schools.com/html/horse.ogg"
        />
      </div>
    </div>
  )
}
