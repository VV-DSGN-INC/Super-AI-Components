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
            // The painted surface rebinds the variable rather than restyling
            // the icon: muted content on a muted surface measures 4.34:1
            // against a 4.5:1 minimum. See docs/design-system/a11y-baseline.md.
            className="bg-muted flex size-8 items-center justify-center rounded-full border [--muted-foreground:var(--accent-foreground)]"
          >
            <Icon className="text-muted-foreground size-4" />
          </span>
        ))}
      </OrbitingCircles>
    </div>
  );
}
