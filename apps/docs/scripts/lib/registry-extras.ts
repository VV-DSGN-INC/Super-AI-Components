import type { CssVars, ManifestItem } from "../../lib/manifest-types";

export type Extras = Record<
  string,
  { dependencies?: string[]; registryDependencies?: string[]; cssVars?: CssVars }
>;

/**
 * `pins` maps a package name to the range it ships with. Without one, a
 * dependency is emitted as a bare name and a consumer's install takes the
 * latest release, which for a 0.x package can be a different API.
 */
export function deriveExtras(
  items: ManifestItem[],
  self: (name: string) => string,
  pins: Record<string, string> = {},
): Extras {
  const extras: Extras = {};

  for (const item of items) {
    if (item.status !== "shipped") continue;

    const registryDependencies = [...item.shadcn, ...(item.external ?? []), ...item.consumes.map(self)];
    const entry: Extras[string] = {};
    if (registryDependencies.length) entry.registryDependencies = registryDependencies;
    if (item.npm.length)
      entry.dependencies = item.npm.map((name) => (pins[name] ? `${name}@${pins[name]}` : name));
    if (item.cssVars) entry.cssVars = item.cssVars;
    if (Object.keys(entry).length) extras[item.name] = entry;
  }

  return extras;
}
