import type { ManifestItem } from "../../lib/manifest-types";

export type Extras = Record<string, { dependencies?: string[]; registryDependencies?: string[] }>;

export function deriveExtras(items: ManifestItem[], self: (name: string) => string): Extras {
  const extras: Extras = {};

  for (const item of items) {
    if (item.status !== "shipped") continue;

    const registryDependencies = [...item.shadcn, ...item.consumes.map(self)];
    const entry: Extras[string] = {};
    if (registryDependencies.length) entry.registryDependencies = registryDependencies;
    if (item.npm.length) entry.dependencies = item.npm;
    if (Object.keys(entry).length) extras[item.name] = entry;
  }

  return extras;
}
