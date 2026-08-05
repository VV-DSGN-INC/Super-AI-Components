"use client";

import { FrameStrip, type FrameStripItem } from "@/registry/super-ai/frame-strip";

/**
 * Live examples for frame-strip.docs.tsx.
 *
 * Client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx is a Server Component and reads `docs.dos` / `docs.donts`
 * directly, so the docs module has to stay plain server-evaluable data. Every
 * example that needs a handler lives here and crosses into the docs module as
 * a zero-prop element. See workspace-switcher.docs.tsx +
 * workspace-switcher.examples.tsx for the pattern this follows.
 */

const FRAMES: FrameStripItem[] = ["00:00:00", "00:00:04", "00:00:08"].map((timecode, index) => ({
  id: `f${index + 1}`,
  label: timecode,
  thumbnail: <img src={`https://placehold.co/320x180?text=${index + 1}`} alt="" className="h-full w-full object-cover" />,
}));

const PAGES: FrameStripItem[] = ["1. Title", "2. Problem", "3. Results"].map((label, index) => ({
  id: `p${index + 1}`,
  label,
  thumbnail: <img src={`https://placehold.co/320x180?text=${index + 1}`} alt="" className="h-full w-full object-cover" />,
}));

/** One component, three content kinds — the same strip with different tiles. */
export function OneStripThreeKinds() {
  return (
    <div className="flex w-full flex-col gap-4">
      <FrameStrip kind="video" items={FRAMES} defaultValue="f2" />
      <FrameStrip kind="slides" items={PAGES} defaultValue="p1" onAdd={() => {}} />
    </div>
  );
}

/** Labels carry the identity, so the picture can stay decorative. */
export function LabelledFrames() {
  return <FrameStrip kind="video" items={FRAMES} defaultValue="f1" />;
}

/** In and out are marked in words, and both marks are ringed. */
export function InOutMarks() {
  return <FrameStrip kind="video" variant="in-out" items={FRAMES} defaultInPoint="f1" defaultOutPoint="f3" />;
}

/** Reorder controls appear on hover and stay reachable by keyboard. */
export function ReorderableStrip() {
  return <FrameStrip kind="slides" items={PAGES} defaultValue="p2" onReorder={() => {}} onAdd={() => {}} />;
}

/**
 * Anti-pattern: the active item drawn as a border. Selecting the middle tile
 * pushes its neighbours by 4px — the reflow H5's ring exists to prevent. Not
 * the real component, on purpose.
 */
export function BorderedActiveItem() {
  return (
    <div className="flex items-start gap-3">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={
            index === 1
              ? "border-primary bg-muted h-16 w-28 rounded-lg border-2"
              : "bg-muted h-16 w-28 rounded-lg"
          }
        />
      ))}
    </div>
  );
}

/**
 * Anti-pattern: frames identified by picture alone. Nothing here is
 * announceable, and nothing distinguishes frame two from frame three.
 */
export function UnlabelledFrames() {
  return (
    <div className="flex items-start gap-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="bg-muted h-16 w-28 overflow-hidden rounded-lg">
          <img src="https://placehold.co/320x180" alt="" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
