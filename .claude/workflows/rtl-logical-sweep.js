export const meta = {
  name: "rtl-logical-sweep",
  description:
    "Swap physical-direction Tailwind utilities for logical ones across registry sources, one agent per file, every swap refuted-or-kept by a skeptic before it stays",
  whenToUse:
    "The CONTINUE.md §8 logical-direction sweep, or after a batch lands carrying ml-/pl-/left-/text-left classes. Pass args.files (repo-relative paths) to scope a run; omit it to let the scout grep the registry.",
  phases: [
    { title: "Scope", detail: "grep registry sources, apply the do-not-swap list" },
    { title: "Swap", detail: "one low-effort agent per file; edits only that file" },
    { title: "Verify", detail: "one skeptic per file reads the diff and tries to refute it" },
    { title: "Repair", detail: "one repair round for refuted files, then revert" },
  ],
};

// ---------------------------------------------------------------------------
// The contract. Everything below the schemas is plumbing in plain code; the
// agents do the reading and the editing, nothing else.
// ---------------------------------------------------------------------------

// Physical → logical. Every pair compiles to the same declaration in LTR
// (CONTINUE.md §8, "Logical properties: decided"), so the only effect of a swap
// is RTL correctness. Anything outside this table is not a swap.
const SWAP_TABLE = [
  ["ml-", "ms-"],
  ["mr-", "me-"],
  ["pl-", "ps-"],
  ["pr-", "pe-"],
  ["border-l", "border-s"],
  ["border-r", "border-e"],
  ["rounded-l", "rounded-s"],
  ["rounded-r", "rounded-e"],
  ["text-left", "text-start"],
  ["text-right", "text-end"],
  ["left-", "start-"],
  ["right-", "end-"],
];

// Horizontally-scrolled pixel canvases, plus Base UI's own `data-[side=…]`
// values. Physical direction is the meaning in these files; they are never
// swapped, whatever the scout says.
const DO_NOT_SWAP = [
  "timeline-view",
  "calendar-view",
  "time-ruler",
  "track-lane",
  "compare-viewer",
  "frame-strip",
  "timeline-shell",
  "track-list",
  "coach-mark",
];

// Change together or not at all: the shell retargets the row's arrows through
// descendant selectors (`[&_[data-slot=feature-card-row-next]]:right-0`), so a
// swap on one side silently breaks the override on the other. Enforced twice:
// a lone partner is dropped before the sweep, and a partner whose other half
// did not land is reverted after it.
const COUPLED = [["notebook-shell", "feature-card-row"]];

const TABLE_TEXT = SWAP_TABLE.map(([from, to]) => `${from} → ${to}`).join(", ");

const LINE_ITEMS = {
  swaps: {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["line", "from", "to"],
      properties: { line: { type: "integer" }, from: { type: "string" }, to: { type: "string" } },
    },
  },
  kept: {
    type: "array",
    description: "physical tokens deliberately left in place, with the reason",
    items: {
      type: "object",
      additionalProperties: false,
      required: ["line", "token", "reason"],
      properties: { line: { type: "integer" }, token: { type: "string" }, reason: { type: "string" } },
    },
  },
};

const SCOPE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["files", "excluded"],
  properties: {
    files: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "tokens"],
        properties: {
          path: { type: "string", description: "repo-relative path" },
          tokens: { type: "array", items: { type: "string" } },
        },
      },
    },
    excluded: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["path", "reason"],
        properties: { path: { type: "string" }, reason: { type: "string" } },
      },
    },
  },
};

const SWAP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["path", "swaps", "kept", "formatted"],
  properties: {
    path: { type: "string" },
    ...LINE_ITEMS,
    formatted: { type: "boolean", description: "prettier --write ran on the file" },
  },
};

const VERDICT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["path", "ok", "problems"],
  properties: {
    path: { type: "string" },
    ok: { type: "boolean" },
    problems: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["line", "issue", "fix"],
        properties: { line: { type: "integer" }, issue: { type: "string" }, fix: { type: "string" } },
      },
    },
  },
};

