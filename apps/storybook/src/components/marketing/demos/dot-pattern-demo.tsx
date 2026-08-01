import { DotPattern } from "@/components/marketing/dot-pattern";
export default function DotPatternDemo() {
  return (
    <div className="bg-background relative flex h-64 w-full items-center justify-center overflow-hidden rounded-xl border">
      <DotPattern fade />
      <p className="z-10 text-2xl font-semibold">Backdrops that behave</p>
    </div>
  );
}
