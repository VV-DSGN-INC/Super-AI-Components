"use client";

import { Button } from "@/components/ui/button";
import { ShortcutsSheet } from "@/registry/super-ai/shortcuts-sheet";

/**
 * Live examples for shortcuts-sheet.docs.tsx.
 *
 * A client sidecar, kept separate from the docs module on purpose:
 * component-docs.tsx (a Server Component) reads `docs.whatItIs`,
 * `docs.evidence` and friends directly, so shortcuts-sheet.docs.tsx has to
 * stay plain server-evaluable data and cannot carry "use client" itself.
 *
 * Every example is driven by its own `trigger` rather than by an `open` prop,
 * which is what makes a live example of a portaled modal workable at all:
 * nothing is mounted over the docs page until the reader asks for it, and the
 * sheet manages its own open state so no handler crosses the boundary.
 */

export function GroupedByTheAppsVocabulary() {
  // The right way: sections named after the menus the user already knows, in
  // the order the app talks about itself.
  return (
    <ShortcutsSheet
      trigger={<Button variant="outline">Open shortcuts (grouped)</Button>}
      sections={[
        {
          title: "File",
          shortcuts: [
            { label: "New project", keys: ["Ctrl", "N"] },
            { label: "Open project", keys: ["Ctrl", "O"] },
            { label: "Export", keys: ["Ctrl", "Shift", "E"] },
          ],
        },
        {
          title: "Timeline",
          shortcuts: [
            { label: "Split clip", keys: ["S"] },
            { label: "Ripple delete", keys: ["Shift", "Del"] },
            { label: "Zoom to fit", keys: ["Shift", "Z"] },
          ],
        },
        {
          title: "Playback",
          shortcuts: [
            { label: "Play or pause", keys: ["Space"] },
            { label: "Step one frame", keys: ["Right"] },
            { label: "Jump to start", keys: ["Home"] },
          ],
        },
      ]}
    />
  );
}

export function SheetDocumentsItsOwnBinding() {
  // The right way: the first row of the first section is the binding that
  // opened this sheet. It is the one shortcut a user needs in order to find
  // every other one, so it is the one that must not be discoverable only by
  // accident.
  return (
    <ShortcutsSheet
      trigger={<Button variant="outline">Open shortcuts (self-documenting)</Button>}
      sections={[
        {
          title: "Help",
          shortcuts: [
            { label: "Show keyboard shortcuts", keys: ["Ctrl", "/"] },
            { label: "Open command palette", keys: ["Ctrl", "K"] },
          ],
        },
        {
          title: "Editing",
          shortcuts: [
            { label: "Undo", keys: ["Ctrl", "Z"] },
            { label: "Redo", keys: ["Ctrl", "Shift", "Z"] },
          ],
        },
      ]}
    />
  );
}

export function OneFlatSectionOfEverything() {
  // The wrong way: every binding in the product under one heading. Nothing is
  // findable by scanning, the h3 that should let a screen-reader user jump
  // between groups only ever fires once, and the reader is left doing a
  // linear read of the whole command registry.
  return (
    <ShortcutsSheet
      trigger={<Button variant="outline">Open shortcuts (one flat list)</Button>}
      sections={[
        {
          title: "Shortcuts",
          shortcuts: [
            { label: "New project", keys: ["Ctrl", "N"] },
            { label: "Open project", keys: ["Ctrl", "O"] },
            { label: "Export", keys: ["Ctrl", "Shift", "E"] },
            { label: "Undo", keys: ["Ctrl", "Z"] },
            { label: "Redo", keys: ["Ctrl", "Shift", "Z"] },
            { label: "Split clip", keys: ["S"] },
            { label: "Ripple delete", keys: ["Shift", "Del"] },
            { label: "Zoom to fit", keys: ["Shift", "Z"] },
            { label: "Play or pause", keys: ["Space"] },
            { label: "Step one frame", keys: ["Right"] },
            { label: "Jump to start", keys: ["Home"] },
            { label: "Toggle inspector", keys: ["Ctrl", "I"] },
          ],
        },
      ]}
    />
  );
}

export function UnnamedSheet() {
  // The wrong way: `title=""` to hide the heading. The title is the dialog's
  // accessible name, so this opens a modal that announces as nothing — and
  // the space the heading was taking is still there.
  return (
    <ShortcutsSheet
      title=""
      trigger={<Button variant="outline">Open shortcuts (unnamed dialog)</Button>}
      sections={[
        {
          title: "Editing",
          shortcuts: [
            { label: "Undo", keys: ["Ctrl", "Z"] },
            { label: "Redo", keys: ["Ctrl", "Shift", "Z"] },
          ],
        },
      ]}
    />
  );
}
