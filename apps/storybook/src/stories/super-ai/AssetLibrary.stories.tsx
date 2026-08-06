import type { Meta, StoryObj } from "@storybook/react-vite";
import { FolderPlus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AssetLibrary, type AssetLibraryItem } from "@/registry/super-ai/asset-library";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FilterChip } from "@/registry/super-ai/filter-bar";
import { AssetLibraryDocs } from "@/content/components/asset-library.docs";
import { componentDocsPage } from "@/lib/component-docs-page";

const FILES: AssetLibraryItem[] = [
  { id: "f1", name: "Brand kit.png", type: "Image", size: "2.4 MB", modified: "2 days ago" },
  { id: "f2", name: "Launch cut.mp4", type: "Video", size: "184 MB", modified: "Yesterday" },
  { id: "f3", name: "Hero scene.spline", type: "Scene", size: "9.1 MB", modified: "Last week" },
  { id: "f4", name: "Untitled export", type: "Image", modified: "Last week" },
];

const FOLDERS: AssetLibraryItem[] = [
  { id: "d1", name: "Campaign 2026", kind: "folder", itemCount: 24, modified: "Today" },
  { id: "d2", name: "Client handoff", kind: "folder", itemCount: 7, modified: "3 days ago" },
  { id: "d3", name: "Archive", kind: "folder", itemCount: 1, modified: "Last month" },
];

const headerActions = (
  <span className="flex items-center gap-2">
    <Button size="sm" variant="outline">
      <FolderPlus aria-hidden />
      New folder
    </Button>
    <Button size="sm">
      <Upload aria-hidden />
      Upload
    </Button>
  </span>
);

const filters = (
  <>
    <FilterChip active>Images</FilterChip>
    <FilterChip>Video</FilterChip>
    <FilterChip>Scenes</FilterChip>
  </>
);

const rowActions = (item: AssetLibraryItem) => (
  <>
    <DropdownMenuItem>Rename</DropdownMenuItem>
    <DropdownMenuItem>Move to folder</DropdownMenuItem>
    {item.kind === "folder" ? null : <DropdownMenuItem>Download</DropdownMenuItem>}
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
  </>
);

const meta: Meta<typeof AssetLibrary> = {
  title: "Super AI/Asset Library",
  component: AssetLibrary,
  parameters: { layout: "centered", docs: { page: componentDocsPage(AssetLibraryDocs) } },
  args: {
    title: "Assets",
    headerActions,
    filters,
    rowActions,
    onOpen: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-[52rem] max-w-full">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssetLibrary>;

/** Files only. Each row states its own type, size and modified date. */
export const File: Story = {
  args: { items: FILES },
};

/** Folders only — same table, same columns, item count where a size would be. */
export const Folder: Story = {
  args: { items: FOLDERS },
};

/** The state that proves the rule: one table, folders hoisted above files. */
export const Mixed: Story = {
  args: { items: [...FILES, ...FOLDERS] },
};

/**
 * L1 `empty-state` replaces the table — never the header, search or chips,
 * because whatever emptied the list has to stay reachable.
 */
export const Empty: Story = {
  args: {
    items: [],
    empty: (
      <EmptyState
        size="panel"
        title="No assets match those filters"
        description="Clear the search or a chip above to see the rest of the library."
        action={
          <Button size="sm" variant="outline">
            Clear filters
          </Button>
        }
      />
    ),
  },
};

/** Checkboxes replace the overflow menus, and the bulk bar reports the count. */
export const SelectionMode: Story = {
  args: {
    items: [...FILES, ...FOLDERS],
    selectionMode: true,
    selectedIds: ["d1", "f2"],
    onSelectionChange: () => {},
    bulkActions: (
      <>
        <Button size="sm" variant="outline">
          Move
        </Button>
        <Button size="sm" variant="outline">
          Download
        </Button>
        <Button size="sm" variant="outline">
          Delete
        </Button>
      </>
    ),
  },
};
