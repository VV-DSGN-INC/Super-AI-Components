# Wave 1: Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the case-story program's source fixes to consumers. Production serves all 133 registry items, and 69 of them differ from what `main` builds.

**Architecture:** Three tasks. Verify, deploy, verify again. There is no code change here; the work is confirming that what production serves matches what the repo builds, and that a consumer can still install it.

**Tech Stack:** Vercel CLI from `apps/docs`, the shadcn registry, `gh` for the account check.

**Spec:** [`docs/superpowers/specs/2026-09-06-post-case-story-remediation-design.md`](../specs/2026-09-06-post-case-story-remediation-design.md)

## Global Constraints

- **Wave 0 must be green on GitHub first.** Deploying from a red `main` ships what the Linux gate never verified, and the consumer install test is the step currently hidden behind the failure.
- **This wave needs the `weeeha` GitHub account and cannot be delegated to an agent.** The only account in `gh auth` is `nickvpegbo`, which has `push: false` on this repo. Re-authentication is interactive.
- Deploys are manual, from `apps/docs`. **Nothing ships on merge** — `ci.yml` only verifies.
- Nick's standing rule: never push to production without an explicit go. Confirm the target repo and branch out loud before deploying.
- This repo is under **VV-DSGN-INC**, not `weeeha`. Several sibling design repos live under `weeeha` and the two have been confused before.

---

### Task 1: Establish exactly what is stale

**Files:**

- Create: nothing. This task only measures.

**Interfaces:**

- Produces: the list of drifted item names, for the deploy commit message and for the post-deploy check.

- [ ] **Step 1: Build the registry locally**

```bash
pnpm --filter docs build:registry
```

Expected: `✔ Building registry.` and `apps/docs/registry.json` naming 133 items.

- [ ] **Step 2: Diff every served item against the local build**

```bash
node -e '
const fs = require("fs");
const names = JSON.parse(fs.readFileSync("apps/docs/registry.json", "utf8")).items.map((i) => i.name);
(async () => {
  const differ = [], missing = [];
  const queue = [...names];
  const worker = async () => {
    while (queue.length) {
      const n = queue.shift();
      let served;
      try {
        const r = await fetch(`https://super-ai-components.vercel.app/r/${n}.json`, { signal: AbortSignal.timeout(30000) });
        if (!r.ok) { missing.push(`${n} (${r.status})`); continue; }
        served = await r.json();
      } catch { missing.push(`${n} (network)`); continue; }
      const local = JSON.parse(fs.readFileSync(`apps/docs/public/r/${n}.json`, "utf8"));
      const a = Object.fromEntries((served.files ?? []).map((f) => [f.path, f.content]));
      const b = Object.fromEntries((local.files ?? []).map((f) => [f.path, f.content]));
      const paths = new Set([...Object.keys(a), ...Object.keys(b)]);
      if ([...paths].some((p) => a[p] !== b[p])) differ.push(n);
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`items ${names.length} · identical ${names.length - differ.length - missing.length} · differ ${differ.length} · missing ${missing.length}`);
  if (differ.length) console.log("DIFFER:\n" + differ.sort().join("\n"));
  if (missing.length) console.log("MISSING: " + missing.join(", "));
})();
'
```

Expected before deploying: `differ 69`, `missing 0`. Save the list.

- [ ] **Step 3: Confirm the account situation before going further**

```bash
gh auth status
gh api repos/VV-DSGN-INC/Super-AI-Components --jq .permissions
```

If `push` is `false`, stop. Re-authenticate as `weeeha` interactively; do not work around it.

---

### Task 2: Deploy

- [ ] **Step 1: Say the target out loud**

State the repo, the branch, the commit and the target environment before running anything. `VV-DSGN-INC/Super-AI-Components`, not a `weeeha` sibling.

- [ ] **Step 2: Confirm CI is green on the commit being shipped**

```bash
gh run list --repo VV-DSGN-INC/Super-AI-Components --branch main --limit 1
```

Expected: `completed  success`. If it is `failure`, wave 0 is not finished and this wave has not started.

- [ ] **Step 3: Deploy from `apps/docs`**

```bash
cd apps/docs && pnpm build:registry && vercel deploy --prod
```

`build:registry` runs first deliberately: `REGISTRY_URL` defaults to the production host, and a stale `public/r/` would publish yesterday's JSON alongside today's pages.

- [ ] **Step 4: Record the deployment URL**

Keep it. Task 3 checks against production, and the preview URL is what gets reported.

---

### Task 3: Verify what consumers actually get

A green deploy is not a working registry.

- [ ] **Step 1: Re-run the drift check**

Run Task 1 step 2 again.

Expected: `differ 0`, `missing 0`. Any remaining difference means the deploy published a stale `public/r/`.

- [ ] **Step 2: Install into a fresh app against production**

```bash
cd "$(mktemp -d)"
pnpm dlx create-next-app@latest consumer --ts --tailwind --app --no-src-dir \
  --import-alias "@/*" --eslint --turbopack --use-pnpm --yes
cd consumer && pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add --yes https://super-ai-components.vercel.app/r/thread-list.json
pnpm build
```

Expected: the component files land under `components/super-ai/`, and `next build` typechecks the chain. This is the README's own install line, run against the host the README names.

- [ ] **Step 3: Check the docs site renders**

Open the deployment and confirm a component page renders its demo, not just that the build succeeded. A green build is not a working page.

- [ ] **Step 4: Report the link**

Give the deployment URL. Prefer the short production host over a hashed preview URL.

---

## Wave exit gate

- The drift check reports `differ 0`.
- A fresh app installs from the production host and builds.
- A component page renders its demo in the browser.
- The deployment URL is in hand.
