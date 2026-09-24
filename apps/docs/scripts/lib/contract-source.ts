/// <reference types="vite/client" />
import type { ComponentDocs } from "@/lib/component-docs";

import { pascal } from "./scaffold-templates";

// import.meta.glob is the only way to import by computed name under Vite
// without the dynamic-import-vars plugin guessing: the map is built at
// transform time from the real directory, so a typo in `name` is a missing
// key, never a silent empty module.
// Next 16.3 declares its own non-generic import.meta.glob for Turbopack,
// which shadows Vite's generic signature, so the element type is asserted below; the assertion is valid under both declarations.
const modules = import.meta.glob("../../content/components/*.docs.tsx") as Record<
  string,
  () => Promise<Record<string, unknown>>
>;

/** Relative to this file; the glob's keys are spelled the same way. */
export function docsModulePath(name: string): string {
  return `../../content/components/${name}.docs.tsx`;
}

/** Imports a shipped item's guidance module and returns its `<Pascal>Docs`
 *  export. Throws, naming the item, when the module is missing, fails to
 *  evaluate, or exports the wrong name: an emit that cannot read its source
 *  must fail loudly, never write a blank. */
export async function loadDocs(name: string): Promise<ComponentDocs> {
  const loader = modules[docsModulePath(name)];
  if (!loader) throw new Error(`${name}: no guidance module at content/components/${name}.docs.tsx`);
  const mod = await loader();
  const key = `${pascal(name)}Docs`;
  const docs = mod[key];
  if (!docs || typeof docs !== "object") {
    throw new Error(`${name}: content/components/${name}.docs.tsx does not export ${key}`);
  }
  return docs as ComponentDocs;
}