// A repair returns the claim as it now stands, so the second skeptic judges the
// repaired diff against the repaired claim rather than the original one. The
// first run of this workflow lost two valid swaps to exactly that mismatch.
const REPAIR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["path", "action", "note", "swaps", "kept"],
  properties: {
    path: { type: "string" },
    action: { type: "string", enum: ["repaired", "reverted"] },
    note: { type: "string" },
    ...LINE_ITEMS,
  },
};

// ---------------------------------------------------------------------------
// Prompts. Each names exactly one file and forbids everything else.
// ---------------------------------------------------------------------------

const base = (p) =>
  p
    .split("/")
    .pop()
    .replace(/\.tsx$/, "");

const NEVER_SWAP_RULES = `Never swap:
- a token inside a data-[side=…] variant (Base UI's own physical sides);
- a *-1/2 offset paired with a translate-x on the same element (start-1/2 -translate-x-1/2 is not centered in RTL) — leave the pair physical;
- a token whose job is to displace a vendored primitive's own physical class through cn()/tailwind-merge (a consumer's left-2 on CarouselPrevious, which carries -left-12): tailwind-merge keeps left-* and start-* in different groups, so after the swap both classes survive and LTR changes — leave it physical and report it under kept;
- rtl: or ltr: prefixed classes, and any token a comment at the site says must stay physical;
- words in prose or comments (left-to-right, right-aligned, "the arrows sit at -left-12").`;

const scopePrompt = () => `Map a sweep. Do not edit anything.

From the repo root, list registry source files under apps/docs/registry/ (both super-ai/ and marketing/) — .tsx only, never .stories.tsx or .test.tsx — that render a physical-direction Tailwind utility from this table inside a class string (className, cn(...), cva variants, string constants joined into a class list):
${TABLE_TEXT}. Negative and arbitrary-value forms count (-ml-4, left-[calc(…)]).

Use grep, then open each hit and drop files whose only matches are in comments or prose (a JSDoc block quoting \`ml-auto\`, words like left-to-right or right-aligned). Drop these files outright, physical direction is their meaning: ${DO_NOT_SWAP.join(", ")}.

Return files (repo-relative path, the tokens found) and excluded (path, reason) for every file you dropped for any reason other than "no rendered token".`;

const swapPrompt = (
  f,
) => `You are one node in a sweep. Edit exactly one file: ${f.path}. Do not touch any other file. Do not run typecheck, lint, tests, or any git command that writes.

Replace physical-direction Tailwind utilities with their logical equivalents using ONLY this table (physical → logical): ${TABLE_TEXT}. Negative and arbitrary-value forms follow the same rule (-ml-4 → -ms-4, left-[calc(…)] → start-[calc(…)]). Every pair compiles to the same declaration in LTR; the point is RTL correctness, so a swap that would change LTR rendering is a mistake.

Swap only tokens inside a class string the component renders (className, cn(...), cva variants, string constants joined into a class list). When the class string is passed to a composed or vendored component, open that component and check what it already carries on the same side.

${NEVER_SWAP_RULES}

Keep a comment accurate if it names the class you changed and describes the current code; otherwise leave comments alone, and do not add new ones — reasons go in your report, not in the source.

When done, run from the repo root: pnpm exec prettier --write ${f.path} — and nothing else.

Return: path (repo-relative); swaps (line, from, to for every token changed); kept (line, token, reason for every physical token from the table you deliberately left); formatted.`;

