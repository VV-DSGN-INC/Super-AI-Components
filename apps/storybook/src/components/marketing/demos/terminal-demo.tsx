import { AnimatedSpan, Terminal, TerminalTyping } from "@/components/marketing/terminal";

export default function TerminalDemo() {
  return (
    <Terminal title="~/my-app">
      <TerminalTyping duration={30}>$ npx shadcn@latest add marquee</TerminalTyping>
      <AnimatedSpan delay={1600} className="text-muted-foreground">
        ✔ Checking registry.
      </AnimatedSpan>
      <AnimatedSpan delay={2100} className="text-muted-foreground">
        ✔ Installing dependencies.
      </AnimatedSpan>
      <AnimatedSpan delay={2600} className="text-muted-foreground">
        ✔ Created components/marketing/marquee.tsx
      </AnimatedSpan>
      <AnimatedSpan delay={3100}>Done in 4.2s ✨</AnimatedSpan>
    </Terminal>
  );
}
