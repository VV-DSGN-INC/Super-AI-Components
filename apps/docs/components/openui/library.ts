import "./no-devtools";

import { createLibrary } from "@openuidev/react-lang";
import { z } from "zod";

import { catalogEntry } from "./catalog";
import { componentGroups, components, ROOT, surfaceSlugs } from "./surfaces";

export { ROOT };

export const openuiLibrary = createLibrary({ root: ROOT, components, componentGroups });

/** What the model reads. Generated, never authored: the surfaces and the
 *  catalog underneath them are the only inputs. */
export const systemPrompt = openuiLibrary.prompt();

/** A JSON Schema property's string enum, if it has one. Reading `.options`
 *  off the zod schema does not work: a union also carries `.options` (its
 *  member schemas), and a defaulted or optional enum needs unwrapping.
 *  `z.toJSONSchema` flattens all of that: a flat or defaulted enum shows up as
 *  `enum` directly, a bare-optional one as an `anyOf` member carrying it. */
function stringEnumOf(prop: unknown): string[] | null {
  if (!prop || typeof prop !== "object") return null;
  const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.every((x) => typeof x === "string");
  const direct = (prop as { enum?: unknown }).enum;
  if (isStringArray(direct)) return direct;
  const anyOf = (prop as { anyOf?: unknown }).anyOf;
  if (Array.isArray(anyOf)) {
    for (const member of anyOf) {
      const candidate = (member as { enum?: unknown } | null)?.enum;
      if (isStringArray(candidate)) return candidate;
    }
  }
  return null;
}

/** `metaAxes` names the enums whose values and intent come from the catalog;
 *  any other enum is the component's own TypeScript union, written here. */
export type ExposedSurface = {
  name: string;
  slug: string | null;
  enums: Record<string, string[]>;
  metaAxes: string[];
};

export const exposedSurfaces: ExposedSurface[] = components.map((c) => {
  const schema = z.toJSONSchema(c.props) as { properties?: Record<string, unknown> };
  const slug = surfaceSlugs[c.name] ?? null;
  const enums = Object.fromEntries(
    Object.entries(schema.properties ?? {})
      .map(([key, prop]) => [key, stringEnumOf(prop)] as const)
      .filter((pair): pair is readonly [string, string[]] => pair[1] !== null),
  );
  const axes = slug ? catalogEntry(slug).variants.map((v) => v.prop) : [];
  return { name: c.name, slug, enums, metaAxes: Object.keys(enums).filter((k) => axes.includes(k)) };
});