const verifyPrompt = (
  f,
  claim,
  partnerInRun,
) => `You are the skeptic on the edge of a sweep. Another agent edited ${f.path} and claims these swaps: ${JSON.stringify(claim.swaps)} and deliberately kept these: ${JSON.stringify(claim.kept)}. Your job is to refute the edit. Read \`git diff -- ${f.path}\` and the current file. Do not edit anything.

Refute (ok=false, one problem per line with a concrete fix) if ANY of these hold:
1. A hunk changes anything other than a physical→logical token from this table: ${TABLE_TEXT}. Extra edits, reordered classes, added comments, comment rewrites beyond keeping a class name accurate — anything. Prettier's own line reflow of a changed line is not an edit.
2. A swap is not byte-identical in LTR: it touches a data-[side=…] variant, a *-1/2 offset paired with translate-x, an rtl:/ltr: prefixed class, a token a nearby comment says must stay physical, or a token whose job was to displace a vendored primitive's own physical class through cn()/tailwind-merge (left-* and start-* are different tailwind-merge groups, so both survive after the swap). Open the composed component and check.
3. A physical token from the table sits in a rendered class string, was left unswapped, and is not listed under kept with a reason that actually holds.
4. The file is one of ${DO_NOT_SWAP.join(", ")}; or it is half of a coupled pair (${COUPLED.map((p) => p.join(" + ")).join("; ")}) and its partner is ${partnerInRun ? "" : "NOT "}in this run — a coupled file may only change when its partner changes too.
5. A comment that names a changed class now describes code that no longer exists.
6. The claim and the diff disagree: a listed swap is not in the diff, or a change in the diff is not in the claim.

If none hold, ok=true with an empty problems list. Default to refuting when unsure.`;

const repairPrompt = (
  f,
  verdict,
) => `Repair one file: ${f.path}. A skeptic refuted the last edit with these problems: ${JSON.stringify(verdict.problems)}.

Fix exactly those problems, in that file only, staying inside this table: ${TABLE_TEXT}. Returning a token to physical is a valid fix; add no comments — the reason goes under kept in your report.
${NEVER_SWAP_RULES}
If any problem cannot be fixed without leaving the table, run \`git checkout -- ${f.path}\` and report action=reverted with empty swaps and kept. Otherwise run \`pnpm exec prettier --write ${f.path}\` and report action=repaired. Touch nothing else.

Return path, action, note, and the claim as it now stands: swaps (every token the diff still changes, line/from/to) and kept (every physical table token left in place, line/token/reason) — read \`git diff -- ${f.path}\` after your edit and describe that, not what you intended.`;

const revertPrompt = (f, why) =>
  `Revert one file: ${f.path}. Run \`git checkout -- ${f.path}\` from the repo root and nothing else. Reason, for the record: ${why}. Return path, action=reverted, note, and empty swaps and kept.`;

// ---------------------------------------------------------------------------
// Scope: the caller's list, or the scout's. The exclusion table is applied in
// code either way, so a misread by the scout cannot reach the swap stage.
// ---------------------------------------------------------------------------

const wanted = Array.isArray(args?.files) && args.files.length ? args.files : null;
let scope;
if (wanted) {
  scope = { files: wanted.map((p) => ({ path: p, tokens: [] })), excluded: [] };
  log(`Scoped by args: ${wanted.length} files`);
} else {
  phase("Scope");
  scope = await agent(scopePrompt(), { label: "scope", phase: "Scope", schema: SCOPE_SCHEMA, effort: "low" });
  if (!scope) throw new Error("scope agent returned nothing; pass args.files to run without the scout");
  log(`Scout found ${scope.files.length} files, excluded ${scope.excluded.length}`);
}

const dropped = [];
let files = scope.files.filter((f) => {
  const hit = DO_NOT_SWAP.find((n) => base(f.path) === n);
  if (hit) dropped.push({ path: f.path, reason: `do-not-swap: ${hit}` });
  return !hit;
});

for (const pair of COUPLED) {
  const present = pair.map((n) => files.some((f) => base(f.path) === n));
  if (present[0] !== present[1]) {
    const lone = pair[present[0] ? 0 : 1];
    const loneFile = files.find((f) => base(f.path) === lone);
    files = files.filter((f) => base(f.path) !== lone);
    dropped.push({
      path: loneFile.path,
      reason: `coupled with ${pair.find((n) => n !== lone)}, which is not in this run`,
    });
  }
}
if (dropped.length)
  log(`Dropped by the table: ${dropped.map((d) => `${base(d.path)} (${d.reason})`).join("; ")}`);
log(`Sweeping ${files.length} files`);

const partnerInRun = (f) => {
  const pair = COUPLED.find((p) => p.includes(base(f.path)));
  if (!pair) return true;
  const partner = pair.find((n) => n !== base(f.path));
  return files.some((g) => base(g.path) === partner);
};

