/** The one sentence every install surface repeats. The README, the docs page's
 *  Installation block and the llms.txt header all render this constant, and
 *  scripts/lib/readme.test.ts fails if the README stops carrying it verbatim.
 *
 *  Plain prose on purpose: no backticks, no markdown, so the same bytes are
 *  correct in JSX, in a .md file and in llms.txt. Evidence for the claim:
 *  reviews/2026-09-10/evidence/super-ai-radix-consumer.log.txt, and
 *  CONTINUE.md §5.1 ("no registry mechanism expresses '…but adapted'"). */
export const COMPAT_NOTE =
  "Requires a shadcn app on Base UI (style base-nova). Radix-based styles such as new-york fail to typecheck: these components use Base UI's render prop and callbacks like onOpenChangeComplete, which Radix primitives do not have.";
