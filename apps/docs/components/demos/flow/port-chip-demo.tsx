import { PortChips } from "@/registry/super-ai/flow/port-chip"

export default function PortChipDemo() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">All ports unsatisfied</p>
        <PortChips in={["text", "image"]} out={["video"]} />
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Text input satisfied</p>
        <PortChips in={["text", "image"]} out={["video"]} satisfied={["text"]} />
      </div>
    </div>
  )
}
