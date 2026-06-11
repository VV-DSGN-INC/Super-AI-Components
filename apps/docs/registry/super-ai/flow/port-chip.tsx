import { cn } from "@/lib/utils"
import { getHandleType } from "./flow-types"

function Row({ label, types, satisfied }: { label: "IN" | "OUT"; types: string[]; satisfied?: string[] }) {
  if (!types.length) return null
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      {types.map((t) => {
        const ok = satisfied?.includes(t) ?? false
        return (
          <span key={t} data-slot="port-chip" data-satisfied={ok}
            className={cn("inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]",
              ok ? "border-transparent bg-secondary" : "opacity-70")}>
            <span aria-hidden className="size-1.5 rounded-full" style={{ background: `var(${getHandleType(t)?.cssVar ?? "--flow-text"})` }} />
            {getHandleType(t)?.label ?? t}
          </span>
        )
      })}
    </div>
  )
}

export interface PortChipsProps { in?: string[]; out?: string[]; satisfied?: string[]; className?: string }

export function PortChips({ in: ins = [], out = [], satisfied, className }: PortChipsProps) {
  return (
    <div data-slot="port-chips" className={cn("flex flex-col gap-1", className)}>
      <Row label="IN" types={ins} satisfied={satisfied} />
      <Row label="OUT" types={out} satisfied={satisfied} />
    </div>
  )
}
