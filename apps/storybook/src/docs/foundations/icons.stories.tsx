import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* The icon vocabulary this registry actually ships, derived from its sources.
   ICO-1 (packages/ds-rules) makes lucide-react the only icon library allowed
   in registry sources, so the vocabulary is exactly the set of names the
   registry imports from it. That set is read here by globbing the registry
   sources as raw text and parsing their lucide imports, so a new glyph in a
   component appears on this page with no second edit, and a glyph nothing
   imports any more disappears. Lazy glob: the sources load when the story
   mounts, not with the bundle. */

const SOURCES = import.meta.glob(
  ["../../../../docs/registry/super-ai/*.tsx", "!../../../../docs/registry/super-ai/*.test.tsx"],
  { query: "?raw", import: "default" },
) as Record<string, () => Promise<string>>;

const IMPORT_RE = /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*["']lucide-react["']/g;

/** The imported names in one source file. `X as Y` keeps X (the glyph);
 *  `type LucideIcon` is dropped at lookup because it is not a component. */
function lucideNamesIn(source: string): string[] {
  const names: string[] = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    for (const raw of match[1].split(",")) {
      const spec = raw.trim().replace(/^type\s+/, "");
      if (!spec) continue;
      const [imported] = spec.split(/\s+as\s+/);
      names.push(imported.trim());
    }
  }
  return names;
}

const LUCIDE = Lucide as unknown as Record<string, unknown>;

/** lucide-react exports each glyph as a forwardRef object, and an alias
 *  (`Loader2` for `LoaderCircle`) is the same object under a second name. */
function isIcon(value: unknown): value is LucideIcon {
  return typeof value === "object" && value !== null && "$$typeof" in value;
}

type IconEntry = {
  name: string;
  icon: LucideIcon;
  /** Registry files importing this name, without the .tsx suffix. */
  files: string[];
  /** Other names the registry imports for the same glyph. */
  aliases: string[];
};

type Inventory = {
  entries: IconEntry[];
  sourceCount: number;
  importingFiles: number;
  /** Imported names lucide-react does not export as a component. */
  unresolved: string[];
};

