import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const REPO = resolve(__dirname, "../../../..");
const CLAUDE_MD = join(REPO, "CLAUDE.md");
const UNGATED = join(REPO, "docs/design-system/UNGATED.md");

/** May only be lowered. Raising it is a diff a reviewer sees (spec §8.1). */
const CEILING = 14_500;
/** The file must sit within this many bytes of the ceiling, so the ceiling
 *  ratchets down as the file shrinks instead of sitting idle. */
const HEADROOM = 2_000;

const SECTION = "## Rules that are easy to break by accident";
// A path in one of the roots that hold tests, scripts or CI.
const REPO_PATH = /`((?:packages|apps|scripts|tools|\.github)\/[^`\s]+)`/g;
// …and of those, only the ones that can actually fail: a test, a runnable
// script, or the workflow. Naming the file a rule protects is not a gate —
// `catalog.manifest.ts` is the thing guarded, `catalog.manifest.test.ts` is
// what guards it, and a rule that cites only the former has no teeth.
const GATE_SHAPE = /(\.test\.tsx?$|\.mts$|\.mjs$|\.sh$|ci\.yml$)/;

function rulesSection(text: string): string {
  const start = text.indexOf(SECTION);
  expect(start, `CLAUDE.md has no "${SECTION}" heading`).toBeGreaterThan(-1);
  const rest = text.slice(start + SECTION.length);
  const end = rest.indexOf("\n## ");
  return end === -1 ? rest : rest.slice(0, end);
}

/** Bullets in the section, each joined across its continuation lines. */
function bullets(section: string): string[] {
  const out: string[] = [];
  for (const line of section.split("\n")) {
    if (line.startsWith("- ")) out.push(line.slice(2));
    else if (line.startsWith("  ") && out.length) out[out.length - 1] += ` ${line.trim()}`;
  }
  return out;
}

describe("CLAUDE.md size", () => {
  const bytes = Buffer.byteLength(readFileSync(CLAUDE_MD));

  it(`is under the ceiling (${CEILING} bytes; the constant may only go down)`, () => {
    expect(bytes).toBeLessThanOrEqual(CEILING);
  });

  it(`is within ${HEADROOM} bytes of the ceiling (lower CEILING when the file shrinks)`, () => {
    expect(bytes).toBeGreaterThan(CEILING - HEADROOM);
  });
});

describe("CLAUDE.md stub provenance", () => {
  const section = rulesSection(readFileSync(CLAUDE_MD, "utf8"));
  const ungated = existsSync(UNGATED) ? readFileSync(UNGATED, "utf8") : "";
  const items = bullets(section);

  it("has rule bullets to check (zero means the section moved, not that it is clean)", () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it.each(items.map((b) => [b.slice(0, 60), b] as const))(
    "%s names an existing gate or an UNGATED reason",
    (_, bullet) => {
      const paths = [...bullet.matchAll(REPO_PATH)]
        .map((m) => m[1])
        .filter((p) => GATE_SHAPE.test(p) && existsSync(join(REPO, p)));
      const bold = /^\*\*([^*]+)\*\*/.exec(bullet)?.[1];
      const excused = bold !== undefined && ungated.includes(bold);
      expect(
        paths.length > 0 || excused,
        `Rule has no gate path that exists and no entry in docs/design-system/UNGATED.md: ${bullet.slice(0, 120)}`,
      ).toBe(true);
    },
  );
});
