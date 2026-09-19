/** js-yaml ships no types and @types/js-yaml is not installed. This declares
 *  the one function ci-steps.ts uses. The result is `unknown` on purpose: the
 *  caller narrows it. */
declare module "js-yaml" {
  export function load(input: string): unknown;
}
