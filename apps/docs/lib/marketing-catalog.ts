// collision guard only — marketing stays decoupled from the super-ai catalog otherwise
import { CATALOG } from "./catalog";

export interface MarketingItem {
  name: string;
  title: string;
  description: string;
  group: "Layout" | "Text" | "Buttons" | "Effects";
}

// Grows one entry per component task (Tasks 6–20). Order within a group = sidebar order.
export const MARKETING_ITEMS: MarketingItem[] = [
  {
    name: "dot-pattern",
    title: "Dot Pattern",
    description: "SVG dot grid backdrop with optional radial fade.",
    group: "Effects",
  },
  {
    name: "pulsating-button",
    title: "Pulsating Button",
    description: "Primary button with a soft expanding pulse halo.",
    group: "Buttons",
  },
  {
    name: "ripple-button",
    title: "Ripple Button",
    description: "Button that ripples out from the click point.",
    group: "Buttons",
  },
  {
    name: "rainbow-button",
    title: "Rainbow Button",
    description: "CTA with an animated five-stop gradient border and glow.",
    group: "Buttons",
  },
  {
    name: "marquee",
    title: "Marquee",
    description: "Infinite scroller for logos and testimonials.",
    group: "Layout",
  },
  {
    name: "orbiting-circles",
    title: "Orbiting Circles",
    description: "Icons orbiting a center on a dashed path.",
    group: "Effects",
  },
  {
    name: "border-beam",
    title: "Border Beam",
    description: "A light beam tracing a container's border.",
    group: "Effects",
  },
  {
    name: "aurora-text",
    title: "Aurora Text",
    description: "Gradient text with slowly drifting aurora hues.",
    group: "Text",
  },
  {
    name: "bento-grid",
    title: "Bento Grid",
    description: "Feature grid of cards with hover-revealed CTAs.",
    group: "Layout",
  },
  {
    name: "number-ticker",
    title: "Number Ticker",
    description: "Counts a stat up (or down) when it scrolls into view.",
    group: "Text",
  },
  {
    name: "typing-animation",
    title: "Typing Animation",
    description: "Typewriter text with an optional caret.",
    group: "Text",
  },
];

export const MARKETING_GROUPS = ["Layout", "Text", "Buttons", "Effects"] as const;
export const MARKETING = MARKETING_ITEMS.map((i) => i.name);
export type MarketingName = string;

const collisions = MARKETING.filter((n, i) => MARKETING.indexOf(n) !== i || CATALOG.includes(n));
if (collisions.length) {
  throw new Error(`Marketing catalog name collisions: ${collisions.join(", ")}`);
}
