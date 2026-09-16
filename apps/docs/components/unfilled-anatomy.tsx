import { Badge } from "@/components/ui/badge";
import type { DocsSlot } from "@/lib/component-docs";

/** D29: an unfilled pattern draws its anatomy as labelled grey boxes, in
 *  declaration order, in the same frame the composition would fill. Generated,
 *  not drawn, and in the tone of the working board's wireframe tiles, so a
 *  hole in the catalog is visible on the site rather than hidden behind a
 *  nicer picture. */
export function UnfilledAnatomy({ anatomy, because }: { anatomy: DocsSlot[]; because?: string }) {
  return (
    <div data-slot="unfilled-anatomy" className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline">Unfilled</Badge>
        <span>{because}</span>
      </div>
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {anatomy.map((slot, i) => (
          <li
            key={slot.slot}
            className="flex min-h-20 flex-col gap-1 rounded-md border border-dashed p-3 text-xs"
          >
            <span className="font-medium">
              {i + 1}. <code>{slot.slot}</code>
            </span>
            <span>{slot.note}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
