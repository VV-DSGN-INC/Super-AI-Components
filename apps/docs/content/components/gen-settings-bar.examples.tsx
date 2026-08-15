"use client";

import { GenSettingsBar, GenSettingsItem } from "@/registry/super-ai/gen-settings-bar";

/**
 * Live examples for gen-settings-bar.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and so on directly, so gen-settings-bar.docs.tsx has to
 * stay plain server-evaluable data and cannot carry "use client" itself.
 * Every example lives here and crosses into the docs module as a zero-prop
 * element, so an `onClick` never has to serialize across the boundary.
 */

export function LockedWhileRunning() {
  return (
    <GenSettingsBar aria-label="Generation settings" disabled>
      <GenSettingsItem>Veo 3.1 Fast</GenSettingsItem>
      <GenSettingsItem>16:9</GenSettingsItem>
      <GenSettingsItem>720p</GenSettingsItem>
      <GenSettingsItem>4s</GenSettingsItem>
      <GenSettingsItem>×3</GenSettingsItem>
    </GenSettingsBar>
  );
}

export function SegmentsFollowTheModel() {
  return (
    <div className="flex flex-col gap-3">
      <GenSettingsBar aria-label="Video generation settings">
        <GenSettingsItem onClick={() => {}}>Veo 3.1 Fast</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>16:9</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>720p</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>4s</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>×3</GenSettingsItem>
      </GenSettingsBar>
      {/* Same bar, image model: duration is gone rather than greyed out. */}
      <GenSettingsBar aria-label="Image generation settings">
        <GenSettingsItem onClick={() => {}}>Imagen 4 Ultra</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>1:1</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>2K</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>×4</GenSettingsItem>
      </GenSettingsBar>
    </div>
  );
}

export function StripUsedToNarrowAList() {
  // The wrong way: the segments read as filters over a library that is
  // already on screen — a click here would change what you are looking at
  // rather than what the next run produces. That is filter-bar (A5), which
  // has the applied/clear-all semantics this strip deliberately lacks.
  return (
    <GenSettingsBar aria-label="Library filters">
      <GenSettingsItem onClick={() => {}}>All media</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>Last 7 days</GenSettingsItem>
      <GenSettingsItem onClick={() => {}}>Favourites</GenSettingsItem>
    </GenSettingsBar>
  );
}

export function SegmentsRepeatTheirOwnLabels() {
  // The wrong way: every segment restates the parameter name it already
  // implies. The strip has no truncation and no wrap, so the labels do not
  // shorten — they widen the bar until it overruns whatever holds it.
  return (
    <div className="w-80 rounded-md border p-2">
      <GenSettingsBar aria-label="Generation settings">
        <GenSettingsItem onClick={() => {}}>Model: Veo 3.1 Fast</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>Aspect ratio: 16:9</GenSettingsItem>
        <GenSettingsItem onClick={() => {}}>Resolution: 720p</GenSettingsItem>
      </GenSettingsBar>
    </div>
  );
}
