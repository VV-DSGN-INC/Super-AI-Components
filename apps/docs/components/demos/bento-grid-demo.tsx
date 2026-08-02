import { Cpu, Layers, Zap } from "lucide-react";

import { BentoCard, BentoGrid } from "@/registry/marketing/bento-grid";
import { DotPattern } from "@/registry/marketing/dot-pattern";

export default function BentoGridDemo() {
  return (
    <BentoGrid className="max-w-2xl">
      <BentoCard
        className="col-span-2"
        name="Batteries included"
        description="Auth, billing, and analytics wired on day one."
        icon={<Layers />}
        background={<DotPattern fade />}
      />
      <BentoCard name="Fast by default" description="Edge-rendered, everywhere." icon={<Zap />} />
      <BentoCard name="Own your stack" description="Eject anything, anytime." icon={<Cpu />} />
      <BentoCard
        className="col-span-2"
        name="Scales quietly"
        description="From side project to seed round without a rewrite."
        icon={<Layers />}
      />
    </BentoGrid>
  );
}