const revert = (f, why) =>
  agent(revertPrompt(f, why), {
    label: `revert:${base(f.path)}`,
    phase: "Repair",
    schema: REPAIR_SCHEMA,
    effort: "low",
  });

// ---------------------------------------------------------------------------
// Swap → verify → (repair → verify → revert). No barrier: a small file is
// finished and verified while a large one is still being edited.
// ---------------------------------------------------------------------------

const results = await pipeline(
  files,
  (f) =>
    agent(swapPrompt(f), {
      label: `swap:${base(f.path)}`,
      phase: "Swap",
      schema: SWAP_SCHEMA,
      effort: "low",
    }),
  async (swap, f) => {
    const name = base(f.path);
    if (!swap) return { path: f.path, outcome: "swap-failed" };
    if (!swap.swaps.length) return { path: f.path, outcome: "nothing-to-swap", kept: swap.kept };

    const verify = (n, claim) =>
      agent(verifyPrompt(f, claim, partnerInRun(f)), {
        label: `verify${n}:${name}`,
        phase: "Verify",
        schema: VERDICT_SCHEMA,
        effort: "medium",
      });

    const v1 = await verify("", swap);
    if (!v1) {
      await revert(f, "verifier returned nothing; an unverified edit must not stay");
      return { path: f.path, outcome: "reverted", why: "unverified" };
    }
    if (v1.ok) return { path: f.path, outcome: "swapped", swaps: swap.swaps, kept: swap.kept };

    const r = await agent(repairPrompt(f, v1), {
      label: `repair:${name}`,
      phase: "Repair",
      schema: REPAIR_SCHEMA,
      effort: "low",
    });
    if (!r || r.action === "reverted") return { path: f.path, outcome: "reverted", why: v1.problems };
    if (!r.swaps.length)
      return { path: f.path, outcome: "nothing-to-swap", kept: r.kept, repaired: v1.problems };

    const v2 = await verify("2", r);
    if (v2?.ok) {
      return {
        path: f.path,
        outcome: "swapped-after-repair",
        swaps: r.swaps,
        kept: r.kept,
        repaired: v1.problems,
      };
    }

    await revert(f, "refuted twice: " + JSON.stringify((v2 ?? v1).problems));
    return { path: f.path, outcome: "reverted", why: (v2 ?? v1).problems };
  },
);

// ---------------------------------------------------------------------------
// Fan-in is plain code. Coupled pairs are reconciled here because the pipeline
// judged each half on its own. The gates are a chain by design (CLAUDE.md,
// "CI") and run in the main session afterwards, not here.
// ---------------------------------------------------------------------------

const rows = results.filter(Boolean);
const landed = (r) => r.outcome === "swapped" || r.outcome === "swapped-after-repair";

for (const pair of COUPLED) {
  const halves = pair.map((n) => rows.find((r) => base(r.path) === n)).filter(Boolean);
  if (halves.length !== 2) continue;
  const [a, b] = halves;
  if (landed(a) === landed(b)) continue;
  const winner = landed(a) ? a : b;
  const loser = landed(a) ? b : a;
  log(`Coupled pair split: ${base(loser.path)} did not land, reverting ${base(winner.path)} to match`);
  await revert({ path: winner.path }, `coupled partner ${base(loser.path)} did not land (${loser.outcome})`);
  winner.outcome = "reverted";
  winner.why = `coupled partner ${base(loser.path)} did not land`;
}

const by = (o) => rows.filter((r) => r.outcome === o);
const swapped = rows.filter(landed);
const reverted = by("reverted");
const untouched = by("nothing-to-swap");
const failed = by("swap-failed");
const missing = files.length - rows.length;

log(
  `Done: ${swapped.length} swapped, ${reverted.length} reverted, ${untouched.length} had nothing to swap, ${failed.length} failed` +
    (missing ? `, ${missing} dropped by the pipeline` : ""),
);

return {
  swapped,
  reverted,
  untouched,
  failed,
  droppedByTable: dropped,
  excludedByScout: scope.excluded,
  next: "pnpm format:check && pnpm typecheck, then scripts/linux-gate.sh on every touched component's story file; a swap that changes LTR rendering fails its RTL story, and that is the verdict that counts.",
};
