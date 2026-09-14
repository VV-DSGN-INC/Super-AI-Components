import type { ComponentDocs, DocsNone, DocsVariant } from "@/lib/component-docs";

/** The floor under every reason, intent and `when`. A reason shorter than a
 *  sentence is a placeholder, and the scaffolder relies on that: it seeds
 *  "unwritten" so a scaffold is red until the judgment is written. */
export const MIN_REASON = 20;

const IDENT = /^[A-Za-z_$][\w$]*$/;

export function isNone(v: unknown): v is DocsNone {
  return typeof v === "object" && v !== null && !Array.isArray(v) && "none" in v;
}

/** The join key the story-coverage gate matches on. */
export function axisKey(axis: DocsVariant): string {
  return axis.propName ?? axis.prop;
}

function clearsFloor(s: unknown): boolean {
  return typeof s === "string" && s.trim().length >= MIN_REASON;
}

function validateAxis(name: string, axis: DocsVariant, i: number): string[] {
  const errors: string[] = [];
  const label = `variants[${i}]`;
  if (!axis.prop) errors.push(`${name}: ${label}.prop is empty`);
  if (!IDENT.test(axisKey(axis))) {
    errors.push(`${name}: ${label} needs propName as a bare identifier when prop "${axis.prop}" is not one`);
  }
  if (!Array.isArray(axis.values) || axis.values.length === 0) {
    errors.push(`${name}: ${label}.values is empty`);
    return errors;
  }
  const seen = new Set<string>();
  for (const v of axis.values) {
    if (!v.value) errors.push(`${name}: ${label} has a value with no name`);
    if (seen.has(v.value)) errors.push(`${name}: ${label} repeats value "${v.value}"`);
    seen.add(v.value);
    if (!clearsFloor(v.intent)) {
      errors.push(
        `${name}: ${label} value "${v.value}" needs an intent of at least ${MIN_REASON} characters`,
      );
    }
  }
  if (axis.default !== undefined && !seen.has(axis.default)) {
    errors.push(`${name}: ${label}.default "${axis.default}" is not one of its values`);
  }
  return errors;
}

/** Every way `docs` fails the contract, each prefixed with the item name;
 *  `[]` when valid. Checks only the two contract fields: the nine prose
 *  fields keep their needle rules in contract-rules.ts. An absent field is
 *  not an error here; contract-coverage.ts owns "unwritten". */
export function validateContract(name: string, docs: ComponentDocs, shipped: ReadonlySet<string>): string[] {
  const errors: string[] = [];
  const { variants, insteadUse } = docs;

  if (variants !== undefined) {
    if (isNone(variants)) {
      if (!clearsFloor(variants.none)) {
        errors.push(`${name}: variants.none needs a reason of at least ${MIN_REASON} characters`);
      }
    } else if (!Array.isArray(variants) || variants.length === 0) {
      errors.push(`${name}: variants must be a non-empty list or { none: <why> }`);
    } else {
      variants.forEach((axis, i) => errors.push(...validateAxis(name, axis, i)));
    }
  }

  if (insteadUse !== undefined) {
    if (isNone(insteadUse)) {
      if (!clearsFloor(insteadUse.none)) {
        errors.push(`${name}: insteadUse.none needs a reason of at least ${MIN_REASON} characters`);
      }
    } else if (!Array.isArray(insteadUse) || insteadUse.length === 0) {
      errors.push(`${name}: insteadUse must be a non-empty list or { none: <why> }`);
    } else {
      for (const r of insteadUse) {
        if (r.component === name) errors.push(`${name}: insteadUse points at itself`);
        else if (!shipped.has(r.component)) {
          errors.push(`${name}: insteadUse "${r.component}" is not a shipped manifest item`);
        }
        if (!clearsFloor(r.when)) {
          errors.push(
            `${name}: insteadUse[${r.component}].when needs a reason of at least ${MIN_REASON} characters`,
          );
        }
      }
    }
  }

  return errors;
}