async function readInventory(): Promise<Inventory> {
  const sources = await Promise.all(
    Object.entries(SOURCES).map(async ([path, load]) => [path, await load()] as const),
  );
  const files = new Map<string, Set<string>>();
  const unresolved = new Set<string>();
  let importingFiles = 0;
  for (const [path, source] of sources) {
    const names = lucideNamesIn(source);
    if (names.length === 0) continue;
    importingFiles += 1;
    const file = path.replace(/^.*\//, "").replace(/\.tsx$/, "");
    for (const name of names) {
      if (!isIcon(LUCIDE[name])) {
        unresolved.add(name);
        continue;
      }
      files.set(name, (files.get(name) ?? new Set()).add(file));
    }
  }
  // Group names by the component object they resolve to, so an alias pair
  // the registry imports under both names is visible as one glyph.
  const byIcon = new Map<unknown, string[]>();
  for (const name of files.keys()) {
    const icon = LUCIDE[name];
    byIcon.set(icon, [...(byIcon.get(icon) ?? []), name]);
  }
  const entries = [...files.entries()]
    .map(([name, fileSet]) => ({
      name,
      icon: LUCIDE[name] as LucideIcon,
      files: [...fileSet].sort(),
      aliases: (byIcon.get(LUCIDE[name]) ?? []).filter((other) => other !== name).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { entries, sourceCount: sources.length, importingFiles, unresolved: [...unresolved].sort() };
}

function useInventory() {
  const [inventory, setInventory] = React.useState<Inventory | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    readInventory().then((result) => {
      if (!cancelled) setInventory(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return inventory;
}

function copyToClipboard(text: string) {
  // The Clipboard API needs a secure context; the textarea fallback covers
  // plain http previews and the vitest browser runner.
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

const TILE =
  "border-border hover:bg-accent hover:[--muted-foreground:var(--accent-foreground)] focus-visible:ring-ring flex min-w-0 flex-col items-center gap-2 rounded-lg border bg-transparent px-2 py-4 transition-colors focus-visible:ring-2 focus-visible:outline-none";

function IconTile({ entry, copied, onCopy }: { entry: IconEntry; copied: boolean; onCopy: () => void }) {
  const Icon = entry.icon;
  const count = entry.files.length;
  return (
    <button
      type="button"
      onClick={onCopy}
      title={`${entry.name} — ${count} ${count === 1 ? "file" : "files"}${
        entry.aliases.length ? `; also imported as ${entry.aliases.join(", ")}` : ""
      }`}
      className={TILE}
    >
      <Icon size={24} aria-hidden className="text-foreground" />
      <span className="text-muted-foreground w-full truncate text-center text-xs">
        {copied ? "Copied" : entry.name}
      </span>
      <span className="text-muted-foreground text-xs tabular-nums">{count}</span>
    </button>
  );
}

function SearchBox({ query, onChange }: { query: string; onChange: (next: string) => void }) {
  return (
    <Input
      type="search"
      role="searchbox"
      placeholder="Search icons…"
      aria-label="Search icons"
      value={query}
      onChange={(event) => onChange(event.target.value)}
      className="mt-6 max-w-sm"
    />
  );
}

function ClearSearch({ onClear }: { onClear: () => void }) {
  return (
    <button
      type="button"
      onClick={onClear}
      className="text-foreground border-border hover:bg-accent focus-visible:ring-ring mt-3 h-8 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      Clear search
    </button>
  );
}

function Loading({ count }: { count: number }) {
  return (
    <p role="status" className="text-muted-foreground mt-6 text-sm">
      Reading {count} registry sources…
    </p>
  );
}

function AllIconsPage() {
  const inventory = useInventory();
  const [query, setQuery] = React.useState("");
  const [copiedName, setCopiedName] = React.useState<string | null>(null);
  const resetTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(resetTimer.current), []);

  const q = query.trim().toLowerCase();
  const results = inventory
    ? q
      ? inventory.entries.filter(
          (entry) =>
            entry.name.toLowerCase().includes(q) ||
            entry.aliases.some((alias) => alias.toLowerCase().includes(q)) ||
            entry.files.some((file) => file.includes(q)),
        )
      : inventory.entries
    : [];

  const copy = (name: string) => {
    copyToClipboard(name);
    setCopiedName(name);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopiedName(null), 1200);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Icons</h1>
      <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
        {inventory
          ? `${inventory.entries.length} lucide-react glyphs, imported by ${inventory.importingFiles} of the ${inventory.sourceCount} registry sources. `
          : "The registry's icon vocabulary, read from its sources. "}
        Only lucide-react ships icons in registry sources (ICO-1), so this is the whole vocabulary. Select a
        tile to copy its import name; the number is how many components import it. Search matches import
        names, aliases and component names.
      </p>
      {inventory && inventory.unresolved.length > 0 ? (
        <p className="text-muted-foreground mt-2 text-xs">
          Imported from lucide-react but not a glyph: {inventory.unresolved.join(", ")}.
        </p>
      ) : null}
      <SearchBox query={query} onChange={setQuery} />
      {!inventory ? (
        <Loading count={Object.keys(SOURCES).length} />
      ) : (
        <>
          <p className="text-muted-foreground mt-4 text-xs">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
          {results.length === 0 ? (
            <div className="mt-3">
              <p className="text-muted-foreground text-sm">
                No icon matches “{query}”. A glyph enters the vocabulary by being imported from lucide-react
                in a registry component; lucide.dev lists the candidates.
              </p>
              <ClearSearch onClear={() => setQuery("")} />
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
              {results.map((entry) => (
                <IconTile
                  key={entry.name}
                  entry={entry}
                  copied={copiedName === entry.name}
                  onCopy={() => copy(entry.name)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UsagePage() {
  const inventory = useInventory();
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const rows = inventory
    ? [...inventory.entries]
        .sort((a, b) => b.files.length - a.files.length || a.name.localeCompare(b.name))
        .filter(
          (entry) =>
            !q ||
            entry.name.toLowerCase().includes(q) ||
            entry.files.some((file) => file.includes(q)) ||
            entry.aliases.some((alias) => alias.toLowerCase().includes(q)),
        )
    : [];
  const aliased = inventory ? inventory.entries.filter((entry) => entry.aliases.length > 0) : [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-foreground text-2xl font-semibold tracking-tight">Where each glyph ships</h1>
      <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
        One row per import name, most-used first, with the components that import it. Two names that resolve
        to the same lucide glyph are listed with their alias, because a glyph imported under two names is one
        decision written twice.
      </p>
      {inventory && aliased.length > 0 ? (
        <p className="text-muted-foreground mt-2 max-w-3xl text-xs">
          Same glyph under two names:{" "}
          {aliased.map((entry) => `${entry.name} = ${entry.aliases.join(" = ")}`).join("; ")}.
        </p>
      ) : null}
      <SearchBox query={query} onChange={setQuery} />
      {!inventory ? (
        <Loading count={Object.keys(SOURCES).length} />
      ) : (
        <>
          <p className="text-muted-foreground mt-4 text-xs">
            {rows.length} icon{rows.length === 1 ? "" : "s"}
          </p>
          {rows.length === 0 ? (
            <div className="mt-3">
              <p className="text-muted-foreground text-sm">No icon matches “{query}”.</p>
              <ClearSearch onClear={() => setQuery("")} />
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-border text-muted-foreground border-b text-xs">
                    <th scope="col" className="w-48 py-2 pr-4 font-medium">
                      Name
                    </th>
                    <th scope="col" className="w-12 py-2 pr-4 font-medium">
                      Files
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Imported by
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => {
                    const Icon = entry.icon;
                    return (
                      <tr key={entry.name} className="border-border border-b align-top">
                        <th scope="row" className="py-2 pr-4 text-left font-normal">
                          <span className="flex items-center gap-2">
                            <Icon size={16} aria-hidden className="text-foreground" />
                            <span className="text-foreground text-sm font-medium">{entry.name}</span>
                          </span>
                          {entry.aliases.length > 0 ? (
                            <span className="text-muted-foreground block text-xs">
                              also {entry.aliases.join(", ")}
                            </span>
                          ) : null}
                        </th>
                        <td className="text-muted-foreground py-2 pr-4 text-sm tabular-nums">
                          {entry.files.length}
                        </td>
                        <td className="py-2">
                          <span className="flex flex-wrap gap-1">
                            {entry.files.map((file) => (
                              <code
                                key={file}
                                className={cn(
                                  "border-border text-foreground rounded border px-1.5 py-0.5 text-xs",
                                )}
                              >
                                {file}
                              </code>
                            ))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const meta = {
  title: "Foundations/Icons",
  component: AllIconsPage,
  parameters: { layout: "padded" },
} satisfies Meta<typeof AllIconsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  name: "All icons",
};

export const Usage: Story = {
  name: "Where each glyph ships",
  render: () => <UsagePage />,
};

/** The search indexes import names, aliases and component names on purpose:
 *  someone who knows the component (`run-button`) must land on the glyphs it
 *  ships, and someone who knows the old alias must land on the current name.
 *  If this play fails, the inventory lost one of its indexes. */
export const SearchFindsImportNames: Story = {
  name: "Search — matches import and component names",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("searchbox");
    // The inventory loads asynchronously; the tile appears once it has.
    await canvas.findByRole("button", { name: /^Loader2/ }, { timeout: 15000 });
    await userEvent.type(input, "loader");
    await expect(canvas.getByRole("button", { name: /^Loader2/ })).toBeVisible();
    await userEvent.clear(input);
    await userEvent.type(input, "run-button");
    await expect(canvas.getAllByRole("button").length).toBeGreaterThan(0);
    await userEvent.clear(input);
    await userEvent.type(input, "no-such-icon");
    await expect(canvas.getByText(/No icon matches/)).toBeVisible();
  },
};
