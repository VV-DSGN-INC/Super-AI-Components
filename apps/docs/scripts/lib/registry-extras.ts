import type { CssVars, ManifestItem } from "../../lib/manifest-types";

export type Extras = Record<
  string,
  { dependencies?: string[]; registryDependencies?: string[]; cssVars?: CssVars }
>;

export function deriveExtras(items: ManifestItem[], self: (name: string) => string): Extras {
  const extras: Extras = {};

  for (const item of items) {
    if (item.status !== "shipped") continue;

    const registryDependencies = [...item.shadcn, ...(item.external ?? []), ...item.consumes.map(self)];
    const entry: Extras[string] = {};
    if (registryDependencies.length) entry.registryDependencies = registryDependencies;
    if (item.npm.length) entry.dependencies = item.npm;
    if (item.cssVars) entry.cssVars = item.cssVars;
    if (Object.keys(entry).length) extras[item.name] = entry;
  }

  return extras;
}
