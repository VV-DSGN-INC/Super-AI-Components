"use client";

import { FolderPlus, Upload } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AssetLibrary, type AssetLibraryItem } from "@/registry/super-ai/asset-library";
import { EmptyState } from "@/registry/super-ai/empty-state";
import { FilterChip } from "@/registry/super-ai/filter-bar";

const ITEMS: AssetLibraryItem[] = [
  { id: "d1", name: "Campaign 2026", kind: "folder", itemCount: 24, modified: "Today" },
  { id: "d2", name: "Archive", kind: "folder", itemCount: 1, modified: "Last month" },
  { id: "f1", name: "Brand kit.png", type: "Image", size: "2.4 MB", modified: "2 days ago" },
  { id: "f2", name: "Launch cut.mp4", type: "Video", size: "184 MB", modified: "Yesterday" },
  { id: "f3", name: "Hero scene.spline", type: "Scene", size: "9.1 MB", modified: "Last week" },
  { id: "f4", name: "Untitled export", type: "Image", modified: "Last week" },
];

const FACETS = ["Images", "Video", "Scenes"] as const;

export default function AssetLibraryDemo() {
  const [search, setSearch] = React.useState("");
  const [facets, setFacets] = React.useState<string[]>([]);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Filtering lives here, not in the component: it renders the field and the
  // chips, the caller decides what the list contains.
  const items = ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesFacet =
      facets.length === 0 ||
      item.kind === "folder" ||
      facets.some((facet) => facet.startsWith(item.type ?? ""));
    return matchesSearch && matchesFacet;
  });

  return (
    <div className="w-full">
      <AssetLibrary
        title="Assets"
        items={items}
        search={search}
        onSearchChange={setSearch}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onOpen={() => {}}
        headerActions={
          <span className="flex items-center gap-2">
            <Button
              size="sm"
              variant={selectionMode ? "default" : "outline"}
              onClick={() => {
                setSelectionMode((mode) => !mode);
                setSelectedIds([]);
              }}
            >
              {selectionMode ? "Done" : "Select"}
            </Button>
            <Button size="sm" variant="outline">
              <FolderPlus aria-hidden />
              New folder
            </Button>
            <Button size="sm">
              <Upload aria-hidden />
              Upload
            </Button>
          </span>
        }
        filters={FACETS.map((facet) => (
          <FilterChip
            key={facet}
            active={facets.includes(facet)}
            onClick={() =>
              setFacets((current) =>
                current.includes(facet)
                  ? current.filter((f) => f !== facet)
                  : [...current, facet],
              )
            }
            onRemove={facets.includes(facet) ? () => setFacets((c) => c.filter((f) => f !== facet)) : undefined}
          >
            {facet}
          </FilterChip>
        ))}
        bulkActions={
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
        }
        rowActions={(item) => (
          <>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Move to folder</DropdownMenuItem>
            {item.kind === "folder" ? null : <DropdownMenuItem>Download</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </>
        )}
        empty={
          <EmptyState
            size="panel"
            title="No assets match those filters"
            description="Clear the search or a chip above to see the rest of the library."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setFacets([]);
                }}
              >
                Clear filters
              </Button>
            }
          />
        }
      />
    </div>
  );
}
