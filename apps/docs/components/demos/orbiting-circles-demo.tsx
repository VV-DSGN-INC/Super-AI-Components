import { Bot, Cpu, Database, Globe, Sparkles } from "lucide-react";

import { OrbitingCircles } from "@/registry/marketing/orbiting-circles";

const icons = [Bot, Cpu, Database, Globe, Sparkles];

export default function OrbitingCirclesDemo() {
  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <span className="text-lg font-semibold">Core</span>
      <OrbitingCircles radius={110}>
        {icons.map((Icon, i) => (
          <span
            key={i}
            className="bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full border"
          >
            <Icon className="size-4" />
          </span>
        ))}
      </OrbitingCircles>
    </div>
  );
}
