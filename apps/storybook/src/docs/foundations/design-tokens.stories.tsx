import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import css from "../../index.css?raw";

/* The token sheet, read from the stylesheet itself.
   `src/index.css` is the copy of the shadcn base-nova theme this workbench
   renders against (apps/docs/app/globals.css is the docs site's copy; the two
   have already drifted once, see "Added by the registry" below). Names and
   declared values are parsed from the raw source so a token added to the sheet
   shows up here without a second edit, and the swatches and value labels read
   the live custom properties so nothing on this page can go stale. */

type TokenValues = Map<string, string>;

function parseCustomProperties(source: string, selector: ":root" | ".dark"): TokenValues {
  const values: TokenValues = new Map();
  const block = new RegExp(`(?:^|\\n)${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "g");
  for (const match of source.matchAll(block)) {
    for (const decl of match[1].matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      // Font stacks are declared in a :root block of their own and belong to
      // Foundations → Typography; everything else in :root is a token.
      if (decl[1].startsWith("font-")) continue;
      values.set(decl[1], decl[2].replace(/\s+/g, " ").trim());
    }
  }
  return values;
}

const LIGHT = parseCustomProperties(css, ":root");
const DARK = parseCustomProperties(css, ".dark");

type TokenNote = { name: string; usage: string };
type TokenGroup = { title: string; note: string; tokens: TokenNote[] };

/** The usage column is the one hand-written thing here. A name in a group
 *  that the sheet does not declare renders "(unset)" rather than being hidden,
 *  and a name the sheet declares that no group describes is listed at the end
 *  under "In the sheet, not yet described", so neither side can drift quietly. */
const GROUPS: TokenGroup[] = [
  {
    title: "Page and panels",
    note: "Each surface ships with the ink that reads on it. card and popover equal background in this sheet, so a panel's edge comes from border, never from tint.",
    tokens: [
      { name: "background", usage: "The page. bg-background text-foreground is the body rule." },
      {
        name: "foreground",
        usage:
          "Body ink. The quiet tiers derive from it: text-foreground/70 is the registry's pinned quiet step (TOK-8).",
      },
      { name: "card", usage: "A raised panel (bg-card, 25 uses in the registry)." },
      { name: "card-foreground", usage: "Ink on a card." },
      { name: "popover", usage: "Floating surfaces: menus, popovers, tooltips, dialogs." },
      { name: "popover-foreground", usage: "Ink on a floating surface." },
      {
        name: "sidebar",
        usage: "The app sidebar's own surface, painted by the vendored Sidebar that B1 app-sidebar composes.",
      },
      { name: "sidebar-foreground", usage: "Ink in the sidebar." },
    ],
  },
  {
    title: "Actions",
    note: "The accent is near-black. Saturated colour is reserved for destructive, and for the warning token the registry adds (below).",
    tokens: [
      { name: "primary", usage: "The one accent: the primary button's fill (bg-primary, 40 uses)." },
      { name: "primary-foreground", usage: "Ink on the primary fill." },
      { name: "secondary", usage: "Secondary button fill. The same value as muted and accent." },
      { name: "secondary-foreground", usage: "Ink on the secondary fill." },
      {
        name: "accent",
        usage:
          "The hover and selection wash: hover:bg-accent hover:text-accent-foreground is the registry's hover recipe (22 uses).",
      },
      {
        name: "accent-foreground",
        usage: "Ink on the wash, and the value the rebind idiom points muted text at inside a muted surface.",
      },
      {
        name: "destructive",
        usage:
          "Errors and destructive actions, the one saturated colour. No foreground pair ships: solid destructive pairs with text-background.",
      },
      { name: "sidebar-primary", usage: "The sidebar's active fill." },
      { name: "sidebar-primary-foreground", usage: "Ink on the sidebar's active fill." },
      { name: "sidebar-accent", usage: "The sidebar's hover wash." },
      { name: "sidebar-accent-foreground", usage: "Ink on the sidebar's hover wash." },
    ],
  },
  {
    title: "Quiet text and its trap",
    note: "muted, accent and secondary hold one value. text-muted-foreground on any of them measures 4.34:1 against a 4.5:1 minimum; check:tokens fails the single-element shape, the axe gate catches the composed one.",
    tokens: [
      {
        name: "muted",
        usage: "A quiet inset surface (bg-muted, 92 uses). Never under text-muted-foreground.",
      },
      {
        name: "muted-foreground",
        usage:
          "Secondary text on background or card. Inside a muted surface, rebind it: [--muted-foreground:var(--accent-foreground)].",
      },
    ],
  },
  {
    title: "Lines",
    note: "Borders and the focus ring. The ring is grey on purpose, so focus reads as a position, not a status.",
    tokens: [
      { name: "border", usage: "Every hairline: * { @apply border-border } in the base layer." },
      { name: "input", usage: "Form control edges." },
      { name: "ring", usage: "The focus ring: focus-visible:ring-2 focus-visible:ring-ring (74 uses)." },
      { name: "sidebar-border", usage: "Hairlines inside the sidebar." },
      { name: "sidebar-ring", usage: "The focus ring inside the sidebar." },
    ],
  },
  {
    title: "Charts",
    note: "A lightness ramp, not a hue set. chart-1 is the lightest step and chart-5 the darkest in both modes.",
    tokens: [
      { name: "chart-1", usage: "First series. usage-dashboard binds its single series to it." },
      { name: "chart-2", usage: "Second series." },
      { name: "chart-3", usage: "Third series." },
      {
        name: "chart-4",
        usage:
          "Fourth series. The only place indigo or violet would be allowed to exist (COL-6), and here it is grey.",
      },
      { name: "chart-5", usage: "Fifth series. A sixth series is Other or a second chart." },
    ],
  },
  {
    title: "Shape",
    note: "One knob. The named radii are calc() multiples of it in the @theme inline block, so moving --radius retunes every corner.",
    tokens: [
      {
        name: "radius",
        usage:
          "The base corner. rounded-lg is this value; sm, md, xl and 2xl are 0.6, 0.8, 1.4 and 1.8 times it.",
      },
    ],
  },
  {
    title: "Added by the registry",
    note: "The one token this registry adds beyond stock shadcn. It ships to consumers as cssVars on the items that paint it (WARNING_CSS_VARS in lib/catalog.manifest.ts) and the consumer install test asserts it lands. It is deliberately undefined in this workbench: defining it without choosing its value would turn several components red at once, and text-warning measures about 2.2:1 where it does resolve. Recorded in a11y-baseline.md, Gate hole, and CONTINUE.md §8.",
    tokens: [
      {
        name: "warning",
        usage:
          "The near-limit third state across the M family: quota-meter thresholds, credits-indicator low, rate-limit cooldown.",
      },
      { name: "warning-foreground", usage: "Ink on a solid warning fill." },
    ],
  },
];

const DESCRIBED = new Set(GROUPS.flatMap((group) => group.tokens.map((token) => token.name)));
const UNDESCRIBED = [...LIGHT.keys()].filter((name) => !DESCRIBED.has(name));

/** Reads the resolved value live from CSS so the label can never go stale.
 *  The probe is its own element so that the dark probe can sit inside a
 *  `.dark` scope without the label's own colour following it onto the light
 *  page. Renders "(unset)" when the custom property does not resolve, which is
 *  what surfaces the registry's warning token as the gap it is. */
function useTokenValue(name: string, dark: boolean) {
  const [value, setValue] = React.useState("");
  const probe = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (probe.current) {
      setValue(getComputedStyle(probe.current).getPropertyValue(`--${name}`).trim());
    }
  }, [name]);
  return {
    value,
    probe: <span ref={probe} hidden aria-hidden className={dark ? "dark" : undefined} />,
  };
}

function ValueCell({ name, dark }: { name: string; dark: boolean }) {
  const { value, probe } = useTokenValue(name, dark);
  return (
    <td className="text-muted-foreground py-2 pr-4 font-mono text-xs">
      {probe}
      {value || "(unset)"}
    </td>
  );
}

function Swatch({ name, dark }: { name: string; dark?: boolean }) {
  const box = (
    <div className="border-border size-8 rounded-md border" style={{ background: `var(--${name})` }} />
  );
  // The dark swatch sits on a dark page backdrop so translucent dark tokens
  // (border is 10% white there) stay visible against something.
  return dark ? <div className="dark bg-background inline-block rounded-md p-1 align-top">{box}</div> : box;
}

function TokenTable({ group }: { group: TokenGroup }) {
  return (
    <section className="mb-10">
      <h2 className="text-foreground mb-1 text-sm font-medium">{group.title}</h2>
      <p className="text-muted-foreground mb-3 max-w-3xl text-xs">{group.note}</p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-border text-muted-foreground border-b text-xs">
              <th scope="col" className="w-52 py-2 pr-4 font-medium">
                Token
              </th>
              <th scope="col" className="w-12 py-2 pr-4 font-medium">
                Light
              </th>
              <th scope="col" className="w-40 py-2 pr-4 font-medium">
                Light value
              </th>
              <th scope="col" className="w-12 py-2 pr-4 font-medium">
                Dark
              </th>
              <th scope="col" className="w-40 py-2 pr-4 font-medium">
                Dark value
              </th>
              <th scope="col" className="py-2 font-medium">
                Usage
              </th>
            </tr>
          </thead>
          <tbody>
            {group.tokens.map((token) => (
              <tr key={token.name} className="border-border border-b align-top">
                <th scope="row" className="py-2 pr-4 text-left font-normal">
                  <code className="text-xs">--{token.name}</code>
                </th>
                <td className="py-2 pr-4">
                  <Swatch name={token.name} />
                </td>
                <ValueCell name={token.name} dark={false} />
                <td className="py-2 pr-4">
                  <Swatch name={token.name} dark />
                </td>
                <ValueCell name={token.name} dark />
                <td className="text-muted-foreground py-2 text-sm">{token.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const RADIUS_STEPS = [
  { utility: "rounded-sm", factor: "0.6" },
  { utility: "rounded-md", factor: "0.8" },
  { utility: "rounded-lg", factor: "1" },
  { utility: "rounded-xl", factor: "1.4" },
  { utility: "rounded-2xl", factor: "1.8" },
] as const;

/** Measures the rendered corner, so the pixel labels come from the browser. */
function RadiusStep({ utility, factor }: { utility: string; factor: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [px, setPx] = React.useState("");
  React.useEffect(() => {
    if (ref.current) setPx(getComputedStyle(ref.current).borderTopLeftRadius);
  }, []);
  return (
    <figure className="m-0 flex w-32 flex-col gap-2">
      <div ref={ref} className={`bg-muted border-border h-16 w-full border ${utility}`} />
      <figcaption className="text-muted-foreground font-mono text-xs">
        {utility} · {factor}× · {px || "…"}
      </figcaption>
    </figure>
  );
}

function FontRow({ name, sample }: { name: string; sample: string }) {
  return (
    <tr className="border-border border-b">
      <th scope="row" className="w-52 py-2 pr-4 text-left font-normal">
        <code className="text-xs">--{name}</code>
      </th>
      <td className="py-2 text-lg" style={{ fontFamily: `var(--${name})` }}>
        {sample}
      </td>
    </tr>
  );
}

function DesignTokens() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Design tokens</h1>
      <p className="text-muted-foreground mb-8 max-w-3xl text-sm">
        Names and declared values are parsed from <code className="text-foreground">src/index.css</code>;
        swatches and value columns read the live custom properties. {LIGHT.size} tokens are declared for light
        and {DARK.size} for dark. Nothing on this page is typed in by hand except the usage column, and a
        token the sheet declares that no group describes is listed at the end rather than hidden.
      </p>
      {GROUPS.map((group) => (
        <TokenTable key={group.title} group={group} />
      ))}
      <section className="mb-10">
        <h2 className="text-foreground mb-1 text-sm font-medium">The radius scale, measured</h2>
        <p className="text-muted-foreground mb-3 max-w-3xl text-xs">
          Five utilities, one variable. Every step is a calc() over --radius in the @theme inline block.
        </p>
        <div className="flex flex-wrap gap-4">
          {RADIUS_STEPS.map((step) => (
            <RadiusStep key={step.utility} {...step} />
          ))}
        </div>
      </section>
      <section className="mb-10">
        <h2 className="text-foreground mb-1 text-sm font-medium">Type families</h2>
        <p className="text-muted-foreground mb-3 max-w-3xl text-xs">
          Geist and Geist Mono. The docs site loads them through next/font; this workbench loads them from
          Google Fonts in src/index.css and points the same variables at them.
        </p>
        <table className="w-full border-collapse text-left">
          <tbody>
            <FontRow name="font-sans" sample="Describe a shot and every result lands here." />
            <FontRow name="font-geist-mono" sample="flux-1-dev · seed 884201773 · dpmpp_2m" />
          </tbody>
        </table>
      </section>
      <section className="mb-10">
        <h2 className="text-foreground mb-1 text-sm font-medium">In the sheet, not yet described</h2>
        {UNDESCRIBED.length === 0 ? (
          <p className="text-muted-foreground text-xs">Every declared token has a usage note above.</p>
        ) : (
          <ul className="text-muted-foreground list-disc pl-5 font-mono text-xs">
            {UNDESCRIBED.map((name) => (
              <li key={name}>--{name}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const meta = {
  title: "Foundations/Design Tokens",
  component: DesignTokens,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DesignTokens>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The whole sheet: every token, both modes, live values, and the radius and
 *  type scales measured off the rendered page. */
export const Tokens: Story = {};
