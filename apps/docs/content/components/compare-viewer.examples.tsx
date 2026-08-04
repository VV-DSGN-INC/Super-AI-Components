"use client";

import { CompareViewer, type ComparePane } from "@/registry/super-ai/compare-viewer";

/**
 * Live examples for compare-viewer.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component
 * and cannot carry "use client" or handler-bearing JSX.
 */

function Pane({ tone, caption }: { tone: string; caption: string }) {
  return (
    <div className={`flex h-48 w-full items-end p-3 ${tone}`}>
      <span className="bg-background text-foreground rounded px-2 py-1 text-xs">{caption}</span>
    </div>
  );
}

const PANES: ComparePane[] = [
  { id: "a", label: "Original", content: <Pane tone="bg-foreground/10" caption="1080p source" /> },
  {
    id: "b",
    label: "Upscaled 4x",
    content: <Pane tone="bg-foreground/25" caption="4K, Topaz v4" />,
  },
];

/** DO — label the panes by what actually differs between them. */
export function LabelledByWhatDiffers() {
  return <CompareViewer panes={PANES} mode="side" onModeChange={() => {}} />;
}

/** DO — a wipe is a mode of this component, not a separate before/after widget. */
export function WipeIsAMode() {
  return (
    <CompareViewer
      panes={PANES}
      mode="wipe"
      wipePosition={45}
      onModeChange={() => {}}
      onWipePositionChange={() => {}}
    />
  );
}

/**
 * DON&apos;T — labels that name the panes rather than the difference.
 * &quot;Version A&quot; and &quot;Version B&quot; force the reader to remember
 * which was which, which is exactly what the numbers already do.
 */
export function LabelsThatSayNothing() {
  return (
    <CompareViewer
      panes={[
        { id: "a", label: "Version A", content: <Pane tone="bg-foreground/10" caption="A" /> },
        { id: "b", label: "Version B", content: <Pane tone="bg-foreground/25" caption="B" /> },
      ]}
      mode="side"
      onModeChange={() => {}}
    />
  );
}

/**
 * DON&apos;T — single mode with no `onActivePaneChange`. The numbers stop
 * being a control and the reader is stuck on whichever pane the caller chose.
 */
export function SingleModeWithNoSwitcher() {
  return <CompareViewer panes={PANES} mode="single" activePaneId="a" onModeChange={() => {}} />;
}
