import type { Meta, StoryObj } from "@storybook/react-vite";

import { BrowserFrame } from "@/registry/super-ai/browser-frame";
import { PreviewTile } from "@/registry/super-ai/preview-tile";
import { BrowserFrameDocs } from "@/content/components/browser-frame.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const meta: Meta<typeof BrowserFrame> = {
  title: "Super AI/Browser Frame",
  component: BrowserFrame,
  parameters: { layout: "centered", docs: { page: componentDocsPage(BrowserFrameDocs) } },
};

export default meta;
type Story = StoryObj<typeof BrowserFrame>;

/** Stands in for the consumer's screenshot. The well is ratio-locked, so this fills it exactly. */
const Capture = () => (
  <div className="flex size-full items-center justify-center bg-muted text-sm text-foreground">
    Captured page
  </div>
);

/**
 * The full chrome: dots, controls and the address the content came from. This is
 * the shape to reach for when the frame is doing its actual job — saying that
 * what is inside came from somewhere other than this product.
 */
export const Page: Story = {
  args: { address: "https://vercel.com/geist/browser", children: <Capture /> },
  render: (args) => (
    <div className="w-full max-w-lg">
      <BrowserFrame {...args} />
    </div>
  ),
};

/**
 * Dots alone. Correct when the source is already obvious from the surrounding
 * context and a URL would only add noise — but note that dropping the address
 * also drops the only part of the chrome a screen reader can read.
 */
export const Minimal: Story = {
  args: { controls: false, children: <Capture /> },
  render: (args) => (
    <div className="w-full max-w-lg">
      <BrowserFrame {...args} />
    </div>
  ),
};

/**
 * Dark chrome against a light page, and the reverse in dark mode. It is a
 * surface, not a state: nothing about the content changes because the frame
 * inverted, and using it to mean something would be inventing a signal.
 */
export const Inverted: Story = {
  args: { address: "https://vercel.com/geist/browser", tone: "inverted", children: <Capture /> },
  render: (args) => (
    <div className="w-full max-w-lg">
      <BrowserFrame {...args} />
    </div>
  ),
};

/**
 * Middle truncation, not a trailing ellipsis. The host stays at the head and
 * the final path segment is pinned, so the URL loses its middle — the part that
 * says least. A trailing ellipsis would hide `build-image-v2`, which is exactly
 * the half that says what was looked at.
 */
export const LongAddress: Story = {
  args: {
    address: "https://vercel.com/docs/deployments/configure-a-build/build-image/build-image-v2",
    children: <Capture />,
  },
  render: (args) => (
    <div className="w-full max-w-lg">
      <BrowserFrame {...args} />
    </div>
  ),
};

/**
 * The skeleton occupies the same locked ratio the content will, so nothing on
 * the page moves when the capture resolves. There is no live region: the
 * transition announces nothing, and if it matters the announcement belongs on
 * whatever owns the fetch.
 */
export const Loading: Story = {
  args: { address: "https://vercel.com/geist/browser", loading: true },
  render: (args) => (
    <div className="w-full max-w-lg">
      <BrowserFrame {...args} />
    </div>
  ),
};

// —— Case stories ——————————————————————————————————————————————————————————
//
// case-skip: KeyboardOrder — the component has no focusable descendants under
//   any prop combination. The zero-tab-stop property is what matters and it is
//   pinned by assertion in browser-frame.test.tsx rather than by a story that
//   would show an empty tab sequence.
// case-skip: Controlled — no value/selection API. Nothing here is driven by
//   external state; every prop is a static description of the frame.
// case-skip: LongContent — the only author-supplied text slot is `address`,
//   and the truncation decision it makes is already the declared LongAddress
//   state above. A second story would render the same thing.

/**
 * Under `dir="rtl"` the dots and controls move to the right, and the back and
 * forward arrows mirror with them — reload does not, because it is not
 * directional. The address itself is left-to-right regardless: a URL is a URL.
 */
export const RTL: Story = {
  args: { address: "https://vercel.com/geist/browser", children: <Capture /> },
  render: (args) => (
    <div dir="rtl" className="w-full max-w-lg">
      <BrowserFrame {...args} />
    </div>
  ),
};

/**
 * The loading skeleton is the component's only motion, and it does branch:
 * `motion-reduce:animate-none` sits after Skeleton's own `animate-pulse` and
 * wins the tie by source order. Under reduce the well is a still block at the
 * same ratio, which is the point — the layout is identical either way.
 */
export const ReducedMotion: Story = {
  args: { address: "https://vercel.com/geist/browser", loading: true },
  render: (args) => (
    <div className="w-full max-w-lg">
      <BrowserFrame {...args} />
    </div>
  ),
};

/**
 * With no address the bar keeps its dots and controls but has nothing to
 * announce, so the whole component becomes decoration. Prefer this to a
 * plausible-looking placeholder URL: an empty bar is honest about not knowing.
 */
export const EmptyLabel: Story = {
  args: { children: <Capture /> },
  render: (args) => (
    <div className="w-full max-w-lg">
      <BrowserFrame {...args} />
    </div>
  ),
};

/**
 * At 375px the chrome keeps all three groups on one row and the address absorbs
 * the loss through its own truncation, so there is no horizontal scroll. The
 * dots are the first thing to consider dropping at this width — they cost
 * roughly a third of the bar and carry no information.
 */
export const Mobile: Story = {
  args: {
    address: "https://vercel.com/docs/deployments/configure-a-build/build-image/build-image-v2",
    children: <Capture />,
  },
  render: (args) => (
    <div className="w-[375px] max-w-full">
      <BrowserFrame {...args} />
    </div>
  ),
};

/**
 * The near twin is `preview-tile`, and the two are not interchangeable.
 * `preview-tile` is the selectable atom of a picker or grid: it can be pressed,
 * it reports selection, and it is part of your interface. `browser-frame` is a
 * provenance claim: it says the content came from outside the product, and it
 * is not interactive at all. Choose by what the frame asserts, not by shape —
 * if the user is picking one of several, it is a tile; if they are being shown
 * where something came from, it is a frame.
 */
export const Boundary: Story = {
  render: () => (
    <div className="flex items-start gap-6">
      <div className="w-72">
        <BrowserFrame address="https://vercel.com/geist/browser" ratio={16 / 10}>
          <Capture />
        </BrowserFrame>
      </div>
      <div className="w-44">
        <PreviewTile aspect="video" label="Captured page" />
      </div>
    </div>
  ),
};
