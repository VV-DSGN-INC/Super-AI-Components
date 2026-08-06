"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AssetLibrary, type AssetLibraryItem } from "@/registry/super-ai/asset-library";

/**
 * Live examples for asset-library.docs.tsx.
 *
 * A client sidecar: the docs module is plain data read by a Server Component
 * and cannot carry "use client" or any handler-bearing JSX, so every example
 * with a callback lives here and crosses over as a zero-prop element.
 */

const MIXED: AssetLibraryItem[] = [
  { id: "d1", name: "Campaign 2026", kind: "folder", itemCount: 24, modified: "Today" },
  { id: "f1", name: "Brand kit.png", type: "Image", size: "2.4 MB", modified: "2 days ago" },
  { id: "f2", name: "Launch cut.mp4", type: "Video", size: "184 MB", modified: "Yesterday" },
];

const menu = () => (
  <>
    <DropdownMenuItem>Rename</DropdownMenuItem>
    <DropdownMenuItem>Move to folder</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </>
);

/** DO — one table. A folder fills the same columns a file does. */
export function FoldersAndFilesInOneTable() {
  return <AssetLibrary title="Assets" items={MIXED} onOpen={() => {}} rowActions={menu} />;
}

/** DO — one overflow menu per row, revealed on hover and on focus. */
export function RowActionsInAnOverflowMenu() {
  return (
    <AssetLibrary
      title="Assets"
      items={MIXED.slice(1)}
      onOpen={() => {}}
      rowActions={menu}
    />
  );
}

/** DO — selection mode swaps the menu for checkboxes and reveals the bulk bar. */
export function SelectionModeWithABulkBar() {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(["f1"]);
  return (
    <AssetLibrary
      title="Assets"
      items={MIXED}
      rowActions={menu}
      selectionMode
      selectedIds={selectedIds}
      onSelectionChange={setSelectedIds}
      bulkActions={
        <>
          <Button size="sm" variant="outline">
            Move
          </Button>
          <Button size="sm" variant="outline">
            Delete
          </Button>
        </>
      }
    />
  );
}

/**
 * DON'T — a clickable row that also holds a checkbox and a menu trigger.
 * Hand-built here because the component will not let you make one: two
 * interactive elements inside a third fail axe's nested-interactive rule, and
 * a screen reader announces the row as a single unnamed button.
 */
export function ClickableRowWithControlsInside() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <tbody>
          <tr className="border-b">
            <td className="p-0">
              <button
                type="button"
                className="text-foreground flex w-full items-center gap-3 p-2 text-left"
              >
                <input type="checkbox" aria-label="Select Brand kit.png" />
                <span className="flex-1 font-medium">Brand kit.png</span>
                <span className="rounded-md border px-2 py-0.5 text-xs">Actions</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * DON'T — selection mode with no `onSelectionChange`. The checkboxes and the
 * bulk bar render, but nothing can ever be ticked and the count stays at zero.
 */
export function SelectionModeWithoutAHandler() {
  return (
    <AssetLibrary
      title="Assets"
      items={MIXED}
      selectionMode
      selectedIds={[]}
      bulkActions={
        <Button size="sm" variant="outline">
          Delete
        </Button>
      }
    />
  );
}
