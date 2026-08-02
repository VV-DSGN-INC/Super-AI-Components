import fs from "node:fs";
import path from "node:path";

import { notFound } from "next/navigation";

import AuroraTextDemo from "@/components/demos/aurora-text-demo";
import BentoGridDemo from "@/components/demos/bento-grid-demo";
import BorderBeamDemo from "@/components/demos/border-beam-demo";
import ChoiceChipsDemo from "@/components/demos/choice-chips-demo";
import ConfettiDemo from "@/components/demos/confetti-demo";
import CostChipDemo from "@/components/demos/cost-chip-demo";
import DateSectionDemo from "@/components/demos/date-section-demo";
import DotPatternDemo from "@/components/demos/dot-pattern-demo";
import EntityRowDemo from "@/components/demos/entity-row-demo";
import FieldRowDemo from "@/components/demos/field-row-demo";
import FilterBarDemo from "@/components/demos/filter-bar-demo";
import GenSettingsBarDemo from "@/components/demos/gen-settings-bar-demo";
import HeroVideoDialogDemo from "@/components/demos/hero-video-dialog-demo";
import KbdDemo from "@/components/demos/kbd-demo";
import MarqueeDemo from "@/components/demos/marquee-demo";
import NumberTickerDemo from "@/components/demos/number-ticker-demo";
import OrbitingCirclesDemo from "@/components/demos/orbiting-circles-demo";
import PreviewTileDemo from "@/components/demos/preview-tile-demo";
import PulsatingButtonDemo from "@/components/demos/pulsating-button-demo";
import RainbowButtonDemo from "@/components/demos/rainbow-button-demo";
import ResetAffordanceDemo from "@/components/demos/reset-affordance-demo";
import RippleButtonDemo from "@/components/demos/ripple-button-demo";
import SectionHeaderDemo from "@/components/demos/section-header-demo";
import ShortcutsSheetDemo from "@/components/demos/shortcuts-sheet-demo";
import StatReadoutDemo from "@/components/demos/stat-readout-demo";
import TerminalDemo from "@/components/demos/terminal-demo";
import TextAnimateDemo from "@/components/demos/text-animate-demo";
import ThreadListDemo from "@/components/demos/thread-list-demo";
import TypingAnimationDemo from "@/components/demos/typing-animation-demo";
import { PreviewTabs } from "@/components/preview-tabs";
import { CATALOG, CATALOG_ITEMS, type CatalogName } from "@/lib/catalog";
import { MARKETING, MARKETING_ITEMS, type MarketingName } from "@/lib/marketing-catalog";

const demos: Record<CatalogName, React.ComponentType> = {
  kbd: KbdDemo,
  "cost-chip": CostChipDemo,
  "date-section": DateSectionDemo,
  "choice-chips": ChoiceChipsDemo,
  "filter-bar": FilterBarDemo,
  "field-row": FieldRowDemo,
  "gen-settings-bar": GenSettingsBarDemo,
  "preview-tile": PreviewTileDemo,
  "entity-row": EntityRowDemo,
  "section-header": SectionHeaderDemo,
  "reset-affordance": ResetAffordanceDemo,
  "stat-readout": StatReadoutDemo,
  "shortcuts-sheet": ShortcutsSheetDemo,
  "thread-list": ThreadListDemo,
};

// Grows one entry per component task (Tasks 6–20).
const marketingDemos: Record<MarketingName, React.ComponentType> = {
  "dot-pattern": DotPatternDemo,
  "pulsating-button": PulsatingButtonDemo,
  "ripple-button": RippleButtonDemo,
  "rainbow-button": RainbowButtonDemo,
  marquee: MarqueeDemo,
  "orbiting-circles": OrbitingCirclesDemo,
  "border-beam": BorderBeamDemo,
  "aurora-text": AuroraTextDemo,
  "bento-grid": BentoGridDemo,
  "number-ticker": NumberTickerDemo,
  "typing-animation": TypingAnimationDemo,
  "text-animate": TextAnimateDemo,
  terminal: TerminalDemo,
  "hero-video-dialog": HeroVideoDialogDemo,
  confetti: ConfettiDemo,
};

export function generateStaticParams() {
  return [...CATALOG, ...MARKETING].map((name) => ({ name }));
}

export default async function ComponentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const isMarketing = MARKETING.includes(name);
  if (!CATALOG.includes(name as CatalogName) && !isMarketing) notFound();

  const item = isMarketing
    ? MARKETING_ITEMS.find((i) => i.name === name)!
    : CATALOG_ITEMS.find((i) => i.name === name)!;
  const Demo = isMarketing ? marketingDemos[name] : demos[name as CatalogName];
  if (!Demo) {
    throw new Error(`No demo registered for "${name}" in ${isMarketing ? "marketingDemos" : "demos"}`);
  }

  const demoSource = fs.readFileSync(
    path.join(process.cwd(), "components/demos", `${name}-demo.tsx`),
    "utf8",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{item.title}</h1>
        <p className="text-muted-foreground mt-2">{item.description}</p>
      </div>

      <PreviewTabs preview={<Demo />} code={demoSource} />

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Installation</h2>
        <pre className="bg-muted overflow-x-auto rounded-lg p-4 text-xs">
          <code>{`npx shadcn@latest add https://super-ai-components.vercel.app/r/${name}.json`}</code>
        </pre>
      </div>
    </div>
  );
}
