import { BorderBeam } from "@/components/marketing/border-beam";
export default function BorderBeamDemo() {
  return (
    <div className="bg-background relative w-80 overflow-hidden rounded-xl border p-6">
      <h3 className="text-lg font-semibold">Pro plan</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        Everything in Free, plus the parts you actually came for.
      </p>
      <BorderBeam />
    </div>
  );
}
